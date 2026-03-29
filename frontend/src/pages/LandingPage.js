import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import LoadingScreen from '@/components/LoadingScreen';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import AdminMessageBanner from '@/components/AdminMessageBanner';
import DiscussLogo from '@/components/DiscussLogo';
import { ArrowRight, MessageSquare, FolderGit2, Zap, Linkedin, Users, Shield } from 'lucide-react';

const features = [
  { icon: MessageSquare, title: 'Crafted for clarity.', desc: 'Designed to elevate the user experience through silence and space. Every element serves a purpose.' },
  { icon: FolderGit2, title: 'Project showcase.', desc: 'Share your work with GitHub links and live previews. Get real feedback from real developers.' },
  { icon: Zap, title: 'Real-time, always.', desc: 'Votes, comments, and posts update instantly across all connected users. No refresh needed.' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for realistic feel
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Preparing your experience..." />;
  }

  return (
    <div className="min-h-screen bg-[#F0F4FA]">
      <Header />
      <AdminMessageBanner />
      <PWAInstallBanner />

      {/* Hero */}
      <section className="pt-16 pb-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 data-testid="hero-title" className="font-heading text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#0F172A] leading-[1.1] tracking-tight">
            Where deep thought<br />meets <em className="text-[#CC0000] not-italic font-bold" style={{fontStyle:'italic'}}>beautiful</em> design.
          </h1>
          <p className="mt-5 text-[#64748B] text-[14px] md:text-[16px] leading-relaxed max-w-lg mx-auto">
            A curated editorial space for meaningful projects. We've stripped away the noise to leave only what matters: the conversation and the craft.
          </p>
          <div className="mt-8 flex flex-col gap-3 max-w-sm mx-auto">
            {user ? (
              <Link to="/feed">
                <Button data-testid="hero-go-to-feed" className="w-full bg-[#CC0000] hover:bg-[#A30000] text-white font-semibold rounded-full px-8 py-3 text-base shadow-lg shadow-[#CC0000]/20 transition-all">
                  Go to Feed <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button data-testid="hero-register-btn" className="w-full bg-[#CC0000] hover:bg-[#A30000] text-white font-semibold rounded-full px-8 py-3 text-base shadow-lg shadow-[#CC0000]/20 transition-all">
                    Start a project <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button data-testid="hero-login-btn" variant="outline" className="w-full bg-[#DBE4F0] hover:bg-[#CDD8EA] text-[#0F172A] font-medium rounded-full px-8 py-3 text-base border-0 transition-all">
                    Explore feed
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} data-testid={`feature-card-${i}`} className="bg-[#F0F4FA] rounded-2xl p-6 hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm">
                  <f.icon className="w-5 h-5 text-[#CC0000]" />
                </div>
                <h3 className="text-[17px] font-bold text-[#0F172A] mb-2">{f.title}</h3>
                <p className="text-[#64748B] text-[13px] md:text-[14px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 md:px-8 bg-[#F0F4FA]">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex justify-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-[#CC0000]/10 flex items-center justify-center"><Users className="w-4 h-4 text-[#CC0000]" /></div>
            <div className="w-9 h-9 rounded-full bg-[#3B82F6]/10 flex items-center justify-center"><Shield className="w-4 h-4 text-[#3B82F6]" /></div>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A] mb-3">Ready to join?</h2>
          <p className="text-[#64748B] text-[14px] mb-6">Join developers sharing knowledge and projects.</p>
          {!user && (
            <Link to="/register">
              <Button data-testid="cta-register-btn" className="bg-[#CC0000] hover:bg-[#A30000] text-white font-semibold rounded-full px-8 py-3 shadow-lg shadow-[#CC0000]/20">
                Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-[#E2E8F0] bg-white">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <DiscussLogo size="md" />
            <p className="text-[#64748B] text-xs">&copy; {new Date().getFullYear()} Discuss. Built for developers.</p>
          </div>
          <div className="flex flex-col items-center gap-2 pt-2 border-t border-[#E2E8F0] w-full">
            <p className="text-[#64748B] text-[12px]">
              Developed by{' '}
              <span className="text-[#CC0000] font-semibold">&lt;Mohammed Maaz A&gt;</span>
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
