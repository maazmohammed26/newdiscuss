import { useState } from 'react';
import { toggleVote, updatePost, deletePost } from '@/lib/db';
import CommentsSection from '@/components/CommentsSection';
import ShareModal from '@/components/ShareModal';
import LinkifiedText from '@/components/LinkifiedText';
import ExternalLinkModal from '@/components/ExternalLinkModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, Pencil, Trash2, Github, ExternalLink, X, Check, Loader2, Hash } from 'lucide-react';
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
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PostCard({ post, currentUser, onDeleted, onUpdated, onVoteChanged, onTagClick }) {
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content);
  const [editGithub, setEditGithub] = useState(post.github_link || '');
  const [editPreview, setEditPreview] = useState(post.preview_link || '');
  const [saving, setSaving] = useState(false);
  const [voting, setVoting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [externalLink, setExternalLink] = useState(null);

  const isAuthor = currentUser?.id === post.author_id;
  const isProject = post.type === 'project';
  const hashtags = post.hashtags || [];
  const userVote = (post.votes || {})[currentUser?.id] || null;
  const upvoteCount = post.upvote_count || 0;
  const downvoteCount = post.downvote_count || 0;

  const handleExternalLink = (url, e) => {
    if (e) e.preventDefault();
    const isHttp = url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://');
    setExternalLink({ url, isHttp });
  };

  const handleVote = async (voteType) => {
    if (voting) return;
    setVoting(true);
    try {
      const data = await toggleVote(post.id, voteType, currentUser.id);
      onVoteChanged(post.id, data);
    } catch (err) {
      if (err.message?.includes('below 0')) {
        toast.error('Vote score cannot go below 0');
      }
    } finally { 
      setVoting(false); 
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const payload = { content: editContent };
      if (isProject) { payload.title = editTitle; payload.github_link = editGithub; payload.preview_link = editPreview; }
      const data = await updatePost(post.id, payload, currentUser.id);
      onUpdated(data); 
      setEditing(false);
      toast.success('Post updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update post');
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { 
      await deletePost(post.id, currentUser.id); 
      onDeleted(post.id); 
      toast.success('Post deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete post');
    } finally { 
      setDeleting(false); 
      setShowDeleteConfirm(false); 
    }
  };

  return (
    <div data-testid={`post-card-${post.id}`} className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-200 overflow-hidden">
      {/* Content area */}
      <div className="p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span data-testid={`post-badge-${post.id}`}
              className={isProject
                ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0'
                : 'bg-[#FF6B6B]/10 text-[#CC0000] dark:text-[#FF6B6B] border border-[#FF6B6B]/20 rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0'
              }>
              {isProject ? 'Project' : 'Discussion'}
            </span>
            <span data-testid={`post-author-${post.id}`} className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] text-[13px] md:text-[15px]">{post.author_username}</span>
            <span className="text-[#94A3B8] dark:text-[#64748B] text-xs shrink-0">{timeAgo(post.timestamp)}</span>
          </div>
          {isAuthor && !editing && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button data-testid={`post-edit-btn-${post.id}`} onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-[#F0F4FA] dark:hover:bg-[#334155] text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button data-testid={`post-delete-btn-${post.id}`} onClick={() => setShowDeleteConfirm(true)} className="p-1.5 rounded-lg hover:bg-[#EF4444]/10 text-[#94A3B8] hover:text-[#EF4444] transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        {editing ? (
          <div className="space-y-3">
            {isProject && <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Project title" className="bg-[#F0F4FA] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] dark:text-[#F1F5F9] focus:bg-white dark:focus:bg-[#1E293B] focus:border-[#3B82F6] rounded-xl" />}
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="Content" rows={3} className="bg-[#F0F4FA] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] dark:text-[#F1F5F9] focus:bg-white dark:focus:bg-[#1E293B] focus:border-[#3B82F6] rounded-xl resize-none" />
            {isProject && (
              <>
                <Input value={editGithub} onChange={(e) => setEditGithub(e.target.value)} placeholder="GitHub link" className="bg-[#F0F4FA] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] dark:text-[#F1F5F9] rounded-xl" />
                <Input value={editPreview} onChange={(e) => setEditPreview(e.target.value)} placeholder="Live preview link" className="bg-[#F0F4FA] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] dark:text-[#F1F5F9] rounded-xl" />
              </>
            )}
            <div className="flex gap-2">
              <Button data-testid={`post-save-edit-${post.id}`} onClick={handleSaveEdit} disabled={saving} className="bg-[#CC0000] text-white hover:bg-[#A30000] rounded-full px-4 py-1.5 text-[13px] font-medium">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1" /> Save</>}
              </Button>
              <Button onClick={() => setEditing(false)} variant="ghost" className="hover:bg-[#F0F4FA] dark:hover:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] rounded-full px-4 py-1.5 text-[13px]">
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {isProject && post.title && (
              <h3 data-testid={`post-title-${post.id}`} className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-[15px] md:text-[17px] mb-1.5 leading-snug">{post.title}</h3>
            )}
            <div data-testid={`post-content-${post.id}`} className="text-[#0F172A] dark:text-[#E2E8F0] text-[13px] md:text-[15px] leading-relaxed whitespace-pre-wrap">
              <LinkifiedText text={post.content} />
            </div>

            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {hashtags.map((tag) => (
                  <button key={tag} data-testid={`post-hashtag-${tag}`} onClick={() => onTagClick?.(tag)}
                    className="inline-flex items-center gap-0.5 bg-[#F0F4FA] dark:bg-[#0F172A] hover:bg-[#3B82F6]/10 rounded-full px-2.5 py-1 text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#3B82F6] transition-all">
                    <Hash className="w-3 h-3" />{tag}
                  </button>
                ))}
              </div>
            )}

            {isProject && (post.github_link || post.preview_link) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.github_link && (
                  <button onClick={(e) => handleExternalLink(post.github_link, e)} data-testid={`post-github-link-${post.id}`}
                    className="inline-flex items-center gap-1.5 bg-[#0F172A] dark:bg-[#F1F5F9] text-white dark:text-[#0F172A] rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-[#1E293B] dark:hover:bg-[#E2E8F0] transition-colors">
                    <Github className="w-3.5 h-3.5" /> GitHub
                  </button>
                )}
                {post.preview_link && (
                  <button onClick={(e) => handleExternalLink(post.preview_link, e)} data-testid={`post-preview-link-${post.id}`}
                    className="inline-flex items-center gap-1.5 bg-[#3B82F6] text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-[#2563EB] transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> Live Preview
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions bar */}
      {!editing && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-[#E2E8F0] dark:border-[#334155]">
          <button 
            data-testid={`post-upvote-btn-${post.id}`} 
            onClick={() => handleVote('up')} 
            disabled={voting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              userVote === 'up' 
                ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' 
                : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#10B981]/5 hover:text-[#10B981] border border-transparent'
            }`}
          >
            <ThumbsUp className="w-4 h-4" fill={userVote === 'up' ? 'currentColor' : 'none'} />
            <span data-testid={`post-upvote-count-${post.id}`}>{upvoteCount}</span>
          </button>

          <button 
            data-testid={`post-downvote-btn-${post.id}`} 
            onClick={() => handleVote('down')} 
            disabled={voting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              userVote === 'down' 
                ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30' 
                : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EF4444]/5 hover:text-[#EF4444] border border-transparent'
            }`}
          >
            <ThumbsDown className="w-4 h-4" fill={userVote === 'down' ? 'currentColor' : 'none'} />
            <span data-testid={`post-downvote-count-${post.id}`}>{downvoteCount}</span>
          </button>

          <div className="w-px h-4 bg-[#E2E8F0] dark:bg-[#334155] mx-1" />

          <button data-testid={`post-comments-btn-${post.id}`} onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F0F4FA] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span data-testid={`post-comment-count-${post.id}`}>{post.comment_count || 0}</span>
          </button>

          <button data-testid={`post-share-btn-${post.id}`} onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F0F4FA] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-white transition-colors">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      )}

      {showComments && <CommentsSection postId={post.id} currentUser={currentUser} />}
      <ShareModal open={showShare} onClose={() => setShowShare(false)} post={post} />

      {externalLink && (
        <ExternalLinkModal
          open={true}
          onClose={() => setExternalLink(null)}
          url={externalLink.url}
          isHttp={externalLink.isHttp}
        />
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="dark:bg-[#1E293B] dark:border-[#334155]">
          <AlertDialogHeader><AlertDialogTitle className="dark:text-[#F1F5F9]">Delete post?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-[#94A3B8]">This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid={`post-delete-cancel-${post.id}`} className="dark:bg-[#334155] dark:text-[#F1F5F9] dark:border-[#334155] dark:hover:bg-[#475569]">Cancel</AlertDialogCancel>
            <AlertDialogAction data-testid={`post-delete-confirm-${post.id}`} onClick={handleDelete} disabled={deleting} className="bg-[#EF4444] text-white hover:bg-[#DC2626]">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
