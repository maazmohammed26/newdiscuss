// Firebase Database Service - Direct Firebase operations (no backend needed)
import { 
  database, 
  ref, 
  get, 
  set, 
  push, 
  update, 
  remove, 
  onValue,
  off,
  query,
  orderByChild
} from './firebase';
import { openDB } from 'idb';

// IndexedDB for offline caching
const DB_NAME = 'discuss_offline';
const DB_VERSION = 1;

const getDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    },
  });
};

// Cache helpers
const cacheData = async (key, data) => {
  try {
    const db = await getDB();
    await db.put('cache', { key, data, timestamp: Date.now() });
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
};

const getCachedData = async (key, maxAge = 5 * 60 * 1000) => {
  try {
    const db = await getDB();
    const cached = await db.get('cache', key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }
  } catch (e) {
    console.warn('Cache read failed:', e);
  }
  return null;
};

// Helper to extract hashtags from text
const extractHashtags = (text) => {
  if (!text) return [];
  const matches = text.match(/#(\w+)/g);
  return matches ? [...new Set(matches.map(t => t.slice(1).toLowerCase()))] : [];
};

// ==================== USER OPERATIONS ====================

export const createUser = async (userId, userData) => {
  const userRef = ref(database, `users/${userId}`);
  await set(userRef, {
    ...userData,
    created_at: new Date().toISOString()
  });
  return { id: userId, ...userData };
};

export const getUser = async (userId) => {
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    return { id: userId, ...snapshot.val() };
  }
  return null;
};

export const getUserByEmail = async (email) => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  if (snapshot.exists()) {
    const users = snapshot.val();
    for (const [id, user] of Object.entries(users)) {
      if (user.email?.toLowerCase() === email.toLowerCase()) {
        return { id, ...user };
      }
    }
  }
  return null;
};

export const checkUsernameAvailable = async (username) => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  if (snapshot.exists()) {
    const users = snapshot.val();
    for (const user of Object.values(users)) {
      if (user.username?.toLowerCase() === username.toLowerCase()) {
        return false;
      }
    }
  }
  return true;
};

export const updateUser = async (userId, updates) => {
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, updates);
};

// ==================== POST OPERATIONS ====================

export const createPost = async (postData, user) => {
  const postsRef = ref(database, 'posts');
  const contentTags = extractHashtags(postData.content);
  const titleTags = extractHashtags(postData.title || '');
  const allTags = [...new Set([...(postData.hashtags || []), ...contentTags, ...titleTags])];
  
  const newPost = {
    type: postData.type,
    title: (postData.title || '').trim(),
    content: postData.content.trim(),
    github_link: (postData.github_link || '').trim(),
    preview_link: (postData.preview_link || '').trim(),
    hashtags: allTags,
    author_username: user.username || user.displayName || user.email?.split('@')[0],
    author_id: user.id || user.uid,
    author_photo: user.photo_url || user.photoURL || '',
    timestamp: new Date().toISOString()
  };
  
  const newPostRef = push(postsRef);
  await set(newPostRef, newPost);
  
  return {
    id: newPostRef.key,
    ...newPost,
    upvote_count: 0,
    downvote_count: 0,
    comment_count: 0,
    votes: {}
  };
};

export const getPosts = async (searchQuery = null) => {
  // Try cache first
  const cacheKey = `posts_${searchQuery || 'all'}`;
  const cached = await getCachedData(cacheKey, 30000); // 30 second cache
  
  const postsRef = ref(database, 'posts');
  const votesRef = ref(database, 'votes');
  const commentsRef = ref(database, 'comments');
  
  const [postsSnap, votesSnap, commentsSnap] = await Promise.all([
    get(postsRef),
    get(votesRef),
    get(commentsRef)
  ]);
  
  const posts = postsSnap.exists() ? postsSnap.val() : {};
  const votes = votesSnap.exists() ? votesSnap.val() : {};
  const comments = commentsSnap.exists() ? commentsSnap.val() : {};
  
  let postsList = Object.entries(posts).map(([id, post]) => {
    const postVotes = votes[id] || {};
    const postComments = comments[id] || {};
    const upvotes = Object.values(postVotes).filter(v => v === 'up').length;
    const downvotes = Object.values(postVotes).filter(v => v === 'down').length;
    
    return {
      id,
      ...post,
      upvote_count: upvotes,
      downvote_count: downvotes,
      comment_count: Object.keys(postComments).length,
      votes: postVotes
    };
  });
  
  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    postsList = postsList.filter(p => 
      p.title?.toLowerCase().includes(q) ||
      p.content?.toLowerCase().includes(q) ||
      p.author_username?.toLowerCase().includes(q) ||
      p.type?.toLowerCase().includes(q) ||
      (p.hashtags || []).some(t => t.toLowerCase().includes(q.replace('#', '')))
    );
  }
  
  // Sort by timestamp descending
  postsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Cache results
  await cacheData(cacheKey, postsList);
  
  return postsList;
};

export const updatePost = async (postId, updates, userId) => {
  const postRef = ref(database, `posts/${postId}`);
  const snapshot = await get(postRef);
  
  if (!snapshot.exists()) {
    throw new Error('Post not found');
  }
  
  const post = snapshot.val();
  if (post.author_id !== userId) {
    throw new Error('You can only edit your own posts');
  }
  
  const contentTags = extractHashtags(updates.content || post.content);
  const titleTags = extractHashtags(updates.title || post.title);
  const existingTags = updates.hashtags !== undefined ? updates.hashtags : (post.hashtags || []);
  
  const finalUpdates = {
    ...updates,
    hashtags: [...new Set([...existingTags, ...contentTags, ...titleTags])]
  };
  
  await update(postRef, finalUpdates);
  return { id: postId, ...post, ...finalUpdates };
};

