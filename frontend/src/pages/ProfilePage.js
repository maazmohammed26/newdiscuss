import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getPosts } from '@/lib/db';
import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import ThemeSelector from '@/components/ThemeSelector';
import { Button } from '@/components/ui/button';
import { FileText, LogOut, Loader2, AlertTriangle, ChevronDown, ChevronUp, Calendar, Filter } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showPosts, setShowPosts] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  useEffect(() => {
    if (user?.id) {
      setLoadingPosts(true);
      getPosts()
        .then(posts => setUserPosts(posts.filter(p => p.author_id === user.id)))
        .catch(() => {})
        .finally(() => setLoadingPosts(false));
    }
  }, [user]);

  const availableYears = useMemo(() => {
    const years = new Set();
    userPosts.forEach(p => {
      if (p.timestamp) years.add(new Date(p.timestamp).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [userPosts]);

  const filteredPosts = useMemo(() => {
    if (filterType === 'all') return userPosts;
    const now = new Date();
    return userPosts.filter(p => {
      if (!p.timestamp) return false;
      const d = new Date(p.timestamp);
      if (filterType === 'this_month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (filterType === 'month' && filterMonth !== '') {
        const yr = filterYear || now.getFullYear();
        return d.getMonth() === parseInt(filterMonth) && d.getFullYear() === parseInt(yr);
      }
      if (filterType === 'year' && filterYear) {
        return d.getFullYear() === parseInt(filterYear);
      }
      return true;
    });
  }, [userPosts, filterType, filterMonth, filterYear]);

  const handleLogout = async () => { 
    setLoggingOut(true); 
    await logout(); 
    window.history.replaceState(null, '', '/');
    navigate('/', { replace: true }); 
  };

  const handlePostDeleted = (postId) => setUserPosts(prev => prev.filter(p => p.id !== postId));
  const handlePostUpdated = (updatedPost) => setUserPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
  const handleVoteChanged = (postId, voteData) => setUserPosts(prev =>
    prev.map(p => p.id === postId ? { ...p, upvote_count: voteData.upvote_count, downvote_count: voteData.downvote_count, votes: voteData.votes } : p)
  );

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#121212]">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-none discuss:border discuss:border-[#333333] p-8 text-center">
          {user?.photo_url ? (
            <img src={user.photo_url} alt={user.username} className="w-24 h-24 mx-auto mb-5 shadow-lg object-cover discuss:border discuss:border-[#333333]" />
          ) : (
            <div className="w-24 h-24 bg-[#2563EB] discuss:bg-[#EF4444] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#2563EB]/20 discuss:shadow-[#EF4444]/20 discuss:border discuss:border-[#333333]">
              <span className="text-white discuss:text-white text-2xl font-bold">{initials}</span>
            </div>
          )}

          <h1 data-testid="profile-username" className="font-heading text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5]">{user?.username}</h1>
          <p data-testid="profile-email" className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[13px] mt-0.5">{user?.email}</p>

          <div className="inline-flex items-center gap-2 bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#1a1a1a] discuss:border discuss:border-[#333333] px-4 py-2 mt-4">
            <FileText className="w-4 h-4 text-[#2563EB] discuss:text-[#EF4444]" />
            <span data-testid="profile-post-count" className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-[13px] font-semibold">
              {loadingPosts ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : `${userPosts.length} Total Posts`}
            </span>
          </div>

          <div className="mt-6 pt-5 border-t border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-sm font-medium">Theme</span>
            </div>
            <ThemeSelector />
          </div>

          <div className="bg-[#FEF3C7] dark:bg-[#78350F]/20 discuss:bg-[#7C2D12]/20 discuss:border discuss:border-[#7C2D12] p-3 mt-5 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#D97706] discuss:text-[#F97316] shrink-0" />
            <p data-testid="profile-password-notice" className="text-[#92400E] dark:text-[#FDE68A] discuss:text-[#FED7AA] text-[13px] text-left">Password change is not possible for now.</p>
          </div>

          <Button data-testid="profile-logout-btn" onClick={handleLogout} disabled={loggingOut}
            className="w-full bg-[#2563EB]/10 hover:bg-[#2563EB]/20 text-[#2563EB] discuss:bg-[#EF4444]/10 discuss:hover:bg-[#EF4444]/20 discuss:text-[#EF4444] font-semibold py-3 h-12 mt-5 transition-all">
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4 mr-2" /> Logout</>}
          </Button>
        </div>

        {/* Your Posts Section */}
        <div className="mt-6">
          <button
            data-testid="your-posts-toggle"
            onClick={() => setShowPosts(!showPosts)}
            className="w-full flex items-center justify-between bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] px-5 py-4 hover:shadow-md dark:hover:shadow-none transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#2563EB]/10 discuss:bg-[#EF4444]/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#2563EB] discuss:text-[#EF4444]" />
              </div>
              <div className="text-left">
                <h2 className="text-[15px] font-bold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5]">Your Posts</h2>
                <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-xs">{userPosts.length} post{userPosts.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {showPosts ? <ChevronUp className="w-5 h-5 text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF]" /> : <ChevronDown className="w-5 h-5 text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF]" />}
          </button>

          {showPosts && (
            <div className="mt-4 space-y-4">
              {/* Filter bar */}
              <div data-testid="post-filter-bar" className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2.5">
                <Filter className="w-3.5 h-3.5 text-[#6275AF] dark:text-[#94A3B8]" />
                <select
                  data-testid="filter-type-select"
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setFilterMonth(''); setFilterYear(''); }}
                  className="bg-[#F5F5F7] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F1F5F9] rounded-lg px-2.5 py-1.5 text-[12px] font-medium outline-none focus:border-[#2563EB]"
                >
                  <option value="all">All Posts</option>
                  <option value="this_month">This Month</option>
                  <option value="month">Select Month</option>
                  <option value="year">Select Year</option>
                </select>

                {filterType === 'month' && (
                  <>
                    <select
                      data-testid="filter-month-select"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="bg-[#F5F5F7] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F1F5F9] rounded-lg px-2.5 py-1.5 text-[12px] font-medium outline-none focus:border-[#2563EB]"
                    >
                      <option value="">Month</option>
                      {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select
                      data-testid="filter-month-year-select"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="bg-[#F5F5F7] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F1F5F9] rounded-lg px-2.5 py-1.5 text-[12px] font-medium outline-none focus:border-[#2563EB]"
                    >
                      <option value="">Year</option>
                      {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </>
                )}

                {filterType === 'year' && (
                  <select
                    data-testid="filter-year-select"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="bg-[#F5F5F7] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F1F5F9] rounded-lg px-2.5 py-1.5 text-[12px] font-medium outline-none focus:border-[#2563EB]"
                  >
                    <option value="">Year</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}

                {filterType !== 'all' && (
                  <span className="text-[#6275AF] dark:text-[#94A3B8] text-[11px] ml-auto">
                    {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {loadingPosts ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#6275AF]" />
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155]">
                  <Calendar className="w-8 h-8 text-[#6275AF] dark:text-[#94A3B8] mx-auto mb-2" />
                  <p className="text-[#6275AF] dark:text-[#94A3B8] text-[13px]">
                    {filterType === 'all' ? "You haven't created any posts yet." : 'No posts found for this period.'}
                  </p>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={user}
                    onDeleted={handlePostDeleted}
                    onUpdated={handlePostUpdated}
                    onVoteChanged={handleVoteChanged}
                    onTagClick={() => {}}
                  />
                ))
              )}
            </div>
          )}
        </div>

        <p className="text-center text-[#94A3B8] dark:text-[#6275AF] text-xs mt-6">
          Managed by <span className="font-semibold text-[#BC4800]">&lt;discuss&gt;</span>
        </p>
      </div>
    </div>
  );
}
