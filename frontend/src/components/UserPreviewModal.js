import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, getPostsByUser } from '@/lib/db';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import VerifiedBadge from '@/components/VerifiedBadge';
import { User, FileText, Calendar, ArrowRight, Loader2 } from 'lucide-react';

export default function UserPreviewModal({ open, onClose, userId }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      Promise.all([getUser(userId), getPostsByUser(userId)])
        .then(([user, posts]) => {
          setUserData(user);
          setPostCount(posts.length);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, userId]);

  const handleViewPosts = () => {
    onClose();
    navigate(`/user/${userId}`);
  };

  const joinDate = userData?.created_at
    ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const initials = (userData?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xs bg-white dark:bg-[#1E293B] dark:border-[#334155] p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#6275AF]" />
          </div>
        ) : !userData ? (
          <div className="text-center py-12 px-6">
            <p className="text-[#6275AF] dark:text-[#94A3B8] text-[13px]">User not found</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-b from-[#2563EB]/10 to-transparent dark:from-[#2563EB]/20 pt-8 pb-4 px-6 text-center">
              {userData.photo_url ? (
                <img src={userData.photo_url} alt={userData.username} className="w-16 h-16 rounded-full mx-auto mb-3 shadow-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#2563EB] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#2563EB]/20">
                  <span className="text-white text-lg font-bold">{initials}</span>
                </div>
              )}
              <h3 data-testid="user-preview-name" className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-[16px] flex items-center justify-center gap-1">
                {userData.username}
                {userData.verified && <VerifiedBadge size="xs" />}
              </h3>
            </div>

            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#F5F5F7] dark:bg-[#0F172A] rounded-xl p-3 text-center">
                  <Calendar className="w-4 h-4 text-[#6275AF] dark:text-[#94A3B8] mx-auto mb-1" />
                  <p className="text-[#0F172A] dark:text-[#F1F5F9] text-[12px] font-semibold">{joinDate}</p>
                  <p className="text-[#6275AF] dark:text-[#94A3B8] text-[10px]">Joined</p>
                </div>
                <div className="bg-[#F5F5F7] dark:bg-[#0F172A] rounded-xl p-3 text-center">
                  <FileText className="w-4 h-4 text-[#2563EB] mx-auto mb-1" />
                  <p className="text-[#0F172A] dark:text-[#F1F5F9] text-[12px] font-semibold">{postCount}</p>
                  <p className="text-[#6275AF] dark:text-[#94A3B8] text-[10px]">Posts</p>
                </div>
              </div>

              <Button
                data-testid="user-preview-view-posts"
                onClick={handleViewPosts}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-full py-2.5 text-[13px]"
              >
                View All Posts <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
