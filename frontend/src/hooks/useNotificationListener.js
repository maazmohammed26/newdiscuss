// Hook to listen for notifications and process them in real-time
// Handles notification queue from Database 2 and shows notifications

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToNotificationQueue, removeFromQueue } from '@/lib/notificationsDb';
import { showLocalNotification } from '@/lib/pushNotificationService';

export function useNotificationListener() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const processedRef = useRef(new Set());
  
  useEffect(() => {
    if (!user?.id) return;
    
    // Listen for service worker messages (notification clicks)
    const handleSWMessage = (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.url) {
        navigate(event.data.url);
      }
    };
    
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    
    // Subscribe to notification queue
    const unsubscribe = subscribeToNotificationQueue(user.id, async (notifications) => {
      for (const notif of notifications) {
        // Skip if already processed
        if (processedRef.current.has(notif.id)) continue;
        processedRef.current.add(notif.id);
        
        // Show the notification
        if (document.visibilityState === 'hidden') {
          // App is in background - service worker will handle via push
          // For now, use local notification as fallback
          await showLocalNotification(notif.title, {
            body: notif.body,
            icon: notif.icon,
            badge: notif.badge,
            data: notif.data,
            tag: `discuss-${notif.type}-${notif.id}`
          });
        }
        
        // Remove from queue after processing
        await removeFromQueue(user.id, notif.id);
        
        // Clean up processed set periodically
        if (processedRef.current.size > 100) {
          processedRef.current.clear();
        }
      }
    });
    
    return () => {
      unsubscribe();
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [user?.id, navigate]);
}

export default useNotificationListener;
