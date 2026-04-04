// Admin Global Message Service - Database 2
// Handles admin broadcast messages with push notifications

import {
  secondaryDatabase,
  ref,
  get,
  onValue,
  off
} from './firebaseSecondary';
import { showNotification, isNotificationsEnabled } from './pushNotificationService';

// Local storage key to track if message was shown
const ADMIN_MSG_SHOWN_KEY = 'discuss_admin_msg_shown';

/**
 * Get the last shown message ID from localStorage
 */
const getShownMessageId = () => {
  return localStorage.getItem(ADMIN_MSG_SHOWN_KEY) || '';
};

/**
 * Mark message as shown
 */
const markMessageShown = (messageId) => {
  localStorage.setItem(ADMIN_MSG_SHOWN_KEY, messageId);
};

/**
 * Subscribe to admin global message
 * @param {Function} callback - (message, isNew) => void
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAdminMessage = (callback) => {
  const msgRef = ref(secondaryDatabase, 'adminMessage');
  
  const handleMessage = async (snapshot) => {
    if (!snapshot.exists()) {
      callback(null, false);
      return;
    }
    
    const data = snapshot.val();
    
    // If not active, return null
    if (!data.isActive) {
      callback(null, false);
      return;
    }
    
    const messageId = data.createdAt?.toString() || 'default';
    const shownId = getShownMessageId();
    const isNew = shownId !== messageId;
    
    // Trigger push notification only once (if new and notifications enabled)
    if (isNew && isNotificationsEnabled()) {
      await showNotification('Message from Discuss Admin', {
        body: data.message?.substring(0, 100) || 'New announcement',
        tag: 'admin-message-' + messageId,
        data: { url: '/feed', type: 'admin' }
      });
      markMessageShown(messageId);
    }
    
    callback({
      message: data.message,
      createdAt: data.createdAt,
      isActive: data.isActive
    }, isNew && shownId !== messageId);
  };
  
  onValue(msgRef, handleMessage);
  return () => off(msgRef);
};

/**
 * Mark admin message as seen (for badge removal)
 */
export const markAdminMessageSeen = () => {
  const msgRef = ref(secondaryDatabase, 'adminMessage');
  get(msgRef).then(snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (data.createdAt) {
        markMessageShown(data.createdAt.toString());
      }
    }
  });
};

/**
 * Check if there's an unseen admin message
 */
export const hasUnseenAdminMessage = async () => {
  try {
    const msgRef = ref(secondaryDatabase, 'adminMessage');
    const snapshot = await get(msgRef);
    if (!snapshot.exists()) return false;
    
    const data = snapshot.val();
    if (!data.isActive) return false;
    
    const messageId = data.createdAt?.toString() || 'default';
    const shownId = getShownMessageId();
    return shownId !== messageId;
  } catch {
    return false;
  }
};
