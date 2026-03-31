// Comments Database Service - Uses Secondary Firebase (Realtime Database)
// New comments are stored in Realtime Database (second Firebase)
// Uses same Auth UID as primary Firebase for sync

import {
  secondaryDatabase,
  ref,
  get,
  set,
  push,
  remove,
  update,
  onValue,
  off
} from './firebaseSecondary';

/**
 * Create a new comment in Realtime Database
 * @param {string} postId - Post ID from primary Firebase
 * @param {string} text - Comment text
 * @param {Object} user - User object with id, username, photo_url, verified
 * @returns {Promise<Object>} Created comment
 */
export const createCommentFirestore = async (postId, text, user) => {
  try {
    const commentsRef = ref(secondaryDatabase, `comments/${postId}`);
    
    const newComment = {
      postId,
      text: text.trim(),
      author_username: user.username || user.displayName || user.email?.split('@')[0],
      author_id: user.id || user.uid,
      author_photo: user.photo_url || user.photoURL || '',
      author_verified: user.verified || false,
      timestamp: new Date().toISOString()
    };
    
    const newCommentRef = push(commentsRef);
    await set(newCommentRef, newComment);
    
    return { 
      id: newCommentRef.key, 
      ...newComment
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

/**
 * Get all comments for a post from Realtime Database
 * @param {string} postId - Post ID
 * @returns {Promise<Array>} Array of comments
 */
export const getCommentsFirestore = async (postId) => {
  try {
    const commentsRef = ref(secondaryDatabase, `comments/${postId}`);
    const snapshot = await get(commentsRef);
    
    if (!snapshot.exists()) return [];
    
    const comments = snapshot.val();
    return Object.entries(comments)
      .map(([id, comment]) => ({
        id,
        ...comment
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};

/**
 * Delete a comment from Realtime Database
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID (for authorization)
 * @param {string} postId - Post ID (needed for path)
 * @returns {Promise<Object>} Success message
 */
export const deleteCommentFirestore = async (commentId, userId, postId) => {
  try {
    const commentRef = ref(secondaryDatabase, `comments/${postId}/${commentId}`);
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
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time comments for a post
 * @param {string} postId - Post ID
 * @param {Function} callback - Callback function with comments array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCommentsFirestore = (postId, callback) => {
  let commentsRef = null;
  let listenerActive = false;
  
  try {
    commentsRef = ref(secondaryDatabase, `comments/${postId}`);
    
    const handleComments = (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const comments = snapshot.val();
      const commentsList = Object.entries(comments)
        .map(([id, comment]) => ({
          id,
          ...comment
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      callback(commentsList);
    };
    
    const handleError = (error) => {
      console.warn('Secondary comments listener error (non-blocking):', error.message);
      callback([]);
    };
    
    onValue(commentsRef, handleComments, handleError);
    listenerActive = true;
  } catch (e) {
    console.warn('Failed to setup secondary comments listener:', e.message);
    callback([]);
  }
  
  return () => {
    if (listenerActive && commentsRef) {
      try {
        off(commentsRef);
      } catch (e) {
        // Ignore errors when unsubscribing
      }
    }
  };
};

/**
 * Get comment count for a post from Realtime Database
 * @param {string} postId - Post ID
 * @returns {Promise<number>} Comment count
 */
export const getCommentCountFirestore = async (postId) => {
  try {
    const comments = await getCommentsFirestore(postId);
    return comments.length;
  } catch (error) {
    console.error('Error getting comment count:', error);
    return 0;
  }
};

/**
 * Update author_verified for all comments by a user (for verification sync)
 * @param {string} userId - User ID
 * @param {boolean} verified - Verification status
 */
export const syncUserVerificationInCommentsFirestore = async (userId, verified) => {
  try {
    const commentsRef = ref(secondaryDatabase, 'comments');
    const snapshot = await get(commentsRef);
    
    if (!snapshot.exists()) return;
    
    const allComments = snapshot.val();
    const updates = {};
    
    // Find all comments by this user across all posts
    Object.entries(allComments).forEach(([postId, comments]) => {
      Object.entries(comments).forEach(([commentId, comment]) => {
        if (comment.author_id === userId) {
          updates[`comments/${postId}/${commentId}/author_verified`] = verified;
        }
      });
    });
    
    // Apply all updates at once
    if (Object.keys(updates).length > 0) {
      await update(ref(secondaryDatabase), updates);
      console.log(`Updated ${Object.keys(updates).length} comments in secondary DB for user ${userId}`);
    }
  } catch (error) {
    console.error('Error syncing verification in secondary DB comments:', error);
  }
};
