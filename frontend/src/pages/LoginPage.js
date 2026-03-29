import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TermsModal from '@/components/TermsModal';
import LoadingScreen from '@/components/LoadingScreen';
import AdminMessageBanner from '@/components/AdminMessageBanner';
import DiscussLogo from '@/components/DiscussLogo';
import { Eye, EyeOff, Loader2, XCircle, Shield, AlertCircle } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showForgotDisabled, setShowForgotDisabled] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (pageLoading) {
    return <LoadingScreen message="Loading login..." />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Email is required');
    if (!password) return setError('Password is required');
    setLoading(true);
    const r = await login(email, password);
    setLoading(false);
    if (r.success) navigate('/feed');
    else setError(r.error);
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    const r = await loginWithGoogle();
    setGoogleLoading(false);
    if (r.success) navigate('/feed');
    else if (r.error) setError(r.error);
  };

  const handleForgotPassword = () => {
    setShowForgotDisabled(true);
  };

  return (
    <div className="min-h-screen bg-[#F0F4FA] dark:bg-[#0F172A] flex flex-col">
      <AdminMessageBanner />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" data-testid="login-logo">
              <DiscussLogo size="lg" />
            </Link>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-none p-6 md:p-8">
            {error && (
              <div data-testid="login-error" className="bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-xl p-3 text-[#EF4444] text-[13px] mb-4 flex items-start gap-2">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}

            {showForgotDisabled && (
              <div data-testid="forgot-disabled-message" className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl p-3 text-[#92400E] text-[13px] mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#F59E0B]" />
                <span>Admin has disabled this feature. Thank you.</span>
                <button onClick={() => setShowForgotDisabled(false)} className="ml-auto text-[#92400E] hover:text-[#78350F]">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[#64748B] dark:text-[#94A3B8] text-[11px] font-bold uppercase tracking-[0.1em]">Email Address</label>
                <Input data-testid="login-email-input" type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="name@example.com"
                  className="mt-1.5 bg-[#F0F4FA] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] dark:text-[#F1F5F9] dark:placeholder:text-[#64748B] focus:bg-white dark:focus:bg-[#1E293B] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 rounded-xl h-11" />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-[#64748B] dark:text-[#94A3B8] text-[11px] font-bold uppercase tracking-[0.1em]">Password</label>
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[#CC0000] text-[12px] font-medium hover:underline"
                    data-testid="login-forgot-password"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <Input data-testid="login-password-input" type={showPw ? 'text' : 'password'} value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter password"
                    className="bg-[#F0F4FA] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] dark:text-[#F1F5F9] dark:placeholder:text-[#64748B] focus:bg-white dark:focus:bg-[#1E293B] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 rounded-xl h-11 pr-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" data-testid="login-submit-btn" disabled={loading}
                className="w-full bg-[#CC0000] hover:bg-[#A30000] text-white font-semibold rounded-full py-3 h-12 text-[15px] shadow-lg shadow-[#CC0000]/20 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E2E8F0] dark:border-[#334155]" /></div>
              <div className="relative flex justify-center text-[11px]"><span className="bg-white dark:bg-[#1E293B] px-3 text-[#94A3B8] uppercase tracking-wider">Or continue with</span></div>
            </div>

            <Button type="button" data-testid="login-google-btn" onClick={handleGoogle} disabled={googleLoading}
              className="w-full bg-[#F0F4FA] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F1F5F9] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] rounded-full py-2.5 h-11 font-medium flex items-center justify-center gap-2.5">
              {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><GoogleIcon /> Continue with Google</>}
            </Button>

            <p className="text-center text-[#64748B] dark:text-[#94A3B8] text-[13px] mt-5">
              New to discuss? <Link to="/register" data-testid="login-to-register-link" className="text-[#CC0000] hover:underline font-semibold">Create account</Link>
            </p>
          </div>

          {/* Footer links */}
          <div className="text-center mt-6 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-wider">Secure Authentication</span>
          </div>
          <div className="text-center mt-2 flex items-center justify-center">
            <button 
              onClick={() => setShowTerms(true)}
              className="text-[#94A3B8] text-[11px] hover:text-[#CC0000] hover:underline"
              data-testid="login-terms-link"
            >
              Terms and Conditions
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-[#94A3B8] text-[12px]">
          Developed by{' '}
          <span className="text-[#CC0000] font-semibold">&lt;Mohammed Maaz A&gt;</span>
        </p>
      </footer>

      <TermsModal 
        open={showTerms} 
        onClose={() => setShowTerms(false)} 
        showAcceptButton={false}
      />
    </div>
  );
}
