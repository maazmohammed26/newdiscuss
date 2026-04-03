// Notification Triggers - Client-side triggers for real-time notifications
// These functions are called when events happen and queue notifications for delivery

import { 
  queueNotification,
  canSendChatNotification,
  updateChatNotificationTime,
  wasPostNotificationSent,
  markPostNotificationSent,
  wasFriendNotificationSent,
  markFriendNotificationSent,
  getNotificationSettings,
  getPushSubscription,
  getAllSubscriptions
} from './notificationsDb';

// Check if user has push enabled
const isUserPushEnabled = async (userId) => {
  const settings = await getNotificationSettings(userId);
  if (!settings.enabled) return false;
  
  const subscription = await getPushSubscription(userId);
  return !!subscription;
};

/**
 * Trigger notification for new post (broadcast to all users with push enabled)
 * Called when a new post/project is created
 */
export const triggerNewPostNotification = async (post, authorId) => {
  try {
    // Get all subscriptions
    const subscriptions = await getAllSubscriptions();
    
    // Filter out the author and send to everyone else
    for (const sub of subscriptions) {
      if (sub.userId === authorId) continue;
      
      // Check if already notified
      const alreadySent = await wasPostNotificationSent(sub.userId, post.id);
      if (alreadySent) continue;
      
      // Queue notification
      await queueNotification(sub.userId, {
        type: 'new_post',
        title: 'New on Discuss',
        body: post.type === 'project'
          ? `New project: ${(post.title || '').substring(0, 50) || 'Check it out!'}`
          : `New discussion: ${(post.content || '').substring(0, 50) || 'Join the conversation!'}`,
        icon: '/favicon-new.png',
        badge: '/favicon-new.png',
        data: {
          url: `/post/${post.id}`,
          postId: post.id,
          type: 'post'
        }
      });
      
      // Mark as sent
      await markPostNotificationSent(sub.userId, post.id);
    }
  } catch (error) {
    console.error('Error triggering post notification:', error);
  }
};

/**
 * Trigger chat notification with cooldown
 * Called when a message is sent
 */
export const triggerChatNotification = async (targetUserId, chatId, senderName) => {
  try {
    // Check if user has push enabled
    const enabled = await isUserPushEnabled(targetUserId);
    if (!enabled) return;
    
    // Check cooldown (4 hours)
    const canSend = await canSendChatNotification(targetUserId, chatId);
    if (!canSend) return;
    
    // Queue notification
    await queueNotification(targetUserId, {
      type: 'chat_message',
      title: 'New message in your chat',
      body: senderName ? `${senderName} sent you a message` : 'You have a new message',
      icon: '/favicon-new.png',
      badge: '/favicon-new.png',
      tag: `chat-${chatId}`, // Prevent duplicate chat notifications
      data: {
        url: `/chat/${chatId}`,
        chatId,
        type: 'chat'
      }
    });
    
    // Update cooldown timestamp
    await updateChatNotificationTime(targetUserId, chatId);
  } catch (error) {
    console.error('Error triggering chat notification:', error);
  }
};

/**
 * Trigger friend request notification
 */
export const triggerFriendRequestNotification = async (targetUserId, fromUserId, fromUsername) => {
  try {
    // Check if user has push enabled
    const enabled = await isUserPushEnabled(targetUserId);
    if (!enabled) return;
    
    // Check if already notified
    const alreadySent = await wasFriendNotificationSent(targetUserId, fromUserId);
    if (alreadySent) return;
    
    // Queue notification
    await queueNotification(targetUserId, {
      type: 'friend_request',
      title: 'New Friend Request',
      body: `${fromUsername || 'Someone'} wants to connect with you`,
      icon: '/favicon-new.png',
      badge: '/favicon-new.png',
      tag: `friend-request-${fromUserId}`,
      data: {
        url: '/profile',
        fromUserId,
        type: 'friend'
      }
    });
    
    // Mark as sent
    await markFriendNotificationSent(targetUserId, fromUserId);
  } catch (error) {
    console.error('Error triggering friend request notification:', error);
  }
};

/**
 * Trigger friend accepted notification
 */
export const triggerFriendAcceptedNotification = async (targetUserId, fromUserId, fromUsername) => {
  try {
    // Check if user has push enabled
    const enabled = await isUserPushEnabled(targetUserId);
    if (!enabled) return;
    
    // Queue notification
    await queueNotification(targetUserId, {
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      body: `${fromUsername || 'Someone'} accepted your friend request`,
      icon: '/favicon-new.png',
      badge: '/favicon-new.png',
      tag: `friend-accepted-${fromUserId}`,
      data: {
        url: `/user/${fromUserId}`,
        fromUserId,
        type: 'friend'
      }
    });
  } catch (error) {
    console.error('Error triggering friend accepted notification:', error);
  }
};

export default {
  triggerNewPostNotification,
  triggerChatNotification,
  triggerFriendRequestNotification,
  triggerFriendAcceptedNotification
};
