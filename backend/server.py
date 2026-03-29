from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import uuid
import bcrypt
import jwt
import requests as http_requests
import re
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional, List

FIREBASE_DB_URL = os.environ.get('FIREBASE_DB_URL', 'https://discuss-13fbc-default-rtdb.firebaseio.com')
JWT_SECRET = os.environ.get('JWT_SECRET', 'd9f2c8a7e4b1f6d3a0e5c9b2f8d4a7e1c6b3f0d5a8e2c7b4f1d6a3e0c5b9f2')
JWT_ALGORITHM = "HS256"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Firebase RTDB helpers ---
def fb_get(path):
    r = http_requests.get(f"{FIREBASE_DB_URL}/{path}.json", timeout=10)
    return r.json() if r.status_code == 200 else None

def fb_put(path, data):
    r = http_requests.put(f"{FIREBASE_DB_URL}/{path}.json", json=data, timeout=10)
    return r.json() if r.status_code == 200 else None

def fb_post(path, data):
    r = http_requests.post(f"{FIREBASE_DB_URL}/{path}.json", json=data, timeout=10)
    return r.json() if r.status_code == 200 else None

def fb_patch(path, data):
    r = http_requests.patch(f"{FIREBASE_DB_URL}/{path}.json", json=data, timeout=10)
    return r.json() if r.status_code == 200 else None

def fb_delete(path):
    return http_requests.delete(f"{FIREBASE_DB_URL}/{path}.json", timeout=10).status_code == 200

