import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getPosts } from '@/lib/db';
import { 
  getUserProfile, 
  updateFullName, 
  deleteFullName, 
  updateBio, 
  deleteBio,
  addSocialLink,
  editSocialLink,
  deleteSocialLink,
  BIO_CHAR_LIMIT 
} from '@/lib/userProfileDb';
import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import ThemeSelector from '@/components/ThemeSelector';
import VerifiedBadge from '@/components/VerifiedBadge';
import VerificationRequestModal from '@/components/VerificationRequestModal';
import UserAdminMessage from '@/components/UserAdminMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, LogOut, Loader2, AlertTriangle, ChevronDown, ChevronUp, 
  Calendar, Filter, ShieldCheck, User, Pencil, Trash2, Plus, Link2, X, Check, ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Profile data from secondary Firebase
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Edit states
  const [editingFullName, setEditingFullName] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [savingFullName, setSavingFullName] = useState(false);
  const [deleteFullNameConfirm, setDeleteFullNameConfirm] = useState(false);

  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [deleteBioConfirm, setDeleteBioConfirm] = useState(false);

  const [addingLink, setAddingLink] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState(null);
  const [editLinkName, setEditLinkName] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [deleteLinkConfirm, setDeleteLinkConfirm] = useState(null);

  // Fetch user posts
  useEffect(() => {
    if (user?.id) {
      setLoadingPosts(true);
      getPosts()
        .then(posts => setUserPosts(posts.filter(p => p.author_id === user.id)))
        .catch(() => {})
        .finally(() => setLoadingPosts(false));
    }
  }, [user]);

  // Fetch profile data from secondary Firebase
  useEffect(() => {
    if (user?.id) {
      setLoadingProfile(true);
      getUserProfile(user.id)
        .then(data => {
          setProfileData(data);
          setLoadingProfile(false);
        })
        .catch(() => setLoadingProfile(false));
    }
  }, [user?.id]);

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

  // Full Name handlers
  const handleSaveFullName = async () => {
    if (!fullNameInput.trim()) return;
    setSavingFullName(true);
    try {
      await updateFullName(user.id, fullNameInput);
      setProfileData(prev => ({ ...prev, fullName: fullNameInput.trim() }));
      setEditingFullName(false);
      toast.success('Full name updated');
    } catch (err) {
      toast.error('Failed to update full name');
    } finally {
      setSavingFullName(false);
    }
  };

  const handleDeleteFullName = async () => {
    setSavingFullName(true);
    try {
      await deleteFullName(user.id);
      setProfileData(prev => ({ ...prev, fullName: undefined }));
      setDeleteFullNameConfirm(false);
      toast.success('Full name removed');
    } catch (err) {
      toast.error('Failed to remove full name');
    } finally {
      setSavingFullName(false);
    }
  };

  // Bio handlers
  const handleSaveBio = async () => {
    if (!bioInput.trim()) return;
    setSavingBio(true);
    try {
      await updateBio(user.id, bioInput);
      setProfileData(prev => ({ ...prev, bio: bioInput.trim().slice(0, BIO_CHAR_LIMIT) }));
      setEditingBio(false);
      toast.success('Bio updated');
    } catch (err) {
      toast.error('Failed to update bio');
    } finally {
      setSavingBio(false);
    }
  };

  const handleDeleteBio = async () => {
    setSavingBio(true);
    try {
      await deleteBio(user.id);
      setProfileData(prev => ({ ...prev, bio: undefined }));
      setDeleteBioConfirm(false);
      toast.success('Bio removed');
    } catch (err) {
      toast.error('Failed to remove bio');
    } finally {
      setSavingBio(false);
    }
  };

  // Social Link handlers
  const handleAddLink = async () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;
    setSavingLink(true);
    try {
      await addSocialLink(user.id, { name: newLinkName, url: newLinkUrl });
      const currentLinks = profileData?.socialLinks || [];
      setProfileData(prev => ({ 
        ...prev, 
        socialLinks: [...currentLinks, { name: newLinkName.trim(), url: newLinkUrl.trim() }] 
      }));
      setAddingLink(false);
      setNewLinkName('');
      setNewLinkUrl('');
      toast.success('Link added');
    } catch (err) {
      toast.error('Failed to add link');
    } finally {
      setSavingLink(false);
    }
  };

  const handleEditLink = async (index) => {
    if (!editLinkName.trim() || !editLinkUrl.trim()) return;
    setSavingLink(true);
    try {
      await editSocialLink(user.id, index, { name: editLinkName, url: editLinkUrl });
      const updatedLinks = [...(profileData?.socialLinks || [])];
      updatedLinks[index] = { name: editLinkName.trim(), url: editLinkUrl.trim() };
      setProfileData(prev => ({ ...prev, socialLinks: updatedLinks }));
      setEditingLinkIndex(null);
      toast.success('Link updated');
    } catch (err) {
      toast.error('Failed to update link');
    } finally {
      setSavingLink(false);
    }
  };

  const handleDeleteLink = async (index) => {
    setSavingLink(true);
    try {
      await deleteSocialLink(user.id, index);
      const updatedLinks = (profileData?.socialLinks || []).filter((_, i) => i !== index);
      setProfileData(prev => ({ ...prev, socialLinks: updatedLinks }));
      setDeleteLinkConfirm(null);
      toast.success('Link removed');
    } catch (err) {
      toast.error('Failed to remove link');
    } finally {
      setSavingLink(false);
    }
  };

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#121212]">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-none discuss:shadow-none border discuss:border discuss:border-[#333333] p-8 text-center">
          {user?.photo_url ? (
            <img src={user.photo_url} alt={user.username} className="w-24 h-24 mx-auto mb-5 shadow-lg discuss:shadow-none object-cover discuss:border discuss:border-[#333333]" />
          ) : (
            <div className="w-24 h-24 bg-[#2563EB] discuss:bg-[#EF4444] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#2563EB]/20 discuss:shadow-none discuss:border discuss:border-[#333333]">
              <span className="text-white discuss:text-white text-2xl font-bold">{initials}</span>
            </div>
          )}

          <h1 data-testid="profile-username" className="font-heading text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] flex items-center justify-center gap-2">
            {user?.username}
            {user?.verified && <VerifiedBadge size="md" />}
          </h1>
          <p data-testid="profile-email" className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[13px] mt-0.5">{user?.email}</p>

          <div className="inline-flex items-center gap-2 bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#1a1a1a] discuss:border discuss:border-[#333333] px-4 py-2 mt-4">
            <FileText className="w-4 h-4 text-[#1D7AFF] discuss:text-[#EF4444]" />
            <span data-testid="profile-post-count" className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-[13px] font-semibold">
              {loadingPosts ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : `${userPosts.length} Total Posts`}
            </span>
          </div>

          {!user?.verified && (
            <Button
              onClick={() => setShowVerificationModal(true)}
              variant="outline"
              className="mt-4 border-[#E63946] text-[#E63946] hover:bg-[#E63946]/10 dark:border-[#E63946] dark:hover:bg-[#E63946]/10 discuss:border-[#EF4444] discuss:text-[#EF4444] discuss:hover:bg-[#EF4444]/10"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Request Verification
            </Button>
          )}

          {/* User Admin Message - Above Theme Selector */}
          {user?.admin_message && (
            <div className="mt-6">
              <UserAdminMessage message={user.admin_message} />
            </div>
          )}

          {/* ==================== NEW PROFILE FIELDS ==================== */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] text-left space-y-5">
            
            {/* Loading indicator for profile data */}
            {loadingProfile && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#6275AF]" />
                <span className="text-[#6275AF] dark:text-[#94A3B8] text-xs">Loading profile...</span>
              </div>
            )}

            {/* Full Name Section */}
            <div className="bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#262626] p-4 rounded-lg discuss:border discuss:border-[#333333]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-[#2563EB] discuss:text-[#EF4444]" />
                  Full Name
                  <span className="text-[#6275AF] dark:text-[#94A3B8] text-xs font-normal">(optional)</span>
                </label>
                {!editingFullName && profileData?.fullName && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingFullName(true); setFullNameInput(profileData.fullName || ''); }}
                      className="p-1.5 rounded hover:bg-[#2563EB]/10 discuss:hover:bg-[#EF4444]/10 text-[#6275AF] hover:text-[#2563EB] discuss:hover:text-[#EF4444] transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteFullNameConfirm(true)}
                      className="p-1.5 rounded hover:bg-[#EF4444]/10 text-[#6275AF] hover:text-[#EF4444] transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              
              {editingFullName ? (
                <div className="flex gap-2">
                  <Input 
                    value={fullNameInput} 
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="Enter your full name"
                    className="flex-1 bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-sm"
                  />
                  <Button onClick={handleSaveFullName} disabled={savingFullName || !fullNameInput.trim()} size="sm"
                    className="bg-[#2563EB] discuss:bg-[#EF4444] hover:bg-[#1D4ED8] discuss:hover:bg-[#DC2626] text-white">
                    {savingFullName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button onClick={() => setEditingFullName(false)} size="sm" variant="outline"
                    className="border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] text-[#6275AF]">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : profileData?.fullName ? (
                <p className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-sm">{profileData.fullName}</p>
              ) : (
                <button onClick={() => { setEditingFullName(true); setFullNameInput(''); }}
                  className="text-[#2563EB] discuss:text-[#EF4444] hover:underline text-sm flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add full name
                </button>
              )}
            </div>

            {/* Bio Section */}
            <div className="bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#262626] p-4 rounded-lg discuss:border discuss:border-[#333333]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2563EB] discuss:text-[#EF4444]" />
                  Bio
                  <span className="text-[#6275AF] dark:text-[#94A3B8] text-xs font-normal">(optional, max {BIO_CHAR_LIMIT} chars)</span>
                </label>
                {!editingBio && profileData?.bio && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingBio(true); setBioInput(profileData.bio || ''); }}
                      className="p-1.5 rounded hover:bg-[#2563EB]/10 discuss:hover:bg-[#EF4444]/10 text-[#6275AF] hover:text-[#2563EB] discuss:hover:text-[#EF4444] transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteBioConfirm(true)}
                      className="p-1.5 rounded hover:bg-[#EF4444]/10 text-[#6275AF] hover:text-[#EF4444] transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              
              {editingBio ? (
                <div className="space-y-2">
                  <Textarea 
                    value={bioInput} 
                    onChange={(e) => setBioInput(e.target.value.slice(0, BIO_CHAR_LIMIT))}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-sm resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${bioInput.length >= BIO_CHAR_LIMIT ? 'text-[#EF4444]' : 'text-[#6275AF] dark:text-[#94A3B8]'}`}>
                      {bioInput.length}/{BIO_CHAR_LIMIT}
                    </span>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveBio} disabled={savingBio || !bioInput.trim()} size="sm"
                        className="bg-[#2563EB] discuss:bg-[#EF4444] hover:bg-[#1D4ED8] discuss:hover:bg-[#DC2626] text-white">
                        {savingBio ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                      </Button>
                      <Button onClick={() => setEditingBio(false)} size="sm" variant="outline"
                        className="border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] text-[#6275AF]">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : profileData?.bio ? (
                <p className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-sm whitespace-pre-wrap">{profileData.bio}</p>
              ) : (
                <button onClick={() => { setEditingBio(true); setBioInput(''); }}
                  className="text-[#2563EB] discuss:text-[#EF4444] hover:underline text-sm flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add bio
                </button>
              )}
            </div>

            {/* Social Links Section */}
            <div className="bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#262626] p-4 rounded-lg discuss:border discuss:border-[#333333]">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-sm font-medium flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#2563EB] discuss:text-[#EF4444]" />
                  Social Links
                  <span className="text-[#6275AF] dark:text-[#94A3B8] text-xs font-normal">(optional)</span>
                </label>
              </div>

              {/* Existing Links */}
              {profileData?.socialLinks?.length > 0 && (
                <div className="space-y-2 mb-3">
                  {profileData.socialLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] p-2 rounded border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333]">
                      {editingLinkIndex === index ? (
                        <>
                          <Input 
                            value={editLinkName} 
                            onChange={(e) => setEditLinkName(e.target.value)}
                            placeholder="Link name"
                            className="flex-1 h-8 text-xs bg-transparent border-0 p-0"
                          />
                          <Input 
                            value={editLinkUrl} 
                            onChange={(e) => setEditLinkUrl(e.target.value)}
                            placeholder="URL"
                            className="flex-1 h-8 text-xs bg-transparent border-0 p-0"
                          />
                          <Button onClick={() => handleEditLink(index)} disabled={savingLink} size="sm" className="h-7 px-2 bg-[#2563EB] discuss:bg-[#EF4444]">
                            {savingLink ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          </Button>
                          <Button onClick={() => setEditingLinkIndex(null)} size="sm" variant="ghost" className="h-7 px-2">
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <a href={link.url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 text-[#2563EB] discuss:text-[#60A5FA] hover:underline text-sm flex items-center gap-1">
                            {link.name}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button onClick={() => { setEditingLinkIndex(index); setEditLinkName(link.name); setEditLinkUrl(link.url); }}
                            className="p-1 rounded hover:bg-[#2563EB]/10 discuss:hover:bg-[#EF4444]/10 text-[#6275AF] hover:text-[#2563EB] discuss:hover:text-[#EF4444] transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => setDeleteLinkConfirm(index)}
                            className="p-1 rounded hover:bg-[#EF4444]/10 text-[#6275AF] hover:text-[#EF4444] transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Link */}
              {addingLink ? (
                <div className="space-y-2 bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] p-3 rounded border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333]">
                  <Input 
                    value={newLinkName} 
                    onChange={(e) => setNewLinkName(e.target.value)}
                    placeholder="Link name (e.g., LinkedIn, GitHub)"
                    className="w-full text-sm bg-transparent"
                  />
                  <Input 
                    value={newLinkUrl} 
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="URL (e.g., https://github.com/username)"
                    className="w-full text-sm bg-transparent"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button onClick={handleAddLink} disabled={savingLink || !newLinkName.trim() || !newLinkUrl.trim()} size="sm"
                      className="bg-[#2563EB] discuss:bg-[#EF4444] hover:bg-[#1D4ED8] discuss:hover:bg-[#DC2626] text-white">
                      {savingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Link'}
                    </Button>
                    <Button onClick={() => { setAddingLink(false); setNewLinkName(''); setNewLinkUrl(''); }} size="sm" variant="outline"
                      className="border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] text-[#6275AF]">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingLink(true)}
                  className="text-[#2563EB] discuss:text-[#EF4444] hover:underline text-sm flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add social link
                </button>
              )}
            </div>
          </div>
          {/* ==================== END NEW PROFILE FIELDS ==================== */}

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

      <VerificationRequestModal 
        open={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)}
        user={user}
      />

      {/* Delete Full Name Confirmation */}
      <AlertDialog open={deleteFullNameConfirm} onOpenChange={setDeleteFullNameConfirm}>
        <AlertDialogContent className="dark:bg-[#1E293B] dark:border-[#334155] discuss:bg-[#262626] discuss:border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-[#F1F5F9] discuss:text-[#F5F5F5]">Remove full name?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-[#94A3B8] discuss:text-[#9CA3AF]">
              This will remove your full name from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-[#334155] dark:text-[#F1F5F9] dark:border-[#334155] discuss:bg-[#333333] discuss:text-[#F5F5F5] discuss:border-[#333333]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFullName} disabled={savingFullName} className="bg-[#EF4444] text-white hover:bg-[#DC2626]">
              {savingFullName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Bio Confirmation */}
      <AlertDialog open={deleteBioConfirm} onOpenChange={setDeleteBioConfirm}>
        <AlertDialogContent className="dark:bg-[#1E293B] dark:border-[#334155] discuss:bg-[#262626] discuss:border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-[#F1F5F9] discuss:text-[#F5F5F5]">Remove bio?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-[#94A3B8] discuss:text-[#9CA3AF]">
              This will remove your bio from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-[#334155] dark:text-[#F1F5F9] dark:border-[#334155] discuss:bg-[#333333] discuss:text-[#F5F5F5] discuss:border-[#333333]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBio} disabled={savingBio} className="bg-[#EF4444] text-white hover:bg-[#DC2626]">
              {savingBio ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Link Confirmation */}
      <AlertDialog open={deleteLinkConfirm !== null} onOpenChange={(v) => { if (!v) setDeleteLinkConfirm(null); }}>
        <AlertDialogContent className="dark:bg-[#1E293B] dark:border-[#334155] discuss:bg-[#262626] discuss:border-[#333333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-[#F1F5F9] discuss:text-[#F5F5F5]">Remove link?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-[#94A3B8] discuss:text-[#9CA3AF]">
              This will remove this social link from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-[#334155] dark:text-[#F1F5F9] dark:border-[#334155] discuss:bg-[#333333] discuss:text-[#F5F5F5] discuss:border-[#333333]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteLink(deleteLinkConfirm)} disabled={savingLink} className="bg-[#EF4444] text-white hover:bg-[#DC2626]">
              {savingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