export const deletePost = async (postId, userId) => {
  const postRef = ref(database, `posts/${postId}`);
  const snapshot = await get(postRef);
  
  if (!snapshot.exists()) {
    throw new Error('Post not found');
  }
  
  const post = snapshot.val();
  if (post.author_id !== userId) {
    throw new Error('You can only delete your own posts');
  }
  
  // Delete post, votes, and comments
  await Promise.all([
    remove(postRef),
    remove(ref(database, `votes/${postId}`)),
    remove(ref(database, `comments/${postId}`))
  ]);
  
  return { message: 'Post deleted' };
};

// ==================== VOTE OPERATIONS ====================

export const toggleVote = async (postId, voteType, userId) => {
  const voteRef = ref(database, `votes/${postId}/${userId}`);
  const allVotesRef = ref(database, `votes/${postId}`);
  
  // Get current vote
  const currentVoteSnap = await get(voteRef);
  const currentVote = currentVoteSnap.exists() ? currentVoteSnap.val() : null;
  
  // Get all votes to calculate score
  const allVotesSnap = await get(allVotesRef);
  const allVotes = allVotesSnap.exists() ? allVotesSnap.val() : {};
  
  let upvotes = Object.values(allVotes).filter(v => v === 'up').length;
  let downvotes = Object.values(allVotes).filter(v => v === 'down').length;
  
  if (currentVote === voteType) {
    // Toggle off
    await remove(voteRef);
    if (voteType === 'up') upvotes--;
    else downvotes--;
  } else {
    // Check if downvote would make score negative
    if (voteType === 'down') {
      let newUp = currentVote === 'up' ? upvotes - 1 : upvotes;
      let newDown = downvotes + 1;
      if ((newUp - newDown) < 0) {
        throw new Error('Vote score cannot go below 0');
      }
    }
    
    // Set new vote
    await set(voteRef, voteType);
    
    if (currentVote === 'up') upvotes--;
    else if (currentVote === 'down') downvotes--;
    
    if (voteType === 'up') upvotes++;
    else downvotes++;
  }
  
  // Get updated votes
  const updatedVotesSnap = await get(allVotesRef);
  const updatedVotes = updatedVotesSnap.exists() ? updatedVotesSnap.val() : {};
  
  return {
    upvote_count: Object.values(updatedVotes).filter(v => v === 'up').length,
    downvote_count: Object.values(updatedVotes).filter(v => v === 'down').length,
    votes: updatedVotes
  };
};

// ==================== COMMENT OPERATIONS ====================

export const getComments = async (postId) => {
  const commentsRef = ref(database, `comments/${postId}`);
  const snapshot = await get(commentsRef);
  
  if (!snapshot.exists()) return [];
  
  const comments = snapshot.val();
  return Object.entries(comments)
    .map(([id, comment]) => ({ id, ...comment }))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

export const createComment = async (postId, text, user) => {
  const commentsRef = ref(database, `comments/${postId}`);
  
  const newComment = {
    text: text.trim(),
    author_username: user.username || user.displayName || user.email?.split('@')[0],
    author_id: user.id || user.uid,
    author_photo: user.photo_url || user.photoURL || '',
    timestamp: new Date().toISOString()
  };
  
  const newCommentRef = push(commentsRef);
  await set(newCommentRef, newComment);
  
  return { id: newCommentRef.key, ...newComment };
};

export const deleteComment = async (postId, commentId, userId) => {
  const commentRef = ref(database, `comments/${postId}/${commentId}`);
  const snapshot = await get(commentRef);
  
  if (!snapshot.exists()) {
    throw new Error('Comment not found');
  }
  
  const comment = snapshot.val();
  if (comment.author_id !== userId) {
    throw new Error('You can only delete your own comments');
  }
  
  await remove(commentRef);
  return { message: 'Comment deleted' };
};

// ==================== HASHTAG OPERATIONS ====================

export const getTrendingHashtags = async () => {
  const postsRef = ref(database, 'posts');
  const snapshot = await get(postsRef);
  
  if (!snapshot.exists()) return [];
  
  const posts = snapshot.val();
  const tagCounts = {};
  
  Object.values(posts).forEach(post => {
    (post.hashtags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
};

// ==================== USER STATS ====================

export const getUserStats = async (userId) => {
  const postsRef = ref(database, 'posts');
  const snapshot = await get(postsRef);
  
  if (!snapshot.exists()) return { post_count: 0 };
  
  const posts = snapshot.val();
  const postCount = Object.values(posts).filter(p => p.author_id === userId).length;
  
  return { post_count: postCount };
};

// ==================== REALTIME LISTENERS ====================

export const subscribeToPostsRealtime = (callback) => {
  const postsRef = ref(database, 'posts');
  const votesRef = ref(database, 'votes');
  const commentsRef = ref(database, 'comments');
  
  const updatePosts = async () => {
    const posts = await getPosts();
    callback(posts);
  };
  
  onValue(postsRef, updatePosts);
  onValue(votesRef, updatePosts);
  onValue(commentsRef, updatePosts);
  
  // Return unsubscribe function
  return () => {
    off(postsRef);
    off(votesRef);
    off(commentsRef);
  };
};

export const subscribeToCommentsRealtime = (postId, callback) => {
  const commentsRef = ref(database, `comments/${postId}`);
  
  const handleComments = (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const comments = snapshot.val();
    const commentsList = Object.entries(comments)
      .map(([id, comment]) => ({ id, ...comment }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    callback(commentsList);
  };
  
  onValue(commentsRef, handleComments);
  
  return () => off(commentsRef);
};
