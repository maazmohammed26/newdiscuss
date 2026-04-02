import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import LoadingScreen from '@/components/LoadingScreen';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import AdminMessageBanner from '@/components/AdminMessageBanner';
import DiscussLogo from '@/components/DiscussLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  ArrowRight, MessageSquare, FolderGit2, Zap, Linkedin, Users, Shield, Code, Loader2,
  Lock, Search, Globe, UserCheck, Briefcase, MessageCircle, Clock, Sparkles
} from 'lucide-react';

const features = [
  { icon: MessageSquare, title: 'Thoughtful Discussions', desc: 'A space for meaningful conversations. Share ideas, get feedback, and engage with a community that values depth over noise.' },
  { icon: FolderGit2, title: 'Project Showcase', desc: 'Share your work with GitHub links and live previews. Get real feedback from developers who understand your craft.' },
  { icon: Lock, title: 'Private & Secure Chats', desc: 'End-to-end encrypted personal messaging. Chat only with approved friends. No ads, no tracking.', isNew: true },
  { icon: Zap, title: 'Real-time Everything', desc: 'Votes, comments, posts, and messages update instantly. Stay connected without hitting refresh.' },
  { icon: Code, title: 'Developer Profiles', desc: 'Showcase your skills, projects, and contributions. Let your work speak for itself.' },
  { icon: UserCheck, title: 'Recruiter Discovery', desc: 'Companies can explore talent through skills and projects. Privacy-first approach - you control who connects.' },
];