def hash_password(pw): return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
def verify_password(plain, hashed): return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id, username, email):
    return jwt.encode({"sub": user_id, "username": username, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        ah = request.headers.get("Authorization", "")
        if ah.startswith("Bearer "): token = ah[7:]
    if not token: raise HTTPException(401, "Not authenticated")
    try:
        p = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if p.get("type") != "access": raise HTTPException(401, "Invalid token")
        u = fb_get(f"users/{p['sub']}")
        if not u: raise HTTPException(401, "User not found")
        u.pop("password_hash", None); u["id"] = p["sub"]; return u
    except jwt.ExpiredSignatureError: raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError: raise HTTPException(401, "Invalid token")

def extract_hashtags(text):
    return list(set(re.findall(r'#(\w+)', text))) if text else []

def safe_dict(v): return v if isinstance(v, dict) else {}

# --- Vote helpers ---
def get_vote_data(post_id):
    votes = safe_dict(fb_get(f"votes/{post_id}"))
    up = sum(1 for v in votes.values() if v == "up")
    down = sum(1 for v in votes.values() if v == "down")
    return {"upvote_count": up, "downvote_count": down, "votes": votes}

# --- Models ---
class RegisterRequest(BaseModel):
    username: str; email: str; password: str
class LoginRequest(BaseModel):
    email: str; password: str
class CreatePostRequest(BaseModel):
    type: str; title: Optional[str] = ""; content: str
    github_link: Optional[str] = ""; preview_link: Optional[str] = ""
    hashtags: Optional[List[str]] = []
class UpdatePostRequest(BaseModel):
    title: Optional[str] = None; content: Optional[str] = None
    github_link: Optional[str] = None; preview_link: Optional[str] = None
    hashtags: Optional[List[str]] = None
class CreateCommentRequest(BaseModel):
    text: str
class GoogleAuthRequest(BaseModel):
    uid: str; email: str; display_name: str; photo_url: Optional[str] = ""
class VoteRequest(BaseModel):
    vote_type: str  # "up" or "down"

# --- Auth ---
@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    email = req.email.lower().strip(); username = req.username.strip()
    if not username or not email or not req.password: raise HTTPException(400, "All fields are required")
    if len(req.password) < 6: raise HTTPException(400, "Password must be at least 6 characters")
    if len(username) < 2: raise HTTPException(400, "Username must be at least 2 characters")
    if not re.match(r'^[a-zA-Z0-9_]+$', username): raise HTTPException(400, "Username can only contain letters, numbers, and underscores")
    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email): raise HTTPException(400, "Please enter a valid email address")
    users = safe_dict(fb_get("users"))
    for uid, ud in users.items():
        if ud.get("email","").lower() == email: raise HTTPException(400, "This email is already registered. Try signing in instead.")
        if ud.get("username","").lower() == username.lower(): raise HTTPException(400, f'Username "{username}" is already taken. Please choose another.')
    user_id = str(uuid.uuid4())
    fb_put(f"users/{user_id}", {"username": username, "email": email, "password_hash": hash_password(req.password), "auth_provider": "email", "created_at": datetime.now(timezone.utc).isoformat()})
    token = create_access_token(user_id, username, email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "username": username, "email": email, "created_at": datetime.now(timezone.utc).isoformat(), "token": token}

@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    email = req.email.lower().strip()
    if not email: raise HTTPException(400, "Email is required")
    if not req.password: raise HTTPException(400, "Password is required")
    for uid, ud in safe_dict(fb_get("users")).items():
        if ud.get("email","").lower() == email:
            if ud.get("auth_provider") == "google" and not ud.get("password_hash"):
                raise HTTPException(400, "This account uses Google sign-in. Please use 'Continue with Google' to log in.")
            if not ud.get("password_hash"): raise HTTPException(400, "This account uses Google sign-in. Please use 'Continue with Google'.")
            if verify_password(req.password, ud["password_hash"]):
                token = create_access_token(uid, ud["username"], ud["email"])
                response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
                return {"id": uid, "username": ud["username"], "email": ud["email"], "created_at": ud.get("created_at",""), "token": token}
            raise HTTPException(401, "Incorrect password. Please try again.")
    raise HTTPException(404, "No account found with this email. Please check your email or sign up.")

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/"); return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request): return get_current_user(request)

@api_router.post("/auth/google")
async def google_auth(req: GoogleAuthRequest, response: Response):
    email = req.email.lower().strip(); dn = req.display_name.strip() or email.split("@")[0]
    users = safe_dict(fb_get("users"))
    for uid, ud in users.items():
        if ud.get("email","").lower() == email:
            if req.photo_url and req.photo_url != ud.get("photo_url",""): fb_patch(f"users/{uid}", {"photo_url": req.photo_url})
            token = create_access_token(uid, ud["username"], ud["email"])
            response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
            return {"id": uid, "username": ud["username"], "email": ud["email"], "created_at": ud.get("created_at",""), "photo_url": ud.get("photo_url",""), "token": token}
    user_id = req.uid or str(uuid.uuid4())
    base = re.sub(r'[^a-zA-Z0-9_]', '', dn.replace(" ","")).lower()[:15] or email.split("@")[0].replace(".","")[:15]
    username = base; c = 1
    for uid, ud in users.items():
        if ud.get("username","").lower() == username.lower(): username = f"{base}{c}"; c += 1
    fb_put(f"users/{user_id}", {"username": username, "email": email, "password_hash": "", "photo_url": req.photo_url or "", "auth_provider": "google", "created_at": datetime.now(timezone.utc).isoformat()})
    token = create_access_token(user_id, username, email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "username": username, "email": email, "created_at": datetime.now(timezone.utc).isoformat(), "photo_url": req.photo_url or "", "token": token}

@api_router.get("/auth/check-username/{username}")
async def check_username(username: str):
    for uid, ud in safe_dict(fb_get("users")).items():
        if ud.get("username","").lower() == username.lower(): return {"available": False, "message": f'Username "{username}" is already taken'}
    return {"available": True, "message": "Username is available"}

@api_router.get("/auth/check-email/{email}")
async def check_email(email: str):
    e = email.lower().strip()
    for uid, ud in safe_dict(fb_get("users")).items():
        if ud.get("email","").lower() == e: return {"available": False, "message": "This email is already registered"}
    return {"available": True, "message": "Email is available"}

# --- Posts ---
@api_router.get("/posts")
async def get_posts(request: Request, search: Optional[str] = None):
    get_current_user(request)
    posts_data = safe_dict(fb_get("posts"))
    votes_data = safe_dict(fb_get("votes"))
    comments_data = safe_dict(fb_get("comments"))
    posts_list = []
    for pid, pd in posts_data.items():
        if not isinstance(pd, dict): continue
        pv = safe_dict(votes_data.get(pid))
        pc = safe_dict(comments_data.get(pid))
        up = sum(1 for v in pv.values() if v == "up")
        down = sum(1 for v in pv.values() if v == "down")
        posts_list.append({
            "id": pid, **pd,
            "upvote_count": up, "downvote_count": down,
            "comment_count": len(pc), "votes": pv
        })
    if search:
        q = search.lower().strip()
        posts_list = [p for p in posts_list if
            q in p.get("title","").lower() or q in p.get("content","").lower() or
            q in p.get("author_username","").lower() or q in p.get("type","").lower() or
            any(q.lstrip('#') in t.lower() for t in (p.get("hashtags") or []))]
    posts_list.sort(key=lambda x: x.get("timestamp",""), reverse=True)
    return posts_list

@api_router.post("/posts")
async def create_post(req: CreatePostRequest, request: Request):
    user = get_current_user(request)
    if req.type not in ["discussion","project"]: raise HTTPException(400, "Invalid post type")
    # Discussion posts don't need title, project posts do
    if req.type == "project" and not (req.title or "").strip(): raise HTTPException(400, "Project title is required")
    if not req.content.strip(): raise HTTPException(400, "Content is required")
    content_tags = extract_hashtags(req.content)
    title_tags = extract_hashtags(req.title or "")
    all_tags = list(set((req.hashtags or []) + content_tags + title_tags))
    all_tags = [t.lower().strip() for t in all_tags if t.strip()]
    post_data = {
        "type": req.type, "title": (req.title or "").strip(), "content": req.content.strip(),
        "github_link": (req.github_link or "").strip(), "preview_link": (req.preview_link or "").strip(),
        "hashtags": all_tags, "author_username": user["username"], "author_id": user["id"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    result = fb_post("posts", post_data)
    if result and "name" in result:
        post_data["id"] = result["name"]; post_data["upvote_count"] = 0; post_data["downvote_count"] = 0
        post_data["comment_count"] = 0; post_data["votes"] = {}
        return post_data
    raise HTTPException(500, "Failed to create post")

@api_router.put("/posts/{post_id}")
async def update_post(post_id: str, req: UpdatePostRequest, request: Request):
    user = get_current_user(request)
    post = fb_get(f"posts/{post_id}")
    if not post: raise HTTPException(404, "Post not found")
    if post["author_id"] != user["id"]: raise HTTPException(403, "You can only edit your own posts")
    updates = {}
    if req.title is not None: updates["title"] = req.title.strip()
    if req.content is not None: updates["content"] = req.content.strip()
    if req.github_link is not None: updates["github_link"] = req.github_link.strip()
    if req.preview_link is not None: updates["preview_link"] = req.preview_link.strip()
    ct = extract_hashtags(updates.get("content", post.get("content","")))
    tt = extract_hashtags(updates.get("title", post.get("title","")))
    ex = req.hashtags if req.hashtags is not None else (post.get("hashtags") or [])
    updates["hashtags"] = list(set([t.lower().strip() for t in (ex + ct + tt) if t.strip()]))
    fb_patch(f"posts/{post_id}", updates)
    updated = fb_get(f"posts/{post_id}"); updated["id"] = post_id
    vd = get_vote_data(post_id)
    updated["upvote_count"] = vd["upvote_count"]; updated["downvote_count"] = vd["downvote_count"]
    updated["votes"] = vd["votes"]; updated["comment_count"] = len(safe_dict(fb_get(f"comments/{post_id}")))
    return updated

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, request: Request):
    user = get_current_user(request)
    post = fb_get(f"posts/{post_id}")
    if not post: raise HTTPException(404, "Post not found")
    if post["author_id"] != user["id"]: raise HTTPException(403, "You can only delete your own posts")
    fb_delete(f"posts/{post_id}"); fb_delete(f"comments/{post_id}"); fb_delete(f"votes/{post_id}")
    return {"message": "Post deleted"}

# --- Vote ---
@api_router.post("/posts/{post_id}/vote")
async def toggle_vote(post_id: str, req: VoteRequest, request: Request):
    user = get_current_user(request)
    if req.vote_type not in ["up","down"]: raise HTTPException(400, "vote_type must be 'up' or 'down'")
    post = fb_get(f"posts/{post_id}")
    if not post: raise HTTPException(404, "Post not found")
    existing = fb_get(f"votes/{post_id}/{user['id']}")
    
    # If user clicks same vote type they already have, toggle it off
    if existing == req.vote_type:
        fb_delete(f"votes/{post_id}/{user['id']}")
    else:
        # For downvotes, check if removing upvote would result in negative score
        # Minimum score is 0, so don't allow downvotes if score would go below 0
        if req.vote_type == "down":
            current_votes = safe_dict(fb_get(f"votes/{post_id}"))
            current_up = sum(1 for v in current_votes.values() if v == "up")
            current_down = sum(1 for v in current_votes.values() if v == "down")
            # Calculate what score would be after this vote
            new_up = current_up - 1 if existing == "up" else current_up
            new_down = current_down + 1 if existing != "down" else current_down
            # If net score would go below 0, don't allow the downvote
            if (new_up - new_down) < 0:
                raise HTTPException(400, "Vote score cannot go below 0")
        fb_put(f"votes/{post_id}/{user['id']}", req.vote_type)
    
    vd = get_vote_data(post_id)
    return {"upvote_count": vd["upvote_count"], "downvote_count": vd["downvote_count"], "votes": vd["votes"]}

# --- Comments ---
@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str, request: Request):
    get_current_user(request)
    cd = safe_dict(fb_get(f"comments/{post_id}"))
    cl = [{"id": cid, **c} for cid, c in cd.items() if isinstance(c, dict)]
    cl.sort(key=lambda x: x.get("timestamp","")); return cl

@api_router.post("/posts/{post_id}/comments")
async def create_comment(post_id: str, req: CreateCommentRequest, request: Request):
    user = get_current_user(request)
    if not fb_get(f"posts/{post_id}"): raise HTTPException(404, "Post not found")
    if not req.text.strip(): raise HTTPException(400, "Comment text is required")
    cd = {"author_username": user["username"], "author_id": user["id"], "text": req.text.strip(), "timestamp": datetime.now(timezone.utc).isoformat()}
    r = fb_post(f"comments/{post_id}", cd)
    if r and "name" in r: cd["id"] = r["name"]; return cd
    raise HTTPException(500, "Failed to create comment")

@api_router.delete("/posts/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: str, comment_id: str, request: Request):
    user = get_current_user(request)
    c = fb_get(f"comments/{post_id}/{comment_id}")
    if not c: raise HTTPException(404, "Comment not found")
    if c["author_id"] != user["id"]: raise HTTPException(403, "You can only delete your own comments")
    fb_delete(f"comments/{post_id}/{comment_id}"); return {"message": "Comment deleted"}

@api_router.get("/users/{user_id}/stats")
async def get_user_stats(user_id: str, request: Request):
    get_current_user(request)
    return {"post_count": sum(1 for p in safe_dict(fb_get("posts")).values() if isinstance(p, dict) and p.get("author_id") == user_id)}

@api_router.get("/hashtags/trending")
async def get_trending_hashtags(request: Request):
    get_current_user(request)
    tc = {}
    for pid, pd in safe_dict(fb_get("posts")).items():
        if isinstance(pd, dict):
            for t in (pd.get("hashtags") or []): tc[t] = tc.get(t,0) + 1
    return [{"tag": t, "count": c} for t, c in sorted(tc.items(), key=lambda x: x[1], reverse=True)[:20]]

@api_router.delete("/admin/clear-all-posts")
async def clear_all_posts():
    """Clear all posts, comments, and votes from the database"""
    fb_delete("posts")
    fb_delete("comments")
    fb_delete("votes")
    return {"message": "All posts, comments, and votes have been cleared"}

@api_router.get("/")
async def root(): return {"message": "Discuss API is running"}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS','*').split(','), allow_methods=["*"], allow_headers=["*"])
