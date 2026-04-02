import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToUnreadCount } from '@/lib/chatsDb';
import { subscribeToReceivedRequests } from '@/lib/relationshipsDb';
import DiscussLogo from '@/components/DiscussLogo';
import { Button } from '@/components/ui/button';
import { User, MessageCircle, Bell } from 'lucide-react';

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Subscribe to unread message count
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeMessages = subscribeToUnreadCount(user.id, (count) => {
      setUnreadMessages(count);
    });

    const unsubscribeRequests = subscribeToReceivedRequests(user.id, (requests) => {
      setPendingRequests(requests.length);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeRequests();
    };
  }, [user?.id]);

  const totalNotifications = unreadMessages + pendingRequests;

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0F172A]/80 discuss:bg-[#121212]/80 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#1E293B] discuss:border-[#333333]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center" data-testid="header-logo">
          <DiscussLogo size="md" />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link to="/feed">
                <Button variant="ghost" data-testid="header-feed-btn" className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] hover:text-[#0F172A] dark:hover:text-white discuss:hover:text-[#F5F5F5] hover:bg-[#F5F5F7] dark:hover:bg-[#1E293B] discuss:hover:bg-[#1a1a1a] rounded-full px-3 sm:px-4 text-[13px] font-medium">
                  Feed
                </Button>
              </Link>
              <Link to="/chat" className="relative">
                <Button variant="ghost" data-testid="header-chat-btn" className="w-9 h-9 p-0 rounded-full bg-[#F5F5F7] dark:bg-[#1E293B] discuss:bg-[#1a1a1a] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] discuss:hover:bg-[#262626]">
                  <MessageCircle className="w-4 h-4 text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF]" />
                </Button>
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="relative">
                <Button variant="ghost" data-testid="header-profile-btn" className="w-9 h-9 p-0 rounded-full bg-[#F5F5F7] dark:bg-[#1E293B] discuss:bg-[#1a1a1a] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] discuss:hover:bg-[#262626]">
                  {user.photo_url ? (
                    <img src={user.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF]" />
                  )}
                </Button>
                {pendingRequests > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#F59E0B] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                    {pendingRequests > 99 ? '99+' : pendingRequests}
                  </span>
                )}
              </Link>
            </>
          ) : isLanding ? (
            <>
              <Link to="/login">
                <Button variant="ghost" data-testid="header-login-btn" className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] hover:text-[#0F172A] dark:hover:text-white discuss:hover:text-[#F5F5F5] hover:bg-[#F5F5F7] dark:hover:bg-[#1E293B] discuss:hover:bg-[#1a1a1a] rounded-full px-4 text-[13px] font-medium">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button data-testid="header-register-btn" className="bg-[#2563EB] discuss:bg-[#EF4444] text-white hover:bg-[#1D4ED8] discuss:hover:bg-[#DC2626] rounded-full px-5 text-[13px] font-medium shadow-sm">
                  Register
                </Button>
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
