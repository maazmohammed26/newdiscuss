import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toggleVote, deletePost } from '@/lib/db';
import CommentsSection from '@/components/CommentsSection';
import ShareModal from '@/components/ShareModal';
import EditPostModal from '@/components/EditPostModal';
import LinkifiedText from '@/components/LinkifiedText';
import ExpandableText from '@/components/ExpandableText';
import ExternalLinkModal from '@/components/ExternalLinkModal';
import UserPreviewModal from '@/components/UserPreviewModal';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, Pencil, Trash2, Github, ExternalLink, Loader2, Hash } from 'lucide-react';
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
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [voting, setVoting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [externalLink, setExternalLink] = useState(null);
  const [previewUser, setPreviewUser] = useState(null);

  const isAuthor = currentUser?.id === post.author_id;
  const isProject = post.type === 'project';
  const hashtags = post.hashtags || [];
  const userVote = (post.votes || {})[currentUser?.id] || null;
  const upvoteCount = post.upvote_count || 0;
  const downvoteCount = post.downvote_count || 0;

  const handlePostClick = () => {
    navigate(`/post/${post.id}`);
  };

  const handleUsernameClick = (e) => {
    e.stopPropagation();
    if (post.author_id === currentUser?.id) {
      navigate('/profile');
    } else {
      setPreviewUser(post.author_id);
    }
  };

  const handleExternalLink = (url, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
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
    <div data-testid={`post-card-${post.id}`} className="bg-white dark:bg-[#1E293B] discuss:bg-[#141414] border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#00FF88] shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-200 overflow-hidden">
      {/* Content area */}
      <div className="p-4 md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span data-testid={`post-badge-${post.id}`}
              className={isProject
                ? 'bg-[#BC4800]/10 text-[#BC4800] discuss:bg-[#00FFFF]/10 discuss:text-[#00FFFF] border border-[#BC4800]/20 discuss:border-[#00FFFF] px-2.5 py-0.5 text-xs font-semibold shrink-0'
                : 'bg-[#2563EB]/10 text-[#2563EB] discuss:bg-[#00FF88]/10 discuss:text-[#00FF88] dark:text-[#60A5FA] border border-[#2563EB]/20 discuss:border-[#00FF88] px-2.5 py-0.5 text-xs font-semibold shrink-0'
              }>
              {isProject ? 'Project' : 'Discussion'}
            </span>
            <button
              data-testid={`post-author-${post.id}`}
              onClick={handleUsernameClick}
              className="font-semibold text-[#2563EB] discuss:text-[#00FF88] hover:underline text-[13px] md:text-[15px] cursor-pointer"
            >
              {post.author_username}
            </button>
            <span className="text-[#94A3B8] dark:text-[#64748B] discuss:text-[#00FF88]/50 text-xs shrink-0">{timeAgo(post.timestamp)}</span>
          </div>
          {isAuthor && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button data-testid={`post-edit-btn-${post.id}`} onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }} className="p-1.5 hover:bg-[#F5F5F7] dark:hover:bg-[#334155] discuss:hover:bg-[#00FF88]/10 text-[#94A3B8] discuss:text-[#00FF88] hover:text-[#0F172A] dark:hover:text-white transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button data-testid={`post-delete-btn-${post.id}`} onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="p-1.5 hover:bg-[#EF4444]/10 text-[#94A3B8] discuss:text-[#00FF88] hover:text-[#EF4444] transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Body - clickable to open post detail */}
        <div
          data-testid={`post-clickable-${post.id}`}
          onClick={handlePostClick}
          className="cursor-pointer"
        >
          {isProject && post.title && (
            <h3 data-testid={`post-title-${post.id}`} className="font-bold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#00FF88] text-[15px] md:text-[17px] mb-1.5 leading-snug hover:text-[#2563EB] dark:hover:text-[#60A5FA] discuss:hover:text-[#00DD77] transition-colors">{post.title}</h3>
          )}
          <div data-testid={`post-content-${post.id}`} className="text-[#0F172A] dark:text-[#E2E8F0] discuss:text-[#00FF88]/90 text-[13px] md:text-[15px] leading-relaxed">
            <ExpandableText text={post.content} maxLines={5}>
              <span className="whitespace-pre-wrap"><LinkifiedText text={post.content} /></span>
            </ExpandableText>
          </div>

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3" onClick={(e) => e.stopPropagation()}>
              {hashtags.map((tag) => (
                <button key={tag} data-testid={`post-hashtag-${tag}`} onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                  className="inline-flex items-center gap-0.5 bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#00FF88]/10 hover:bg-[#2563EB]/10 discuss:hover:bg-[#00FF88]/20 px-2.5 py-1 text-xs font-medium text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#00FF88] hover:text-[#2563EB] discuss:hover:text-[#00DD77] transition-all">
                  <Hash className="w-3 h-3" />{tag}
                </button>
              ))}
            </div>
          )}

          {isProject && (post.github_link || post.preview_link) && (
            <div className="flex flex-wrap gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
              {post.github_link && (
                <button onClick={(e) => handleExternalLink(post.github_link, e)} data-testid={`post-github-link-${post.id}`}
                  className="inline-flex items-center gap-1.5 bg-[#0F172A] dark:bg-[#F1F5F9] discuss:bg-[#00FF88] text-white dark:text-[#0F172A] discuss:text-[#0a0a0a] px-3 py-1.5 text-xs font-medium hover:bg-[#1E293B] dark:hover:bg-[#E2E8F0] discuss:hover:bg-[#00DD77] transition-colors">
                  <Github className="w-3.5 h-3.5" /> GitHub
                </button>
              )}
              {post.preview_link && (
                <button onClick={(e) => handleExternalLink(post.preview_link, e)} data-testid={`post-preview-link-${post.id}`}
                  className="inline-flex items-center gap-1.5 bg-[#2563EB] discuss:bg-[#00FFFF] text-white discuss:text-[#0a0a0a] px-3 py-1.5 text-xs font-medium hover:bg-[#1D4ED8] discuss:hover:bg-[#00DDDD] transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Live Preview
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-[#E2E8F0] dark:border-[#334155] discuss:border-[#00FF88]">
        <button 
          data-testid={`post-upvote-btn-${post.id}`} 
          onClick={() => handleVote('up')} 
          disabled={voting}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-all ${
            userVote === 'up' 
              ? 'bg-[#10B981]/10 text-[#10B981] discuss:bg-[#00FF88]/20 discuss:text-[#00FF88] border border-[#10B981]/30 discuss:border-[#00FF88]' 
              : 'text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#00FF88]/70 hover:bg-[#10B981]/5 hover:text-[#10B981] discuss:hover:bg-[#00FF88]/10 discuss:hover:text-[#00FF88] border border-transparent'
          }`}
        >
          <ThumbsUp className="w-4 h-4" fill={userVote === 'up' ? 'currentColor' : 'none'} />
          <span data-testid={`post-upvote-count-${post.id}`}>{upvoteCount}</span>
        </button>

        <button 
          data-testid={`post-downvote-btn-${post.id}`} 
          onClick={() => handleVote('down')} 
          disabled={voting}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-all ${
            userVote === 'down' 
              ? 'bg-[#EF4444]/10 text-[#EF4444] discuss:bg-[#FF0000]/20 discuss:text-[#FF0000] border border-[#EF4444]/30 discuss:border-[#FF0000]' 
              : 'text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#00FF88]/70 hover:bg-[#EF4444]/5 hover:text-[#EF4444] discuss:hover:bg-[#FF0000]/10 discuss:hover:text-[#FF0000] border border-transparent'
          }`}
        >
          <ThumbsDown className="w-4 h-4" fill={userVote === 'down' ? 'currentColor' : 'none'} />
          <span data-testid={`post-downvote-count-${post.id}`}>{downvoteCount}</span>
        </button>

        <div className="w-px h-4 bg-[#E2E8F0] dark:bg-[#334155] discuss:bg-[#00FF88]/30 mx-1" />

        <button data-testid={`post-comments-btn-${post.id}`} onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#00FF88]/70 hover:bg-[#F5F5F7] dark:hover:bg-[#334155] discuss:hover:bg-[#00FF88]/10 hover:text-[#0F172A] dark:hover:text-white discuss:hover:text-[#00FF88] transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span data-testid={`post-comment-count-${post.id}`}>{post.comment_count || 0}</span>
        </button>

        <button data-testid={`post-share-btn-${post.id}`} onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#00FF88]/70 hover:bg-[#F5F5F7] dark:hover:bg-[#334155] discuss:hover:bg-[#00FF88]/10 hover:text-[#0F172A] dark:hover:text-white discuss:hover:text-[#00FF88] transition-colors">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {showComments && <CommentsSection postId={post.id} postAuthorId={post.author_id} currentUser={currentUser} />}
      <ShareModal open={showShare} onClose={() => setShowShare(false)} post={post} />
      <EditPostModal open={showEditModal} onClose={() => setShowEditModal(false)} post={post} currentUser={currentUser} onUpdated={onUpdated} />

      {externalLink && (
        <ExternalLinkModal open={true} onClose={() => setExternalLink(null)} url={externalLink.url} isHttp={externalLink.isHttp} />
      )}

      {previewUser && (
        <UserPreviewModal open={true} onClose={() => setPreviewUser(null)} userId={previewUser} />
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="dark:bg-[#1E293B] dark:border-[#334155] discuss:bg-[#141414] discuss:border-[#00FF88]">
          <AlertDialogHeader><AlertDialogTitle className="dark:text-[#F1F5F9] discuss:text-[#00FF88]">Delete post?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-[#94A3B8] discuss:text-[#00FF88]/70">This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid={`post-delete-cancel-${post.id}`} className="dark:bg-[#334155] dark:text-[#F1F5F9] dark:border-[#334155] dark:hover:bg-[#475569] discuss:bg-[#1E1E1E] discuss:text-[#00FF88] discuss:border-[#00FF88]/30">Cancel</AlertDialogCancel>
            <AlertDialogAction data-testid={`post-delete-confirm-${post.id}`} onClick={handleDelete} disabled={deleting} className="bg-[#EF4444] text-white hover:bg-[#DC2626] discuss:bg-[#FF0000] discuss:hover:bg-[#DD0000]">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
