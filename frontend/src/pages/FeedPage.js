import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPosts, getTrendingHashtags, subscribeToPostsRealtime } from '@/lib/db';
import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import CreatePostModal from '@/components/CreatePostModal';
import LoadingScreen from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MessageSquare, FolderGit2, WifiOff, Loader2, Search, X, Hash, TrendingUp } from 'lucide-react';

const MemoPostCard = memo(PostCard);

export default function FeedPage() {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [trendingTags, setTrendingTags] = useState([]);
  const [activeTab, setActiveTab] = useState('discussion');

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await getPosts();
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
      setAllPosts(updatedPosts);
      setLoading(false);
      fetchTrendingTags();
    });
    return () => unsubscribe();
  }, [fetchTrendingTags]);

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); fetchPosts(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchPosts]);

  // Client-side fast filtering: by tab AND search query
  const filteredPosts = useMemo(() => {
    let posts = allPosts.filter(p => p.type === activeTab);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      posts = posts.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.content?.toLowerCase().includes(q) ||
        p.author_username?.toLowerCase().includes(q) ||
        (p.hashtags || []).some(t => t.toLowerCase().includes(q.replace('#', '')))
      );
    }
    return posts;
  }, [allPosts, activeTab, debouncedSearch]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const handleTagClick = (tag) => {
    setSearchQuery(tag);
  };

  const handlePostCreated = () => {
    setShowCreate(false);
    fetchTrendingTags();
  };

  const handlePostDeleted = useCallback((postId) => {
    setAllPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const handlePostUpdated = useCallback((updatedPost) => {
    setAllPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  }, []);

  const handleVoteChanged = useCallback((postId, voteData) => {
    setAllPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, upvote_count: voteData.upvote_count, downvote_count: voteData.downvote_count, votes: voteData.votes } : p
      )
    );
  }, []);

  if (pageLoading) {
    return <LoadingScreen message="Loading your feed..." />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F172A]">
      <Header />
      
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
            className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-md px-4 py-2 font-medium shadow-sm"
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
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#6275AF] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#334155]'
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
                ? 'bg-[#BC4800] text-white shadow-sm'
                : 'text-[#6275AF] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#334155]'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            Project Posts
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6275AF] dark:text-[#94A3B8]" />
            <Input
              data-testid="feed-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab === 'discussion' ? 'discussions' : 'projects'}...`}
              className="pl-10 pr-10 bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155] dark:text-[#F1F5F9] dark:placeholder:text-[#6275AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 rounded-xl text-[13px] md:text-[15px] h-10"
            />
            {searchQuery && (
              <button
                type="button"
                data-testid="feed-search-clear"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6275AF] hover:text-[#0F172A] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active search indicator */}
        {debouncedSearch && (
          <div data-testid="active-search-badge" className="flex items-center gap-2 mb-4 bg-[#2563EB]/8 dark:bg-[#2563EB]/15 border border-[#2563EB]/15 dark:border-[#2563EB]/30 rounded-lg px-3 py-2">
            <Search className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="text-[#2563EB] text-[13px] font-medium">
              {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} for "{debouncedSearch}" in {activeTab === 'discussion' ? 'Discussions' : 'Projects'}
            </span>
            <button onClick={handleClearSearch} className="ml-auto text-[#2563EB] hover:text-[#1D4ED8]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Trending hashtags */}
        {trendingTags.length > 0 && !debouncedSearch && (
          <div data-testid="trending-tags" className="mb-5">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#6275AF] dark:text-[#94A3B8]" />
              <span className="text-[#6275AF] dark:text-[#94A3B8] text-xs font-semibold uppercase tracking-wider">Trending</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trendingTags.slice(0, 4).map((t) => (
                <button
                  key={t.tag}
                  data-testid={`trending-tag-${t.tag}`}
                  onClick={() => handleTagClick(t.tag)}
                  className="inline-flex items-center gap-1 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#2563EB]/30 hover:bg-[#2563EB]/5 dark:hover:bg-[#2563EB]/10 rounded-full px-2.5 py-1 text-xs font-medium text-[#6275AF] dark:text-[#94A3B8] hover:text-[#2563EB] transition-all"
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
            <Loader2 className="w-6 h-6 animate-spin text-[#6275AF]" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div data-testid="empty-feed" className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] flex items-center justify-center mx-auto mb-4">
              {activeTab === 'discussion' ? (
                <MessageSquare className="w-7 h-7 text-[#6275AF] dark:text-[#94A3B8]" />
              ) : (
                <FolderGit2 className="w-7 h-7 text-[#6275AF] dark:text-[#94A3B8]" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-1">
              {debouncedSearch ? 'No results found' : `No ${activeTab === 'discussion' ? 'discussions' : 'projects'} yet`}
            </h3>
            <p className="text-[#6275AF] dark:text-[#94A3B8] text-[13px] md:text-[15px]">
              {debouncedSearch ? `Try a different search term` : `Be the first to start a ${activeTab === 'discussion' ? 'discussion' : 'project post'}!`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <MemoPostCard
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
