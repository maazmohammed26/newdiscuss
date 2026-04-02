import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getChatsWithUserDetails, subscribeToUserChats } from '@/lib/chatsDb';
import { getFriendsWithDetails, searchFriends } from '@/lib/relationshipsDb';
import Header from '@/components/Header';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Search, X, MessageCircle, Users, Loader2, 
  MessageSquarePlus, Clock 
} from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'friends'

  // Load chats and friends
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        const [chatsData, friendsData] = await Promise.all([
          getChatsWithUserDetails(user.id),
          getFriendsWithDetails(user.id)
        ]);
        setChats(chatsData);
        setFriends(friendsData);
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time chat updates
    const unsubscribe = subscribeToUserChats(user.id, async (updatedChats) => {
      // Fetch user details for updated chats
      const chatsWithDetails = await getChatsWithUserDetails(user.id);
      setChats(chatsWithDetails);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim() || !user?.id) {
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setSearching(true);
      try {
        if (activeTab === 'friends') {
          const results = await searchFriends(user.id, searchQuery);
          setSearchResults(results);
        } else {
          // Search in chats
          const filtered = chats.filter(chat =>
            chat.otherUserDetails?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery, user?.id, activeTab, chats]);

  const handleChatClick = (otherUserId) => {
    navigate(`/chat/${otherUserId}`);
  };

  const handleStartNewChat = (friendId) => {
    navigate(`/chat/${friendId}`);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderChatItem = (chat) => {
    const otherUser = chat.otherUserDetails || {};
    const initials = (otherUser.username || 'U').slice(0, 2).toUpperCase();
    const isBlocked = chat.status === 'blocked';

    return (
      <button
        key={chat.chatId}
        onClick={() => handleChatClick(chat.otherUser)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
          isBlocked 
            ? 'bg-[#F5F5F7]/50 dark:bg-[#1E293B]/50 discuss:bg-[#1a1a1a]/50 opacity-60'
            : 'bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] hover:shadow-md dark:hover:shadow-none'
        } border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333]`}
      >
        {otherUser.photo_url ? (
          <img
            src={otherUser.photo_url}
            alt={otherUser.username}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#2563EB] discuss:bg-[#EF4444] flex items-center justify-center shrink-0">
            <span className="text-white font-bold">{initials}</span>
          </div>
        )}
        
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-sm truncate">
                @{otherUser.username || 'Unknown'}
              </span>
              {otherUser.verified && <VerifiedBadge size="sm" />}
            </div>
            <span className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-xs shrink-0">
              {formatTime(chat.lastMessageTime)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-xs truncate">
              {isBlocked ? 'Chat unavailable' : (chat.lastMessage || 'No messages yet')}
            </p>
            {chat.unreadCount > 0 && !isBlocked && (
              <span className="bg-[#2563EB] discuss:bg-[#EF4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderFriendItem = (friend) => {
    const initials = (friend.username || 'U').slice(0, 2).toUpperCase();

    return (
      <button
        key={friend.id}
        onClick={() => handleStartNewChat(friend.id)}
        className="w-full flex items-center gap-3 p-3 bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] rounded-xl hover:shadow-md dark:hover:shadow-none transition-all border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333]"
      >
        {friend.photo_url ? (
          <img
            src={friend.photo_url}
            alt={friend.username}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#2563EB] discuss:bg-[#EF4444] flex items-center justify-center shrink-0">
            <span className="text-white font-bold">{initials}</span>
          </div>
        )}
        
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-sm truncate">
              @{friend.username}
            </span>
            {friend.verified && <VerifiedBadge size="sm" />}
          </div>
          <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-xs">
            Friends since {new Date(friend.since).toLocaleDateString([], { month: 'short', year: 'numeric' })}
          </p>
        </div>

        <MessageSquarePlus className="w-5 h-5 text-[#2563EB] discuss:text-[#EF4444] shrink-0" />
      </button>
    );
  };

  const displayData = searchQuery.trim() ? searchResults : (activeTab === 'chats' ? chats : friends);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#121212]">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
        {/* Back button and title */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/feed')}
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-[#1E293B] discuss:hover:bg-[#1a1a1a] text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-heading text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5]">
            Messages
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex mb-4 bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] rounded-xl p-1 border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333]">
          <button
            onClick={() => { setActiveTab('chats'); setSearchQuery(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
              activeTab === 'chats'
                ? 'bg-[#2563EB] discuss:bg-[#EF4444] text-white shadow-sm'
                : 'text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] hover:text-[#0F172A] dark:hover:text-white discuss:hover:text-[#F5F5F5]'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Chats
            {chats.filter(c => c.unreadCount > 0).length > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {chats.filter(c => c.unreadCount > 0).length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('friends'); setSearchQuery(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
              activeTab === 'friends'
                ? 'bg-[#2563EB] discuss:bg-[#EF4444] text-white shadow-sm'
                : 'text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] hover:text-[#0F172A] dark:hover:text-white discuss:hover:text-[#F5F5F5]'
            }`}
          >
            <Users className="w-4 h-4" />
            Friends
            <span className="bg-[#E2E8F0] dark:bg-[#334155] discuss:bg-[#333333] text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[10px] px-1.5 py-0.5 rounded-full">
              {friends.length}
            </span>
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'chats' ? 'Search chats...' : 'Search friends...'}
              className="pl-10 pr-10 bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] placeholder:text-[#6275AF] dark:placeholder:text-[#94A3B8] discuss:placeholder:text-[#9CA3AF] rounded-xl text-sm h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6275AF] hover:text-[#0F172A] dark:hover:text-white discuss:hover:text-[#F5F5F5]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#6275AF]" />
          </div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333]">
            {searchQuery ? (
              <>
                <Search className="w-10 h-10 text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] mx-auto mb-3" />
                <h3 className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] font-semibold mb-1">
                  No results found
                </h3>
                <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-sm">
                  Try a different search term
                </p>
              </>
            ) : activeTab === 'chats' ? (
              <>
                <MessageCircle className="w-10 h-10 text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] mx-auto mb-3" />
                <h3 className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] font-semibold mb-1">
                  No chats yet
                </h3>
                <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-sm mb-4">
                  Start a conversation with your friends
                </p>
                {friends.length > 0 && (
                  <Button
                    onClick={() => setActiveTab('friends')}
                    className="bg-[#2563EB] discuss:bg-[#EF4444] hover:bg-[#1D4ED8] discuss:hover:bg-[#DC2626] text-white"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Friends
                  </Button>
                )}
              </>
            ) : (
              <>
                <Users className="w-10 h-10 text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] mx-auto mb-3" />
                <h3 className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] font-semibold mb-1">
                  No friends yet
                </h3>
                <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-sm mb-4">
                  Find people to connect with
                </p>
                <Button
                  onClick={() => navigate('/profile')}
                  className="bg-[#2563EB] discuss:bg-[#EF4444] hover:bg-[#1D4ED8] discuss:hover:bg-[#DC2626] text-white"
                >
                  Find Friends
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2 scrollbar-hide" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            {activeTab === 'chats'
              ? displayData.map(renderChatItem)
              : displayData.map(renderFriendItem)
            }
          </div>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
