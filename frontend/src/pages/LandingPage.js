import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import LoadingScreen from '@/components/LoadingScreen';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import AdminMessageBanner from '@/components/AdminMessageBanner';
import DiscussLogo from '@/components/DiscussLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { ArrowRight, MessageSquare, FolderGit2, Zap, Linkedin, Users, Shield, Terminal } from 'lucide-react';

const features = [
  { icon: MessageSquare, title: 'Crafted for clarity.', desc: 'Designed to elevate the user experience through silence and space. Every element serves a purpose.' },
  { icon: FolderGit2, title: 'Project showcase.', desc: 'Share your work with GitHub links and live previews. Get real feedback from real developers.' },
  { icon: Zap, title: 'Real-time, always.', desc: 'Votes, comments, and posts update instantly across all connected users. No refresh needed.' },
  { icon: Terminal, title: 'New: Discuss Theme!', desc: 'Experience our retro terminal-style theme with square edges, monospace fonts, and classic green-on-black aesthetics.', highlight: true },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Preparing your experience..." />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F172A]">
      <Header />
      <AdminMessageBanner />
      <PWAInstallBanner />

      {/* Hero */}
      <section className="pt-16 pb-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 data-testid="hero-title" className="font-heading text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#0F172A] dark:text-[#F1F5F9] leading-[1.1] tracking-tight">
            Where deep thought<br />meets <em className="text-[#BC4800] not-italic font-bold" style={{fontStyle:'italic'}}>beautiful</em> design.
          </h1>
          <p className="mt-5 text-[#6275AF] dark:text-[#94A3B8] text-[14px] md:text-[16px] leading-relaxed max-w-lg mx-auto">
            A curated editorial space for meaningful projects. We've stripped away the noise to leave only what matters: the conversation and the craft.
          </p>
          <div className="mt-8 flex flex-col gap-3 max-w-sm mx-auto">
            {user ? (
              <Link to="/feed">
                <Button data-testid="hero-go-to-feed" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-full px-8 py-3 text-base shadow-lg shadow-[#2563EB]/20 transition-all">
                  Go to Feed <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button data-testid="hero-register-btn" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-full px-8 py-3 text-base shadow-lg shadow-[#2563EB]/20 transition-all">
                    Start a project <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button data-testid="hero-login-btn" variant="outline" className="w-full bg-[#E8EBF0] dark:bg-[#1E293B] hover:bg-[#D9DDE4] dark:hover:bg-[#334155] text-[#0F172A] dark:text-[#F1F5F9] font-medium rounded-full px-8 py-3 text-base border-0 transition-all">
                    Explore feed
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 md:px-8 bg-white dark:bg-[#1E293B] discuss:bg-[#141414]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} data-testid={`feature-card-${i}`} className={`relative bg-[#F5F5F7] dark:bg-[#0F172A] discuss:bg-[#1E1E1E] discuss:border discuss:border-[#00FF88] p-6 hover:shadow-md dark:hover:shadow-none transition-all group ${
                f.highlight ? 'md:col-span-2 ring-2 ring-[#BC4800] ring-offset-4 ring-offset-white dark:ring-offset-[#1E293B] discuss:ring-[#00FF88] discuss:ring-offset-[#141414]' : ''
              }`}>
                {f.highlight && (
                  <span className="absolute -top-3 left-6 bg-[#BC4800] discuss:bg-[#00FF88] text-white discuss:text-[#0a0a0a] text-xs font-bold px-3 py-1 uppercase tracking-wide">
                    ⚡ Just Launched
                  </span>
                )}
                <div className={`w-10 h-10 bg-white dark:bg-[#1E293B] discuss:bg-[#0a0a0a] discuss:border discuss:border-[#00FF88] flex items-center justify-center mb-4 shadow-sm ${f.highlight ? '' : ''}`}>
                  <f.icon className={`w-5 h-5 ${f.highlight ? 'text-[#BC4800] discuss:text-[#00FF88]' : 'text-[#2563EB] discuss:text-[#00FF88]'}`} />
                </div>
                <h3 className={`text-[17px] font-bold mb-2 ${f.highlight ? 'text-[#BC4800] dark:text-[#BC4800] discuss:text-[#00FF88]' : 'text-[#0F172A] dark:text-[#F1F5F9] discuss:text-[#00FF88]'}`}>{f.title}</h3>
                <p className="text-[#6275AF] dark:text-[#94A3B8] discuss:text-[#00FF88]/70 text-[13px] md:text-[14px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 md:px-8 bg-[#F5F5F7] dark:bg-[#0F172A]">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex justify-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-[#2563EB]/10 flex items-center justify-center"><Users className="w-4 h-4 text-[#2563EB]" /></div>
            <div className="w-9 h-9 rounded-full bg-[#BC4800]/10 flex items-center justify-center"><Shield className="w-4 h-4 text-[#BC4800]" /></div>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-[#F1F5F9] mb-3">Ready to join?</h2>
          <p className="text-[#6275AF] dark:text-[#94A3B8] text-[14px] mb-6">Join developers sharing knowledge and projects.</p>
          {!user && (
            <Link to="/register">
              <Button data-testid="cta-register-btn" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-full px-8 py-3 shadow-lg shadow-[#2563EB]/20">
                Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#1E293B]">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <DiscussLogo size="md" />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <p className="text-[#6275AF] dark:text-[#94A3B8] text-xs">&copy; {new Date().getFullYear()} Discuss. Built for developers.</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#334155] w-full">
            <p className="text-[#6275AF] dark:text-[#94A3B8] text-[12px]">
              Developed by{' '}
              <span className="text-[#BC4800] font-semibold">&lt;Mohammed Maaz A&gt;</span>
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
