// Push Notifications Database Service - Uses Database 2 (Secondary Firebase)
// Stores: subscriptions, settings, tracking for rate limiting

import { 
  secondaryDatabase, 
  ref, 
  get, 
  set, 
  update, 
  remove,
  onValue,
  off,
  isSecondaryDbAvailable 
} from './firebaseSecondary';

// VAPID Public Key for Web Push
export const VAPID_PUBLIC_KEY = 'BD3rYWCGmkrNvyQ8t2GzPdnUySdy4WnEZwm51t_LLIApOK5iI2WQ15ckapmOQQplhiLA68_Ryyifq4ERe4UDTec';

// Chat notification cooldown (4 hours in milliseconds)
export const CHAT_NOTIFICATION_COOLDOWN = 4 * 60 * 60 * 1000;

// ============ SUBSCRIPTION MANAGEMENT ============

// Save push subscription to Database 2
export const savePushSubscription = async (userId, subscription) => {
  if (!isSecondaryDbAvailable() || !userId || !subscription) return false;
  try {
    const subRef = ref(secondaryDatabase, `notifications/subscriptions/${userId}`);
    await set(subRef, {
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      platform: detectPlatform(),
      userAgent: navigator.userAgent.substring(0, 200)
    });
    return true;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return false;
  }
};

// Get user's push subscription
export const getPushSubscription = async (userId) => {
  if (!isSecondaryDbAvailable() || !userId) return null;
  try {
    const subRef = ref(secondaryDatabase, `notifications/subscriptions/${userId}`);
    const snapshot = await get(subRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
};

// Remove push subscription
export const removePushSubscription = async (userId) => {
  if (!isSecondaryDbAvailable() || !userId) return false;
  try {
    const subRef = ref(secondaryDatabase, `notifications/subscriptions/${userId}`);
    await remove(subRef);
    return true;
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return false;
  }
};

// ============ NOTIFICATION SETTINGS ============

// Save notification settings
export const saveNotificationSettings = async (userId, enabled) => {
  if (!isSecondaryDbAvailable() || !userId) return false;
  try {
    const settingsRef = ref(secondaryDatabase, `notifications/settings/${userId}`);
    await set(settingsRef, {
      enabled,
      updatedAt: Date.now()
    });
    return true;
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return false;
  }
};

// Get notification settings
export const getNotificationSettings = async (userId) => {
  if (!isSecondaryDbAvailable() || !userId) return { enabled: false };
  try {
    const settingsRef = ref(secondaryDatabase, `notifications/settings/${userId}`);
    const snapshot = await get(settingsRef);
    return snapshot.exists() ? snapshot.val() : { enabled: false };
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return { enabled: false };
  }
};

// ============ NOTIFICATION TRACKING (Rate Limiting) ============

// Check if chat notification can be sent (4-hour cooldown)
export const canSendChatNotification = async (userId, chatId) => {
  if (!isSecondaryDbAvailable() || !userId) return false;
  try {
    const trackRef = ref(secondaryDatabase, `notifications/tracking/${userId}/chats/${chatId}`);
    const snapshot = await get(trackRef);
    if (!snapshot.exists()) return true;
    
    const lastSent = snapshot.val().lastNotification || 0;
    const now = Date.now();
    return (now - lastSent) >= CHAT_NOTIFICATION_COOLDOWN;
  } catch (error) {
    return true; // Allow on error
  }
};

// Update chat notification timestamp
export const updateChatNotificationTime = async (userId, chatId) => {
  if (!isSecondaryDbAvailable() || !userId) return false;
  try {
    const trackRef = ref(secondaryDatabase, `notifications/tracking/${userId}/chats/${chatId}`);
    await set(trackRef, {
      lastNotification: Date.now()
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Check if post notification was already sent
export const wasPostNotificationSent = async (userId, postId) => {
  if (!isSecondaryDbAvailable() || !userId) return true;
  try {
    const trackRef = ref(secondaryDatabase, `notifications/tracking/${userId}/posts/${postId}`);
    const snapshot = await get(trackRef);
    return snapshot.exists();
  } catch (error) {
    return true; // Assume sent on error to prevent spam
  }
};

// Mark post notification as sent
export const markPostNotificationSent = async (userId, postId) => {
  if (!isSecondaryDbAvailable() || !userId) return false;
  try {
    const trackRef = ref(secondaryDatabase, `notifications/tracking/${userId}/posts/${postId}`);
    await set(trackRef, { sentAt: Date.now() });
    return true;
  } catch (error) {
    return false;
  }
};

// Check if friend request notification was sent
export const wasFriendNotificationSent = async (userId, fromUserId) => {
  if (!isSecondaryDbAvailable() || !userId) return true;
  try {
    const trackRef = ref(secondaryDatabase, `notifications/tracking/${userId}/friends/${fromUserId}`);
    const snapshot = await get(trackRef);
    return snapshot.exists();
  } catch (error) {
    return true;
  }
};

// Mark friend notification as sent
export const markFriendNotificationSent = async (userId, fromUserId) => {
  if (!isSecondaryDbAvailable() || !userId) return false;
  try {
    const trackRef = ref(secondaryDatabase, `notifications/tracking/${userId}/friends/${fromUserId}`);
    await set(trackRef, { sentAt: Date.now() });
    return true;
  } catch (error) {
    return false;
  }
};

// ============ PENDING NOTIFICATIONS QUEUE ============

// Add notification to pending queue (for sending via Cloud Functions)
export const queueNotification = async (targetUserId, notification) => {
  if (!isSecondaryDbAvailable() || !targetUserId) return false;
  try {
    const queueRef = ref(secondaryDatabase, `notifications/queue/${targetUserId}/${Date.now()}`);
    await set(queueRef, {
      ...notification,
      createdAt: Date.now(),
      status: 'pending'
    });
    return true;
  } catch (error) {
    console.error('Error queuing notification:', error);
    return false;
  }
};

// Subscribe to notification queue (for real-time processing)
export const subscribeToNotificationQueue = (userId, callback) => {
  if (!isSecondaryDbAvailable() || !userId) return () => {};
  const queueRef = ref(secondaryDatabase, `notifications/queue/${userId}`);
  onValue(queueRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(Object.entries(data).map(([id, notif]) => ({ id, ...notif })));
    } else {
      callback([]);
    }
  });
  return () => off(queueRef);
};

// Remove processed notification from queue
export const removeFromQueue = async (userId, notificationId) => {
  if (!isSecondaryDbAvailable() || !userId) return false;
  try {
    const notifRef = ref(secondaryDatabase, `notifications/queue/${userId}/${notificationId}`);
    await remove(notifRef);
    return true;
  } catch (error) {
    return false;
  }
};

// ============ ALL SUBSCRIPTIONS (for sending to all users) ============

// Get all subscriptions (for broadcast notifications)
export const getAllSubscriptions = async () => {
  if (!isSecondaryDbAvailable()) return [];
  try {
    const subsRef = ref(secondaryDatabase, 'notifications/subscriptions');
    const snapshot = await get(subsRef);
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val();
    return Object.entries(data).map(([userId, sub]) => ({ userId, ...sub }));
  } catch (error) {
    console.error('Error getting all subscriptions:', error);
    return [];
  }
};

// ============ HELPERS ============

function detectPlatform() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/windows/i.test(ua)) return 'windows';
  if (/macintosh/i.test(ua)) return 'macos';
  return 'unknown';
}

// Convert VAPID key to Uint8Array for subscription
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
