import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DiscussLogo from '@/components/DiscussLogo';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#1E293B]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center" data-testid="header-logo">
          <DiscussLogo size="md" />
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/feed">
                <Button variant="ghost" data-testid="header-feed-btn" className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F0F4FA] dark:hover:bg-[#1E293B] rounded-full px-4 text-[13px] font-medium">
                  Feed
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" data-testid="header-profile-btn" className="w-9 h-9 p-0 rounded-full bg-[#F0F4FA] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155]">
                  {user.photo_url ? (
                    <img src={user.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                  )}
                </Button>
              </Link>
            </>
          ) : isLanding ? (
            <>
              <Link to="/login">
                <Button variant="ghost" data-testid="header-login-btn" className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F0F4FA] dark:hover:bg-[#1E293B] rounded-full px-4 text-[13px] font-medium">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button data-testid="header-register-btn" className="bg-[#CC0000] text-white hover:bg-[#A30000] rounded-full px-5 text-[13px] font-medium shadow-sm">
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
