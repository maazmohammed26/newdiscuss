import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUser } from '@/lib/db';
import { getUserProfile } from '@/lib/userProfileDb';
import { isChatEnabled, getRelationshipStatus, getRelationshipDetails, RELATIONSHIP_STATUS } from '@/lib/relationshipsDb';
import { 
  getOrCreateChat, 
  sendMessage, 
  subscribeToMessages, 
  markMessagesAsRead,
  getChatStatus,
  getChatSettings,
  toggleAutoDelete,
  deleteOldMessages,
  generateChatId,
  deleteChat,
  CHAT_STATUS
} from '@/lib/chatsDb';
import Header from '@/components/Header';
import FriendRequestButton from '@/components/FriendRequestButton';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, Send, Loader2, Lock, MoreVertical, Trash2, User, AlertTriangle, Clock, Settings 
} from 'lucide-react';
import { toast } from 'sonner';

export default function ChatConversationPage() {
  const { otherUserId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const [otherUser, setOtherUser] = useState(null);
  const [otherUserProfile, setOtherUserProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [chatStatus, setChatStatus] = useState(CHAT_STATUS.ACTIVE);
  const [relationshipStatus, setRelationshipStatus] = useState(RELATIONSHIP_STATUS.NONE);
  const [unfollowedBy, setUnfollowedBy] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAutoDeleteConfirm, setShowAutoDeleteConfirm] = useState(false);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load other user data and chat
  useEffect(() => {
    if (!user?.id || !otherUserId) return;

    const loadData = async () => {
      try {
        // Load other user details
        const [userData, profileData] = await Promise.all([
          getUser(otherUserId),
          getUserProfile(otherUserId)
        ]);
        setOtherUser(userData);
        setOtherUserProfile(profileData);

        // Check relationship and chat status with details
        const [canChat, status, details] = await Promise.all([
          isChatEnabled(user.id, otherUserId),
          getRelationshipStatus(user.id, otherUserId),
          getRelationshipDetails(user.id, otherUserId)
        ]);
        setChatEnabled(canChat);
        setRelationshipStatus(status);
        setUnfollowedBy(details.unfollowedBy);

        // Get or create chat
        const generatedChatId = generateChatId(user.id, otherUserId);
        setChatId(generatedChatId);

        // Check chat status and settings
        const [currentChatStatus, chatSettings] = await Promise.all([
          getChatStatus(generatedChatId),
          getChatSettings(generatedChatId)
        ]);
        
        if (currentChatStatus) {
          setChatStatus(currentChatStatus);
        }
        
        if (chatSettings) {
          setAutoDeleteEnabled(chatSettings.autoDelete || false);
        }

        // If chat is enabled, try to get/create it
        if (canChat) {
          try {
            await getOrCreateChat(user.id, otherUserId);
          } catch (err) {
            console.error('Error creating chat:', err);
          }
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, otherUserId]);

  // Subscribe to messages
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      // Mark as read when messages arrive
      if (user?.id) {
        markMessagesAsRead(chatId, user.id);
      }
    });

    return () => unsubscribe();
  }, [chatId, user?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle relationship status change
  const handleStatusChange = useCallback((newStatus) => {
    setRelationshipStatus(newStatus);
    if (newStatus === RELATIONSHIP_STATUS.FRIENDS) {
      setChatEnabled(true);
      setChatStatus(CHAT_STATUS.ACTIVE);
    } else if (newStatus === RELATIONSHIP_STATUS.UNFOLLOWED) {
      setChatEnabled(false);
      setChatStatus(CHAT_STATUS.BLOCKED);
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || sending || !chatEnabled) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear immediately for instant feedback
    setSending(true);
    
    try {
      await sendMessage(chatId, user.id, messageText);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Send message error:', error);
      setNewMessage(messageText); // Restore message if failed
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!chatId) return;
    
    setDeleting(true);
    try {
      await deleteChat(chatId);
      toast.success('Chat deleted');
      navigate('/chat');
    } catch (error) {
      toast.error('Failed to delete chat');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleAutoDelete = async () => {
    if (!chatId) return;
    
    try {
      await toggleAutoDelete(chatId, !autoDeleteEnabled);
      setAutoDeleteEnabled(!autoDeleteEnabled);
      setShowAutoDeleteConfirm(false);
      
      if (!autoDeleteEnabled) {
        toast.success('Auto-delete enabled. Messages will be deleted after 24 hours.');
        // Run initial cleanup
        await deleteOldMessages(chatId, 24);
      } else {
        toast.success('Auto-delete disabled. Messages will be kept permanently.');
      }
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const initials = (otherUser?.username || 'U').slice(0, 2).toUpperCase();
  const displayName = otherUserProfile?.fullName || otherUser?.username || 'Unknown';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] discuss:text-[#EF4444]" />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#121212]">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <User className="w-12 h-12 text-[#6275AF] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] mb-2">
            User not found
          </h2>
          <Button onClick={() => navigate('/chat')} variant="outline">
            Back to Chats
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#121212] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] border-b border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 -ml-2 rounded-lg hover:bg-[#F5F5F7] dark:hover:bg-[#0F172A] discuss:hover:bg-[#262626] text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => navigate(`/user/${otherUserId}`)}
              className="flex items-center gap-3"
            >
              {otherUser.photo_url ? (
                <img
                  src={otherUser.photo_url}
                  alt={otherUser.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#2563EB] discuss:bg-[#EF4444] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{initials}</span>
                </div>
              )}
              
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-sm">
                    {displayName}
                  </span>
                  {otherUser.verified && <VerifiedBadge size="sm" />}
                </div>
                <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-xs">
                  @{otherUser.username}
                </p>
              </div>
            </button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-[#F5F5F7] dark:hover:bg-[#0F172A] discuss:hover:bg-[#262626] text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF]">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-[#1E293B] dark:border-[#334155] discuss:bg-[#262626] discuss:border-[#333333]">
              <DropdownMenuItem
                onClick={() => navigate(`/user/${otherUserId}`)}
                className="dark:text-[#F1F5F9] discuss:text-[#F5F5F5] dark:focus:bg-[#334155] discuss:focus:bg-[#333333]"
              >
                <User className="w-4 h-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-[#334155] discuss:bg-[#333333]" />
              <DropdownMenuItem
                onClick={() => setShowAutoDeleteConfirm(true)}
                className="dark:text-[#F1F5F9] discuss:text-[#F5F5F5] dark:focus:bg-[#334155] discuss:focus:bg-[#333333]"
              >
                <Clock className="w-4 h-4 mr-2" />
                {autoDeleteEnabled ? 'Disable Auto-Delete' : 'Enable Auto-Delete (24h)'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-[#334155] discuss:bg-[#333333]" />
              <DropdownMenuItem
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[#EF4444] focus:text-[#EF4444] dark:focus:bg-[#334155] discuss:focus:bg-[#333333]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Auto-delete banner - visible to both users */}
      {autoDeleteEnabled && (
        <div className="bg-[#F59E0B]/10 border-b border-[#F59E0B]/20 px-4 py-2">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#92400E] dark:text-[#FCD34D] discuss:text-[#FCD34D]">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">
                Auto-delete enabled • Messages delete after 24 hours
              </span>
            </div>
            <button
              onClick={() => setShowAutoDeleteConfirm(true)}
              className="text-[#92400E] dark:text-[#FCD34D] discuss:text-[#FCD34D] text-xs font-semibold hover:underline"
            >
              Turn off
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide"
        style={{ maxHeight: autoDeleteEnabled ? 'calc(100vh - 176px)' : 'calc(100vh - 140px)' }}
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="bg-[#E2E8F0] dark:bg-[#334155] discuss:bg-[#333333] text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-xs px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>
              
              {/* Messages for this date */}
              {dateMessages.map((message, index) => {
                const isOwn = message.sender === user.id;
                const showAvatar = !isOwn && (index === 0 || dateMessages[index - 1]?.sender !== message.sender);
                
                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwn && showAvatar && (
                      otherUser.photo_url ? (
                        <img
                          src={otherUser.photo_url}
                          alt={otherUser.username}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#2563EB] discuss:bg-[#EF4444] flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold">{initials}</span>
                        </div>
                      )
                    )}
                    {!isOwn && !showAvatar && <div className="w-6" />}
                    
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-[#2563EB] discuss:bg-[#EF4444] text-white rounded-br-md'
                          : 'bg-white dark:bg-[#1E293B] discuss:bg-[#262626] text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                      <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/70' : 'text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF]'}`}>
                        {formatMessageTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {messages.length === 0 && chatEnabled && (
            <div className="text-center py-10">
              <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-sm">
                No messages yet. Say hello! 👋
              </p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat disabled message */}
      {!chatEnabled && (
        <div className="bg-[#FEF3C7] dark:bg-[#F59E0B]/20 discuss:bg-[#F59E0B]/10 border-t border-[#F59E0B]/30 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#F59E0B] shrink-0" />
              <div className="flex-1">
                <p className="text-[#92400E] dark:text-[#FCD34D] discuss:text-[#FCD34D] text-sm font-medium">
                  You can no longer send messages to this user
                </p>
                <p className="text-[#B45309] dark:text-[#FBBF24] discuss:text-[#FBBF24] text-xs mt-0.5">
                  {relationshipStatus === RELATIONSHIP_STATUS.UNFOLLOWED 
                    ? (unfollowedBy === user?.id 
                        ? 'You unfollowed this user. Send a friend request to chat again.'
                        : 'This user has unfollowed you.')
                    : 'You need to be friends to send messages.'}
                </p>
              </div>
              <FriendRequestButton
                targetUserId={otherUserId}
                targetUsername={otherUser?.username}
                size="sm"
                showChat={false}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Message input */}
      {chatEnabled && (
        <div className="bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] border-t border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] px-4 py-3 sticky bottom-0">
          <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#262626] border-0 text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] placeholder:text-[#6275AF] dark:placeholder:text-[#94A3B8] discuss:placeholder:text-[#9CA3AF] rounded-full px-4"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="rounded-full w-10 h-10 p-0 bg-[#2563EB] discuss:bg-[#EF4444] hover:bg-[#1D4ED8] discuss:hover:bg-[#DC2626] text-white"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="dark:bg-[#1E293B] dark:border-[#334155] discuss:bg-[#262626] discuss:border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-[#F1F5F9] discuss:text-[#F5F5F5] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              Delete Chat?
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-[#94A3B8] discuss:text-[#9CA3AF]">
              This will delete the chat for both users. This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-[#334155] dark:text-[#F1F5F9] dark:border-[#334155] discuss:bg-[#333333] discuss:text-[#F5F5F5] discuss:border-[#333333]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              disabled={deleting}
              className="bg-[#EF4444] text-white hover:bg-[#DC2626]"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Chat'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Auto-delete confirmation dialog */}
      <AlertDialog open={showAutoDeleteConfirm} onOpenChange={setShowAutoDeleteConfirm}>
        <AlertDialogContent className="dark:bg-[#1E293B] dark:border-[#334155] discuss:bg-[#262626] discuss:border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-[#F1F5F9] discuss:text-[#F5F5F5] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#F59E0B]" />
              {autoDeleteEnabled ? 'Disable Auto-Delete?' : 'Enable Auto-Delete?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-[#94A3B8] discuss:text-[#9CA3AF]">
              {autoDeleteEnabled 
                ? 'Messages will be kept permanently. Do you want to disable auto-delete?'
                : 'All messages will be automatically deleted after 24 hours. This applies to this chat only. Do you want to continue?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-[#334155] dark:text-[#F1F5F9] dark:border-[#334155] discuss:bg-[#333333] discuss:text-[#F5F5F5] discuss:border-[#333333]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleAutoDelete}
              className={autoDeleteEnabled 
                ? "bg-[#10B981] text-white hover:bg-[#059669]"
                : "bg-[#F59E0B] text-white hover:bg-[#D97706]"
              }
            >
              {autoDeleteEnabled ? 'Disable' : 'Enable Auto-Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
