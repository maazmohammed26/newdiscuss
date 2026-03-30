import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUser, getPostsByUser } from '@/lib/db';
import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import VerifiedBadge from '@/components/VerifiedBadge';
import { ArrowLeft, User, FileText, Calendar, Loader2 } from 'lucide-react';

export default function UserPostsPage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      Promise.all([getUser(userId), getPostsByUser(userId)])
        .then(([u, p]) => { setUserData(u); setPosts(p); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [userId]);

  const handlePostDeleted = (postId) => setPosts(prev => prev.filter(p => p.id !== postId));
  const handlePostUpdated = (updatedPost) => setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
  const handleVoteChanged = (postId, voteData) => setPosts(prev =>
    prev.map(p => p.id === postId ? { ...p, upvote_count: voteData.upvote_count, downvote_count: voteData.downvote_count, votes: voteData.votes } : p)
  );

  const joinDate = userData?.created_at
    ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const initials = (userData?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F172A]">
      <Header />
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
        <button
          data-testid="user-posts-back"
          onClick={() => navigate('/feed')}
          className="flex items-center gap-2 text-[#6275AF] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white text-[13px] font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#6275AF]" /></div>
        ) : !userData ? (
          <div className="text-center py-16">
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">User not found</h2>
          </div>
        ) : (
          <>
            {/* User header card */}
            <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-4">
                {userData.photo_url ? (
                  <img src={userData.photo_url} alt={userData.username} className="w-14 h-14 rounded-full object-cover shadow-md" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#2563EB] flex items-center justify-center shadow-md shadow-[#2563EB]/20">
                    <span className="text-white text-lg font-bold">{initials}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 data-testid="user-posts-username" className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-[18px] flex items-center gap-1">
                    {userData.username}
                    {userData.verified && <VerifiedBadge size="sm" />}
                  </h1>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-[#6275AF] dark:text-[#94A3B8] text-[12px]">
                      <Calendar className="w-3.5 h-3.5" /> Joined {joinDate}
                    </span>
                    <span className="flex items-center gap-1 text-[#6275AF] dark:text-[#94A3B8] text-[12px]">
                      <FileText className="w-3.5 h-3.5" /> {posts.length} posts
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts */}
            {posts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155]">
                <User className="w-8 h-8 text-[#6275AF] dark:text-[#94A3B8] mx-auto mb-2" />
                <p className="text-[#6275AF] dark:text-[#94A3B8] text-[13px]">This user hasn't posted anything yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onDeleted={handlePostDeleted}
                    onUpdated={handlePostUpdated}
                    onVoteChanged={handleVoteChanged}
                    onTagClick={() => {}}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