const uniqueFeatures = [
  { icon: Shield, title: 'No Noise', desc: 'Zero ads, zero spam. Only quality content.' },
  { icon: Clock, title: 'Auto-Delete Chats', desc: 'Optional 24h auto-delete for privacy.' },
  { icon: Search, title: 'Smart Discovery', desc: 'Find people by skills and interests.' },
  { icon: Globe, title: 'Open Community', desc: 'For developers, students, and learners.' },
];

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to feed if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/feed', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] discuss:text-[#EF4444] mx-auto mb-3" />
          <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] discuss:text-[#EF4444] mx-auto mb-3" />
          <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-sm">Redirecting to feed...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen message="Preparing your experience..." />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#121212]">
      <Header />
      <AdminMessageBanner />
      <PWAInstallBanner />

      {/* Hero */}
      <section className="pt-16 pb-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#2563EB]/10 discuss:bg-[#EF4444]/10 text-[#2563EB] discuss:text-[#EF4444] text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            A Developer-First Platform
          </div>
          <h1 data-testid="hero-title" className="font-heading text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] leading-[1.1] tracking-tight">
            Where deep thought<br />meets <em className="text-[#BC4800] discuss:text-[#EF4444] not-italic font-bold" style={{fontStyle:'italic'}}>beautiful</em> design.
          </h1>
          <p className="mt-5 text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[14px] md:text-[16px] leading-relaxed max-w-xl mx-auto">
            Discuss is a curated editorial platform for developers to share ideas, projects, and meaningful conversations — without noise, ads, or distractions.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Link to="/register" className="flex-1">
              <Button data-testid="hero-register-btn" data-primary="true" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] discuss:bg-[#EF4444] discuss:hover:bg-[#DC2626] text-white font-semibold rounded-full px-8 py-3 text-base shadow-lg shadow-[#2563EB]/20 discuss:shadow-none transition-all">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login" className="flex-1">
              <Button data-testid="hero-login-btn" variant="outline" className="w-full bg-[#E8EBF0] dark:bg-[#1E293B] discuss:bg-[#262626] hover:bg-[#D9DDE4] dark:hover:bg-[#334155] discuss:hover:bg-[#333333] text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] font-medium rounded-full px-8 py-3 text-base border-0 transition-all">
                Explore Feed
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Purpose */}
      <section className="py-12 px-4 md:px-8 bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] border-y border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] mb-4">
            Built for developers. Designed for focus.
          </h2>
          <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[14px] md:text-[15px] leading-relaxed max-w-2xl mx-auto">
            Discuss provides a clean, focused space for real conversations and feedback. Share projects, connect with peers, 
            engage in thoughtful discussions, and discover talent — all in a platform centered around developers and learning.
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] mb-3">
              Everything you need
            </h2>
            <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[14px]">
              A complete platform for developers to share, connect, and grow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} data-testid={`feature-card-${i}`} className={`relative bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] rounded-2xl p-6 hover:shadow-lg dark:hover:shadow-none transition-all ${
                f.isNew ? 'ring-2 ring-[#10B981] ring-offset-2 ring-offset-[#F5F5F7] dark:ring-offset-[#0F172A] discuss:ring-offset-[#121212]' : ''
              }`}>
                {f.isNew && (
                  <span className="absolute -top-2.5 left-6 bg-[#10B981] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    New
                  </span>
                )}
                <div className={`w-11 h-11 bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#262626] rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.isNew ? 'text-[#10B981]' : 'text-[#2563EB] discuss:text-[#EF4444]'}`} />
                </div>
                <h3 className={`text-[16px] font-bold mb-2 ${f.isNew ? 'text-[#10B981]' : 'text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5]'}`}>{f.title}</h3>
                <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[13px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unique Value */}
      <section className="py-12 px-4 md:px-8 bg-gradient-to-b from-white to-[#F5F5F7] dark:from-[#1E293B] dark:to-[#0F172A] discuss:from-[#1a1a1a] discuss:to-[#121212]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {uniqueFeatures.map((f, i) => (
              <div key={i} className="text-center p-4">
                <div className="w-10 h-10 bg-[#2563EB]/10 discuss:bg-[#EF4444]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <f.icon className="w-5 h-5 text-[#2563EB] discuss:text-[#EF4444]" />
                </div>
                <h4 className="text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] font-semibold text-[13px] mb-1">{f.title}</h4>
                <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[11px]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Users */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] mb-3">
              Built for everyone who builds
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] text-center">
              <Code className="w-8 h-8 text-[#2563EB] discuss:text-[#EF4444] mx-auto mb-3" />
              <h4 className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-[14px] mb-1">Developers</h4>
              <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[12px]">Share projects and ideas</p>
            </div>
            <div className="bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] text-center">
              <Users className="w-8 h-8 text-[#10B981] mx-auto mb-3" />
              <h4 className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-[14px] mb-1">Students</h4>
              <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[12px]">Learn and explore</p>
            </div>
            <div className="bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] text-center">
              <Briefcase className="w-8 h-8 text-[#F59E0B] mx-auto mb-3" />
              <h4 className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-[14px] mb-1">Recruiters</h4>
              <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[12px]">Discover talent</p>
            </div>
            <div className="bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] text-center">
              <MessageCircle className="w-8 h-8 text-[#8B5CF6] mx-auto mb-3" />
              <h4 className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] text-[14px] mb-1">Learners</h4>
              <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[12px]">Engage in discussions</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 md:px-8 bg-white dark:bg-[#1E293B] discuss:bg-[#1a1a1a] border-t border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333]">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex justify-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-[#2563EB]/10 discuss:bg-[#EF4444]/10 flex items-center justify-center"><Users className="w-4 h-4 text-[#2563EB] discuss:text-[#EF4444]" /></div>
            <div className="w-9 h-9 rounded-full bg-[#BC4800]/10 discuss:bg-[#EF4444]/10 flex items-center justify-center"><Shield className="w-4 h-4 text-[#BC4800] discuss:text-[#EF4444]" /></div>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#F5F5F5] mb-3">Ready to join the conversation?</h2>
          <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[14px] mb-6">Join a community of developers sharing knowledge, projects, and ideas.</p>
          <Link to="/register">
            <Button data-testid="cta-register-btn" data-primary="true" className="bg-[#2563EB] hover:bg-[#1D4ED8] discuss:bg-[#EF4444] discuss:hover:bg-[#DC2626] text-white font-semibold rounded-full px-8 py-3 shadow-lg shadow-[#2563EB]/20 discuss:shadow-none">
              Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-[#E2E8F0] dark:border-[#1E293B] discuss:border-[#333333] bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#121212]">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <DiscussLogo size="md" />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-xs">&copy; {new Date().getFullYear()} Discuss. Built for developers.</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#334155] discuss:border-[#333333] w-full">
            <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#9CA3AF] text-[12px]">
              Developed by{' '}
              <span className="text-[#BC4800] discuss:text-[#EF4444] font-semibold">&lt;Mohammed Maaz A&gt;</span>
            </p>
            <a
              href="https://www.linkedin.com/in/mohammed-maaz-a-0aa730217/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#0077B5] hover:bg-[#006399] text-white text-[11px] font-medium rounded-full px-4 py-1.5 transition-colors"
              data-testid="footer-support-link"
            >
              <Linkedin className="w-3.5 h-3.5" />
              Connect for Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
