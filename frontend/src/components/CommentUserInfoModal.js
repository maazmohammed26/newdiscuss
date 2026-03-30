import { useState, useEffect } from 'react';
import { getUser } from '@/lib/db';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Calendar, Loader2, X } from 'lucide-react';

export default function CommentUserInfoModal({ open, onClose, userId }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      getUser(userId)
        .then((user) => setUserData(user))
        .catch(() => setUserData(null))
        .finally(() => setLoading(false));
    }
  }, [open, userId]);

  const joinDate = userData?.created_at
    ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const initials = (userData?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xs bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] dark:border-[#334155] discuss:border-[#333333] p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#6275AF]" />
          </div>
        ) : !userData ? (
          <div className="text-center py-12 px-6">
            <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[13px]">User not found</p>
          </div>
        ) : (
          <>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[#F5F5F7] dark:hover:bg-[#334155] discuss:hover:bg-[#262626] text-[#6275AF] hover:text-[#0F172A] dark:hover:text-white discuss:hover:text-[#F5F5F5] transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* User Info */}
            <div className="bg-gradient-to-b from-[#2563EB]/10 dark:from-[#2563EB]/20 discuss:from-[#EF4444]/10 to-transparent pt-8 pb-4 px-6 text-center">
              {userData.photo_url ? (
                <img src={userData.photo_url} alt={userData.username} className="w-16 h-16 rounded-full mx-auto mb-3 shadow-lg discuss:shadow-none discuss:border discuss:border-[#333333] object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#2563EB] discuss:bg-[#EF4444] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#2563EB]/20 discuss:shadow-none discuss:border discuss:border-[#333333]">
                  <span className="text-white text-lg font-bold">{initials}</span>
                </div>
              )}
              <h3 data-testid="comment-user-info-name" className="font-bold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-[16px] flex items-center justify-center gap-1">
                {userData.username}
                {userData.verified && <VerifiedBadge size="xs" />}
              </h3>
            </div>

            {/* Join Date */}
            <div className="px-6 pb-6">
              <div className="bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#262626] discuss:border discuss:border-[#333333] rounded-xl p-3 text-center">
                <Calendar className="w-4 h-4 text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] mx-auto mb-1" />
                <p className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-[12px] font-semibold">{joinDate}</p>
                <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[10px]">Joined</p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
