import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPosts, getTrendingHashtags, subscribeToPostsRealtime } from '@/lib/db';
import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';
import AdminMessageBanner from '@/components/AdminMessageBanner';
import LoadingScreen from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MessageSquare, FolderGit2, WifiOff, Loader2, Search, X, Hash, TrendingUp } from 'lucide-react';

export default function FeedPage() {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [trendingTags, setTrendingTags] = useState([]);
  const [activeTab, setActiveTab] = useState('discussion');

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const fetchPosts = useCallback(async (search = '') => {
    try {
      const data = await getPosts(search || null);
      setAllPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrendingTags = useCallback(async () => {
    try {
      const tags = await getTrendingHashtags();
      setTrendingTags(tags);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchTrendingTags();
  }, [fetchPosts, fetchTrendingTags]);

  // Firebase real-time listener
  useEffect(() => {
    const unsubscribe = subscribeToPostsRealtime(async (updatedPosts) => {
      if (activeSearch) {
        const q = activeSearch.toLowerCase().trim();
        const filtered = updatedPosts.filter(p => 
          p.title?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q) ||
          p.author_username?.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q) ||
          (p.hashtags || []).some(t => t.toLowerCase().includes(q.replace('#', '')))
        );
        setAllPosts(filtered);
      } else {
        setAllPosts(updatedPosts);
      }
      setLoading(false);
      fetchTrendingTags();
    });

    return () => unsubscribe();
  }, [activeSearch, fetchTrendingTags]);

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); fetchPosts(activeSearch); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchPosts, activeSearch]);

  // Filter posts by active tab
  const filteredPosts = allPosts.filter(p => p.type === activeTab);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setLoading(true);
    fetchPosts(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setLoading(true);
    fetchPosts('');
  };

  const handleTagClick = (tag) => {
    setSearchQuery(tag);
    setActiveSearch(tag);
    setLoading(true);
    fetchPosts(tag);
  };

  const handlePostCreated = () => {
    setShowCreate(false);
    fetchTrendingTags();
  };

  const handlePostDeleted = (postId) => {
    setAllPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setAllPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const handleVoteChanged = (postId, voteData) => {
    setAllPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, upvote_count: voteData.upvote_count, downvote_count: voteData.downvote_count, votes: voteData.votes } : p
      )
    );
  };

  if (pageLoading) {
    return <LoadingScreen message="Loading your feed..." />;
  }

  return (
    <div className="min-h-screen bg-[#F0F4FA] dark:bg-[#0F172A]">
      <Header />
      <AdminMessageBanner />
      
      {isOffline && (
        <div data-testid="offline-banner" className="bg-[#F59E0B]/10 border-b border-[#F59E0B]/20 py-2 px-4 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-[#F59E0B] text-[13px] font-medium">You're offline. Showing cached content.</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
        {/* Header + Create */}
        <div className="flex items-center justify-between mb-4">
          <h1 data-testid="feed-title" className="font-heading text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">Feed</h1>
          <Button
            data-testid="create-post-btn"
            onClick={() => setShowCreate(true)}
            className="bg-[#CC0000] text-white hover:bg-[#A30000] rounded-md px-4 py-2 font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Post
          </Button>
        </div>

        {/* Tabs */}
        <div data-testid="feed-tabs" className="flex mb-4 bg-white dark:bg-[#1E293B] rounded-xl p-1 border border-[#E2E8F0] dark:border-[#334155]">
          <button
            data-testid="tab-discussion"
            onClick={() => setActiveTab('discussion')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
              activeTab === 'discussion'
                ? 'bg-[#CC0000] text-white shadow-sm'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F0F4FA] dark:hover:bg-[#334155]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Discussions
          </button>
          <button
            data-testid="tab-project"
            onClick={() => setActiveTab('project')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
              activeTab === 'project'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F0F4FA] dark:hover:bg-[#334155]'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            Project Posts
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
            <Input
              data-testid="feed-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab === 'discussion' ? 'discussions' : 'projects'}...`}
              className="pl-10 pr-10 bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155] dark:text-[#F1F5F9] dark:placeholder:text-[#64748B] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 rounded-xl text-[13px] md:text-[15px] h-10"
            />
            {(searchQuery || activeSearch) && (
              <button
                type="button"
                data-testid="feed-search-clear"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Active search indicator */}
        {activeSearch && (
          <div data-testid="active-search-badge" className="flex items-center gap-2 mb-4 bg-[#3B82F6]/8 dark:bg-[#3B82F6]/15 border border-[#3B82F6]/15 dark:border-[#3B82F6]/30 rounded-lg px-3 py-2">
            <Search className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="text-[#3B82F6] text-[13px] font-medium">
              Showing results for "{activeSearch}" in {activeTab === 'discussion' ? 'Discussions' : 'Projects'}
            </span>
            <button onClick={handleClearSearch} className="ml-auto text-[#3B82F6] hover:text-[#2563EB]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Trending hashtags */}
        {trendingTags.length > 0 && !activeSearch && (
          <div data-testid="trending-tags" className="mb-5">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8]" />
              <span className="text-[#64748B] dark:text-[#94A3B8] text-xs font-semibold uppercase tracking-wider">Trending</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trendingTags.slice(0, 4).map((t) => (
                <button
                  key={t.tag}
                  data-testid={`trending-tag-${t.tag}`}
                  onClick={() => handleTagClick(t.tag)}
                  className="inline-flex items-center gap-1 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#3B82F6]/30 hover:bg-[#3B82F6]/5 dark:hover:bg-[#3B82F6]/10 rounded-full px-2.5 py-1 text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#3B82F6] transition-all"
                >
                  <Hash className="w-3 h-3" />
                  {t.tag}
                  <span className="text-[10px] opacity-60">({t.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#64748B]" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div data-testid="empty-feed" className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] flex items-center justify-center mx-auto mb-4">
              {activeTab === 'discussion' ? (
                <MessageSquare className="w-7 h-7 text-[#64748B] dark:text-[#94A3B8]" />
              ) : (
                <FolderGit2 className="w-7 h-7 text-[#64748B] dark:text-[#94A3B8]" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-1">
              {activeSearch ? 'No results found' : `No ${activeTab === 'discussion' ? 'discussions' : 'projects'} yet`}
            </h3>
            <p className="text-[#64748B] dark:text-[#94A3B8] text-[13px] md:text-[15px]">
              {activeSearch ? `Try a different search term` : `Be the first to start a ${activeTab === 'discussion' ? 'discussion' : 'project post'}!`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                onDeleted={handlePostDeleted}
                onUpdated={handlePostUpdated}
                onVoteChanged={handleVoteChanged}
                onTagClick={handleTagClick}
              />
            ))}
          </div>
        )}
      </div>

      <CreatePostModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handlePostCreated}
      />
    </div>
  );
}
