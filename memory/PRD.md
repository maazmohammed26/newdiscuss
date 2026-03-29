# Discuss - Developer Discussion Platform

## Original Problem Statement
Extract and run the page from discuss-main.zip. Fix voting system to not go below 0, fix deployment issues, remove MongoDB and emergent dependencies.

## Architecture
- **Backend**: FastAPI with Firebase Realtime Database
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Auth**: JWT + bcrypt + Google OAuth (Firebase)
- **Database**: Firebase Realtime Database (no MongoDB)

## What's Been Implemented (Jan 2026)
- [x] Extracted and deployed project
- [x] Fixed voting system - minimum score is 0
- [x] Fixed API URL fallback for deployment
- [x] Removed MongoDB dependencies
- [x] Removed emergent dependencies
- [x] Cleared all test posts
- [x] Cleaned up craco.config.js and package.json

## Core Features
- User authentication (email/password + Google OAuth)
- Discussion posts and project showcases
- Voting system (minimum 0)
- Comments on posts
- Hashtag support

## Environment Variables
### Backend (.env)
- FIREBASE_DB_URL
- JWT_SECRET
- CORS_ORIGINS

### Frontend (.env)
- REACT_APP_BACKEND_URL (falls back to window.location.origin)
- REACT_APP_FIREBASE_* (all Firebase config keys)

## Deployment Notes
- Backend: Deploy to Render with Python runtime
- Frontend: Deploy to Vercel/Netlify, set REACT_APP_BACKEND_URL to backend URL
- Add deployed domain to Firebase authorized domains

## Backlog
- P1: Configure valid Firebase credentials
- P2: Add more features as needed
