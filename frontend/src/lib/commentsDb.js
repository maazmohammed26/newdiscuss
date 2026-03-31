// Comments Database Service - Uses Secondary Firebase (Firestore)
// New comments are stored in Firestore (second Firebase)
// Uses same Auth UID as primary Firebase for sync

import {
  firestoreDb,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from './firebaseSecondary';

// Collection name for comments
const COMMENTS_COLLECTION = 'comments';

/**
 * Create a new comment in Firestore
 * @param {string} postId - Post ID from primary Firebase
 * @param {string} text - Comment text
 * @param {Object} user - User object with id, username, photo_url, verified
 * @returns {Promise<Object>} Created comment
 */
export const createCommentFirestore = async (postId, text, user) => {
  try {
    const commentsRef = collection(firestoreDb, COMMENTS_COLLECTION);
    
    const newComment = {
      postId,
      text: text.trim(),
      author_username: user.username || user.displayName || user.email?.split('@')[0],
      author_id: user.id || user.uid,
      author_photo: user.photo_url || user.photoURL || '',
      author_verified: user.verified || false,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString() // For immediate display before server timestamp resolves
    };
    
    const docRef = await addDoc(commentsRef, newComment);
    
    return { 
      id: docRef.id, 
      ...newComment,
      timestamp: newComment.createdAt // Use ISO string for immediate display
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

/**
 * Get all comments for a post from Firestore
 * @param {string} postId - Post ID
 * @returns {Promise<Array>} Array of comments
 */
export const getCommentsFirestore = async (postId) => {
  try {
    const commentsRef = collection(firestoreDb, COMMENTS_COLLECTION);
    const q = query(
      commentsRef, 
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.createdAt
      };
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};

/**
 * Delete a comment from Firestore
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Success message
 */
export const deleteCommentFirestore = async (commentId, userId) => {
  try {
    const commentRef = doc(firestoreDb, COMMENTS_COLLECTION, commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (!commentSnap.exists()) {
      throw new Error('Comment not found');
    }
    
    const comment = commentSnap.data();
    if (comment.author_id !== userId) {
      throw new Error('You can only delete your own comments');
    }
    
    await deleteDoc(commentRef);
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
  const commentsRef = collection(firestoreDb, COMMENTS_COLLECTION);
  const q = query(
    commentsRef, 
    where('postId', '==', postId),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.createdAt
      };
    });
    callback(comments);
  }, (error) => {
    console.error('Error subscribing to comments:', error);
    callback([]);
  });
};

/**
 * Get comment count for a post from Firestore
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
    const commentsRef = collection(firestoreDb, COMMENTS_COLLECTION);
    const q = query(commentsRef, where('author_id', '==', userId));
    const snapshot = await getDocs(q);
    
    const { writeBatch } = await import('./firebaseSecondary');
    const batch = writeBatch(firestoreDb);
    
    snapshot.docs.forEach(docSnap => {
      batch.update(docSnap.ref, { author_verified: verified });
    });
    
    await batch.commit();
    console.log(`Updated ${snapshot.docs.length} comments in Firestore for user ${userId}`);
  } catch (error) {
    console.error('Error syncing verification in Firestore comments:', error);
  }
};
