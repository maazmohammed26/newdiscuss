import { useState, useEffect } from 'react';
import { getComments, subscribeToCommentsRealtime } from '@/lib/db';
import { 
  createCommentFirestore, 
  getCommentsFirestore, 
  deleteCommentFirestore,
  subscribeToCommentsFirestore 
} from '@/lib/commentsDb';
import { 
  getCachedComments, 
  cacheComments, 
  addCachedComment, 
  removeCachedComment 
} from '@/lib/cacheManager';
import ExpandableText from '@/components/ExpandableText';
import VerifiedBadge from '@/components/VerifiedBadge';
import CommentUserInfoModal from '@/components/CommentUserInfoModal';
import LinkifiedText from '@/components/LinkifiedText';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Comment character limit
const COMMENT_CHAR_LIMIT = 500;

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function CommentsSection({ postId, postAuthorId, currentUser }) {
  const [oldComments, setOldComments] = useState([]); // From Realtime DB (primary Firebase)
  const [newComments, setNewComments] = useState([]); // From Realtime DB (secondary Firebase)
  const [newComment, setNewComment] = useState('');
  const [loadingOld, setLoadingOld] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [userInfoModal, setUserInfoModal] = useState(null);

  // Combine and sort all comments by timestamp
  const allComments = [...oldComments, ...newComments].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  const loading = loadingOld || loadingNew;
  const charCount = newComment.length;
  const isOverLimit = charCount > COMMENT_CHAR_LIMIT;

  // Fetch old comments from Realtime Database (primary Firebase)
  useEffect(() => {
    getComments(postId).then(data => {
      setOldComments(data.map(c => ({ ...c, source: 'realtime' })));
      setLoadingOld(false);
    }).catch(() => setLoadingOld(false));

    const unsubscribe = subscribeToCommentsRealtime(postId, (updatedComments) => {
      setOldComments(updatedComments.map(c => ({ ...c, source: 'realtime' })));
      setLoadingOld(false);
    });

    return () => unsubscribe();
  }, [postId]);

  // Fetch new comments from Realtime Database (secondary Firebase) with caching
  useEffect(() => {
    const loadComments = async () => {
      // Try to get cached comments first
      const cached = await getCachedComments(postId);
      if (cached && cached.length > 0) {
        setNewComments(cached.map(c => ({ ...c, source: 'firestore' })));
        setLoadingNew(false);
      }

      // Fetch fresh comments
      try {
        const data = await getCommentsFirestore(postId);
        const commentsWithSource = data.map(c => ({ ...c, source: 'firestore' }));
        setNewComments(commentsWithSource);
        // Cache the comments
        await cacheComments(postId, commentsWithSource);
      } catch (err) {
        console.error('Error loading comments:', err);
      }
      setLoadingNew(false);
    };

    loadComments();

    const unsubscribe = subscribeToCommentsFirestore(postId, async (updatedComments) => {
      const commentsWithSource = updatedComments.map(c => ({ ...c, source: 'firestore' }));
      setNewComments(commentsWithSource);
      // Update cache
      await cacheComments(postId, commentsWithSource);
      setLoadingNew(false);
    });

    return () => unsubscribe();
  }, [postId]);

  // Submit new comment to secondary Realtime Database
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isOverLimit) return;
    setSubmitting(true);
    try {
      await createCommentFirestore(postId, newComment.trim(), currentUser);
      // Don't add optimistically - real-time subscription will handle it
      setNewComment('');
    } catch (err) {
      toast.error(err.message || 'Failed to add comment');
    } finally { 
      setSubmitting(false); 
    }
  };

  // Delete comment - handle both sources
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    
    const targetComment = allComments.find(c => c.id === deleteTarget);
    
    try {
      if (targetComment?.source === 'firestore') {
        // Delete from secondary Realtime DB
        await deleteCommentFirestore(deleteTarget, currentUser.id, postId);
        setNewComments(prev => prev.filter(c => c.id !== deleteTarget));
      } else {
        // Delete from primary Realtime DB (use existing db function)
        const { deleteComment } = await import('@/lib/db');
        await deleteComment(postId, deleteTarget, currentUser.id);
        setOldComments(prev => prev.filter(c => c.id !== deleteTarget));
      }
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete comment');
    } finally { 
      setDeleting(false); 
      setDeleteTarget(null); 
    }
  };

  return (
    <div data-testid={`comments-section-${postId}`} className="border-t border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] bg-[#F8FAFC]/30 dark:bg-[#0F172A]/30 discuss:bg-[#1a1a1a]/30">
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center gap-2 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#6275AF]" />
            <span className="text-[#6275AF] dark:text-[#94A3B8] text-xs">Loading comments...</span>
          </div>
        ) : allComments.length === 0 ? (
          <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[13px] text-center py-3">No comments yet. Be the first!</p>
        ) : (
          allComments.map((c) => {
            const isPostAuthor = c.author_id === postAuthorId;
            const isCurrentUser = c.author_id === currentUser?.id;
            const isClickable = !isCurrentUser;
            
            return (
              <div 
                key={c.id} 
                data-testid={`comment-${c.id}`} 
                className={`border-l-4 rounded-r-md pl-4 py-3 pr-3 shadow-sm dark:shadow-none discuss:shadow-none ${
                  isPostAuthor 
                    ? 'border-[#BC4800] discuss:border-[#EF4444] bg-[#BC4800]/5 dark:bg-[#BC4800]/10 discuss:bg-[#EF4444]/10' 
                    : 'border-[#2563EB] discuss:border-[#EF4444] bg-white dark:bg-[#1E293B] discuss:bg-[#262626]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <div className="flex items-center gap-1">
                      {isClickable ? (
                        <button
                          onClick={() => setUserInfoModal(c.author_id)}
                          data-testid={`comment-author-${c.id}`}
                          className="font-semibold text-[#1D7AFF] discuss:text-[#60A5FA] hover:underline text-[13px] cursor-pointer transition-colors"
                        >
                          {c.author_username}
                        </button>
                      ) : (
                        <span data-testid={`comment-author-${c.id}`} className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-[13px]">
                          {c.author_username}
                        </span>
                      )}
                      {c.author_verified && <VerifiedBadge size="xs" />}
                    </div>
                    {isPostAuthor && (
                      <span data-testid={`comment-author-badge-${c.id}`} className="bg-[#BC4800]/15 discuss:bg-[#EF4444]/15 text-[#BC4800] discuss:text-[#EF4444] text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                        Author
                      </span>
                    )}
                    <span className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-xs">{timeAgo(c.timestamp)}</span>
                  </div>
                  {currentUser?.id === c.author_id && (
                    <button data-testid={`comment-delete-btn-${c.id}`} onClick={() => setDeleteTarget(c.id)}
                      className="p-1 rounded hover:bg-[#EF4444]/10 text-[#6275AF] hover:text-[#EF4444] transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div data-testid={`comment-text-${c.id}`} className="text-[#0F172A] dark:text-[#E2E8F0] discuss:text-[#E5E7EB] text-[13px] md:text-[15px] mt-1 leading-relaxed">
                  <ExpandableText text={c.text} maxLines={4}>
                    <LinkifiedText text={c.text} className="whitespace-pre-wrap" />
                  </ExpandableText>
                </div>
              </div>
            );
          })
        )}
        
        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <Textarea 
              data-testid={`comment-input-${postId}`} 
              value={newComment} 
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment... (URLs will be clickable)"
              rows={2}
              className="w-full bg-white dark:bg-[#0F172A] discuss:bg-[#262626] border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] dark:placeholder:text-[#6275AF] discuss:placeholder:text-[#9CA3AF] focus:border-[#2563EB] discuss:focus:border-[#EF4444] focus:ring-2 focus:ring-[#2563EB]/20 discuss:focus:ring-[#EF4444]/20 rounded-xl text-[13px] resize-none pr-12"
            />
            <Button 
              type="submit" 
              data-testid={`comment-submit-${postId}`} 
              disabled={submitting || !newComment.trim() || isOverLimit}
              className="absolute right-2 bottom-2 bg-[#2563EB] discuss:bg-[#EF4444] text-white hover:bg-[#1D4ED8] discuss:hover:bg-[#DC2626] rounded-lg px-3 py-1.5 h-auto shadow-sm discuss:shadow-none"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-[#6275AF] dark:text-[#94A3B8] text-[10px]">
              URLs starting with http://, https://, or www. will be clickable
            </span>
            <span className={`text-[10px] ${isOverLimit ? 'text-[#EF4444] font-medium' : 'text-[#6275AF] dark:text-[#94A3B8]'}`}>
              {charCount}/{COMMENT_CHAR_LIMIT}
            </span>
          </div>
        </form>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="dark:bg-[#1E293B] dark:border-[#334155] discuss:bg-[#262626] discuss:border-[#333333]">
          <AlertDialogHeader><AlertDialogTitle className="dark:text-[#F1F5F9] discuss:text-[#F5F5F5]">Delete comment?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-[#94A3B8] discuss:text-[#9CA3AF]">This will permanently delete your comment.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="comment-delete-cancel" className="dark:bg-[#334155] dark:text-[#F1F5F9] dark:border-[#334155] dark:hover:bg-[#475569] discuss:bg-[#333333] discuss:text-[#F5F5F5] discuss:border-[#333333] discuss:hover:bg-[#404040]">Cancel</AlertDialogCancel>
            <AlertDialogAction data-testid="comment-delete-confirm" onClick={handleDelete} disabled={deleting} className="bg-[#EF4444] text-white hover:bg-[#DC2626]">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Info Modal */}
      {userInfoModal && (
        <CommentUserInfoModal
          open={!!userInfoModal}
          onClose={() => setUserInfoModal(null)}
          userId={userInfoModal}
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  );
}
