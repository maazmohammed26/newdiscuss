// Push Notification Service - Handles registration, permission, and sending
// Works with Service Worker for real-time notifications even when app is closed

import {
  VAPID_PUBLIC_KEY,
  urlBase64ToUint8Array,
  savePushSubscription,
  removePushSubscription,
  saveNotificationSettings,
  getNotificationSettings,
  getPushSubscription,
  queueNotification,
  canSendChatNotification,
  updateChatNotificationTime,
  wasPostNotificationSent,
  markPostNotificationSent,
  wasFriendNotificationSent,
  markFriendNotificationSent
} from './notificationsDb';

// Check if push notifications are supported
export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

// Check if iOS (requires special handling for iOS 16.4+)
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Check if app is installed as PWA
export const isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
};

// Check iOS version (need 16.4+ for push)
export const getIOSVersion = () => {
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (match) {
    return parseFloat(`${match[1]}.${match[2]}`);
  }
  return 0;
};

// Check if push is available on this device
export const canUsePush = () => {
  if (!isPushSupported()) return false;
  if (isIOS()) {
    // iOS needs PWA installed and version 16.4+
    return isPWAInstalled() && getIOSVersion() >= 16.4;
  }
  return true;
};

// Get current permission status
export const getPermissionStatus = () => {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'granted', 'denied', 'default'
};

// Request notification permission
export const requestPermission = async () => {
  if (!isPushSupported()) return 'unsupported';
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting permission:', error);
    return 'denied';
  }
};

// Register service worker and get push subscription
export const registerPushSubscription = async (userId) => {
  if (!canUsePush() || !userId) return null;
  
  try {
    // Check permission first
    if (Notification.permission !== 'granted') {
      const permission = await requestPermission();
      if (permission !== 'granted') return null;
    }
    
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    // Create new subscription if none exists
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }
    
    // Save to Database 2
    await savePushSubscription(userId, subscription);
    await saveNotificationSettings(userId, true);
    
    return subscription;
  } catch (error) {
    console.error('Error registering push subscription:', error);
    return null;
  }
};

// Unsubscribe from push notifications
export const unsubscribePush = async (userId) => {
  if (!userId) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }
    
    // Remove from Database 2
    await removePushSubscription(userId);
    await saveNotificationSettings(userId, false);
    
    return true;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
};

// Check if user has notifications enabled
export const isNotificationsEnabled = async (userId) => {
  if (!userId) return false;
  const settings = await getNotificationSettings(userId);
  return settings.enabled && Notification.permission === 'granted';
};

// ============ NOTIFICATION TRIGGERS ============

// Send notification for new post/project (no duplicates)
export const notifyNewPost = async (targetUserId, post) => {
  if (!targetUserId || !post) return;
  
  // Check if already notified
  const alreadySent = await wasPostNotificationSent(targetUserId, post.id);
  if (alreadySent) return;
  
  // Check if user has notifications enabled
  const enabled = await isNotificationsEnabled(targetUserId);
  if (!enabled) return;
  
  // Queue notification
  await queueNotification(targetUserId, {
    type: 'new_post',
    title: 'New on Discuss',
    body: post.type === 'project' 
      ? `New project: ${post.title?.substring(0, 50) || 'Check it out!'}`
      : `New discussion: ${post.content?.substring(0, 50) || 'Join the conversation!'}`,
    icon: '/favicon-new.png',
    badge: '/favicon-new.png',
    data: {
      url: `/post/${post.id}`,
      postId: post.id,
      type: 'post'
    }
  });
  
  // Mark as sent
  await markPostNotificationSent(targetUserId, post.id);
};

// Send chat notification with 4-hour cooldown
export const notifyChatMessage = async (targetUserId, chatId, senderName) => {
  if (!targetUserId || !chatId) return;
  
  // Check cooldown
  const canSend = await canSendChatNotification(targetUserId, chatId);
  if (!canSend) return;
  
  // Check if user has notifications enabled
  const enabled = await isNotificationsEnabled(targetUserId);
  if (!enabled) return;
  
  // Queue notification
  await queueNotification(targetUserId, {
    type: 'chat_message',
    title: 'New message in your chat',
    body: senderName ? `${senderName} sent you a message` : 'You have a new message',
    icon: '/favicon-new.png',
    badge: '/favicon-new.png',
    data: {
      url: `/chat/${chatId}`,
      chatId,
      type: 'chat'
    }
  });
  
  // Update cooldown timestamp
  await updateChatNotificationTime(targetUserId, chatId);
};

// Send friend request notification
export const notifyFriendRequest = async (targetUserId, fromUserId, fromUsername) => {
  if (!targetUserId || !fromUserId) return;
  
  // Check if already notified
  const alreadySent = await wasFriendNotificationSent(targetUserId, fromUserId);
  if (alreadySent) return;
  
  // Check if user has notifications enabled
  const enabled = await isNotificationsEnabled(targetUserId);
  if (!enabled) return;
  
  // Queue notification
  await queueNotification(targetUserId, {
    type: 'friend_request',
    title: 'New Friend Request',
    body: `${fromUsername || 'Someone'} wants to connect with you`,
    icon: '/favicon-new.png',
    badge: '/favicon-new.png',
    data: {
      url: '/profile',
      fromUserId,
      type: 'friend'
    }
  });
  
  // Mark as sent
  await markFriendNotificationSent(targetUserId, fromUserId);
};

// Send friend accepted notification
export const notifyFriendAccepted = async (targetUserId, fromUserId, fromUsername) => {
  if (!targetUserId || !fromUserId) return;
  
  // Check if user has notifications enabled
  const enabled = await isNotificationsEnabled(targetUserId);
  if (!enabled) return;
  
  // Queue notification
  await queueNotification(targetUserId, {
    type: 'friend_accepted',
    title: 'Friend Request Accepted',
    body: `${fromUsername || 'Someone'} accepted your friend request`,
    icon: '/favicon-new.png',
    badge: '/favicon-new.png',
    data: {
      url: `/user/${fromUserId}`,
      fromUserId,
      type: 'friend'
    }
  });
};

// Show local notification (when app is open)
export const showLocalNotification = async (title, options = {}) => {
  if (Notification.permission !== 'granted') return;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/favicon-new.png',
      badge: '/favicon-new.png',
      vibrate: [200, 100, 200],
      ...options
    });
  } catch (error) {
    // Fallback to regular notification
    new Notification(title, options);
  }
};
