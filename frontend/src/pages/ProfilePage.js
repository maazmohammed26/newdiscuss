import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStats } from '@/lib/db';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { FileText, LogOut, Loader2, AlertTriangle } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (user?.id) {
      getUserStats(user.id).then(data => setStats(data)).catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => { setLoggingOut(true); await logout(); navigate('/'); };

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F0F4FA]">
      <Header />
      <div className="max-w-sm mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-8 text-center">
          {/* Avatar */}
          {user?.photo_url ? (
            <img src={user.photo_url} alt={user.username} className="w-24 h-24 rounded-full mx-auto mb-5 shadow-lg object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#CC0000] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#CC0000]/20">
              <span className="text-white text-2xl font-bold">{initials}</span>
            </div>
          )}

          <h1 data-testid="profile-username" className="font-heading text-xl font-bold text-[#0F172A]">{user?.username}</h1>
          <p data-testid="profile-email" className="text-[#64748B] text-[13px] mt-0.5">{user?.email}</p>

          {/* Stats */}
          <div className="inline-flex items-center gap-2 bg-[#F0F4FA] rounded-full px-4 py-2 mt-4">
            <FileText className="w-4 h-4 text-[#CC0000]" />
            <span data-testid="profile-post-count" className="text-[#0F172A] text-[13px] font-semibold">
              {stats ? `${stats.post_count} Total Posts` : <Loader2 className="w-3.5 h-3.5 animate-spin inline" />}
            </span>
          </div>

          {/* Password notice */}
          <div className="bg-[#FEF3C7] rounded-xl p-3 mt-6 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
            <p data-testid="profile-password-notice" className="text-[#92400E] text-[13px] text-left">Password change is not possible for now.</p>
          </div>

          {/* Logout */}
          <Button data-testid="profile-logout-btn" onClick={handleLogout} disabled={loggingOut}
            className="w-full bg-[#CC0000]/10 hover:bg-[#CC0000]/20 text-[#CC0000] font-semibold rounded-full py-3 h-12 mt-6 transition-all">
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4 mr-2" /> Logout</>}
          </Button>
        </div>

        <p className="text-center text-[#94A3B8] text-xs mt-6">
          Managed by <span className="font-semibold text-[#CC0000]">&lt;discuss&gt;</span>
        </p>
      </div>
    </div>
  );
}
