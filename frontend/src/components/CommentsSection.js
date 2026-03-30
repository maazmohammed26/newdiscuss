import { useState, useEffect } from 'react';
import { getComments, createComment, deleteComment, subscribeToCommentsRealtime } from '@/lib/db';
import ExpandableText from '@/components/ExpandableText';
import VerifiedBadge from '@/components/VerifiedBadge';
import CommentUserInfoModal from '@/components/CommentUserInfoModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [userInfoModal, setUserInfoModal] = useState(null); // Store userId for modal

  useEffect(() => {
    getComments(postId).then(data => {
      setComments(data);
      setLoading(false);
    }).catch(() => setLoading(false));

    const unsubscribe = subscribeToCommentsRealtime(postId, (updatedComments) => {
      setComments(updatedComments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await createComment(postId, newComment.trim(), currentUser);
      setNewComment('');
    } catch (err) {
      toast.error(err.message || 'Failed to add comment');
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteComment(postId, deleteTarget, currentUser.id);
      setComments((prev) => prev.filter((c) => c.id !== deleteTarget));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete comment');
    } finally { 
      setDeleting(false); 
      setDeleteTarget(null); 
    }
  };

  return (
    <div data-testid={`comments-section-${postId}`} className="border-t border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC]/30 dark:bg-[#0F172A]/30">
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-[#6275AF]" /></div>
        ) : comments.length === 0 ? (
          <p className="text-[#6275AF] dark:text-[#94A3B8] text-[13px] text-center py-3">No comments yet. Be the first!</p>
        ) : (
          comments.map((c) => {
            const isPostAuthor = c.author_id === postAuthorId;
            const isClickable = !isPostAuthor; // Only clickable if NOT the post author
            
            return (
              <div 
                key={c.id} 
                data-testid={`comment-${c.id}`} 
                className={`border-l-4 rounded-r-md pl-4 py-3 pr-3 shadow-sm dark:shadow-none ${
                  isPostAuthor 
                    ? 'border-[#BC4800] bg-[#BC4800]/5 dark:bg-[#BC4800]/10' 
                    : 'border-[#2563EB] bg-white dark:bg-[#1E293B]'
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
                      <span data-testid={`comment-author-badge-${c.id}`} className="bg-[#BC4800]/15 text-[#BC4800] text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                        Author
                      </span>
                    )}
                    <span className="text-[#6275AF] dark:text-[#94A3B8] text-xs">{timeAgo(c.timestamp)}</span>
                  </div>
                  {currentUser?.id === c.author_id && (
                    <button data-testid={`comment-delete-btn-${c.id}`} onClick={() => setDeleteTarget(c.id)}
                      className="p-1 rounded hover:bg-[#EF4444]/10 text-[#6275AF] hover:text-[#EF4444] transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div data-testid={`comment-text-${c.id}`} className="text-[#0F172A] dark:text-[#E2E8F0] text-[13px] md:text-[15px] mt-1 leading-relaxed">
                  <ExpandableText text={c.text} maxLines={4}>
                    <span className="whitespace-pre-wrap">{c.text}</span>
                  </ExpandableText>
                </div>
              </div>
            );
          })
        )}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
          <Input data-testid={`comment-input-${postId}`} value={newComment} onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..." className="flex-1 bg-white dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] dark:text-[#F1F5F9] dark:placeholder:text-[#6275AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 rounded-xl text-[13px]" />
          <Button type="submit" data-testid={`comment-submit-${postId}`} disabled={submitting || !newComment.trim()}
            className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-xl px-3 shadow-sm shrink-0">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="dark:bg-[#1E293B] dark:border-[#334155]">
          <AlertDialogHeader><AlertDialogTitle className="dark:text-[#F1F5F9]">Delete comment?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-[#94A3B8]">This will permanently delete your comment.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="comment-delete-cancel" className="dark:bg-[#334155] dark:text-[#F1F5F9] dark:border-[#334155] dark:hover:bg-[#475569]">Cancel</AlertDialogCancel>
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
        />
      )}
    </div>
  );
}
