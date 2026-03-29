import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { checkUsernameAvailable, checkEmailAvailable, getAdminSettings } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TermsModal from '@/components/TermsModal';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, AlertCircle, Shield, Linkedin } from 'lucide-react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_8b258d09-2813-4c39-875f-1044b1a2ed97/artifacts/bnfmcn2l_rqVRL__1_-removebg-preview.png';

function GoogleIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
}

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  const usernameTimeout = useRef(null);
  const emailTimeout = useRef(null);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Check admin settings
  useEffect(() => {
    getAdminSettings().then(settings => {
      setSignupEnabled(settings.signup_enabled !== false);
      setSettingsLoading(false);
    }).catch(() => setSettingsLoading(false));
  }, []);

  // Real-time username validation
  useEffect(() => {
    if (usernameTimeout.current) clearTimeout(usernameTimeout.current);
    if (!username.trim()) { setUsernameStatus(null); return; }
    if (username.trim().length < 2) { setUsernameStatus({ type: 'invalid', msg: 'At least 2 characters' }); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) { setUsernameStatus({ type: 'invalid', msg: 'Letters, numbers, underscores only' }); return; }
    
    setUsernameStatus({ type: 'checking', msg: 'Checking...' });
    usernameTimeout.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(username.trim());
        setUsernameStatus(available 
          ? { type: 'available', msg: 'Username is available' } 
          : { type: 'taken', msg: 'Username is already taken' }
        );
      } catch { setUsernameStatus(null); }
    }, 500);
  }, [username]);

  // Real-time email validation
  useEffect(() => {
    if (emailTimeout.current) clearTimeout(emailTimeout.current);
    if (!email.trim()) { setEmailStatus(null); return; }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email.trim())) { setEmailStatus({ type: 'invalid', msg: 'Invalid email format' }); return; }
    
    setEmailStatus({ type: 'checking', msg: 'Checking...' });
    emailTimeout.current = setTimeout(async () => {
      try {
        const available = await checkEmailAvailable(email.trim());
        setEmailStatus(available 
          ? { type: 'available', msg: 'Email is available' } 
          : { type: 'taken', msg: 'Email is already registered' }
        );
      } catch { setEmailStatus(null); }
    }, 500);
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!signupEnabled) return;
    if (!username.trim()) return setError('Username is required');
    if (usernameStatus?.type === 'taken') return setError('Username is already taken');
    if (!email.trim()) return setError('Email is required');
    if (emailStatus?.type === 'taken') return setError('Email is already registered');
    if (!password || password.length < 6) return setError('Password must be 6+ characters');
    if (password !== confirmPw) return setError('Passwords do not match');
    if (!termsAccepted) return setError('Please accept the Terms and Conditions');
    
    setLoading(true);
    const r = await register(username.trim(), email.trim(), password);
    setLoading(false);
    if (r.success) navigate('/feed');
    else setError(r.error);
  };

  const handleGoogle = async () => {
    if (!signupEnabled) return;
    setError('');
    setGoogleLoading(true);
    const r = await loginWithGoogle();
    setGoogleLoading(false);
    if (r.success) navigate('/feed');
    else if (r.error) setError(r.error);
  };

  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setShowTerms(false);
  };

  const statusIcon = (status) => {
    if (!status) return null;
    if (status.type === 'checking') return <Loader2 className="w-3.5 h-3.5 animate-spin text-[#94A3B8]" />;
    if (status.type === 'available') return <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />;
    if (status.type === 'taken') return <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />;
    if (status.type === 'invalid') return <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />;
    return null;
  };

  const statusColor = (status) => {
    if (!status) return '';
    if (status.type === 'available') return 'border-[#10B981]';
    if (status.type === 'taken') return 'border-[#EF4444]';
    if (status.type === 'invalid') return 'border-[#F59E0B]';
    return '';
  };

  const statusTextColor = (status) => {
    if (!status) return 'text-[#64748B]';
    if (status.type === 'available') return 'text-[#10B981]';
    if (status.type === 'taken') return 'text-[#EF4444]';
    if (status.type === 'invalid') return 'text-[#F59E0B]';
    return 'text-[#64748B]';
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-[#F0F4FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#CC0000]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4FA] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link to="/">
              <div className="w-16 h-16 bg-[#CC0000] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#CC0000]/20">
                <img src={LOGO_URL} alt="" className="h-8 brightness-0 invert" data-testid="register-logo" />
              </div>
            </Link>
            <h1 className="font-heading text-2xl font-bold text-[#0F172A] italic">discuss</h1>
            <p className="text-[#64748B] text-[13px] mt-1">join the conversation</p>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 md:p-8">
            {!signupEnabled ? (
              <div data-testid="signup-disabled-message" className="text-center py-8">
                <div className="w-16 h-16 bg-[#F59E0B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-[#F59E0B]" />
                </div>
                <h3 className="text-[#0F172A] font-semibold text-lg mb-2">Sign Up Disabled</h3>
                <p className="text-[#64748B] text-[14px]">Admin has disabled the sign-up process. Thank you.</p>
                <Link to="/login" className="inline-block mt-4 text-[#CC0000] hover:underline font-semibold text-[14px]">
                  Go to Login
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div data-testid="register-error" className="bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-xl p-3 text-[#EF4444] text-[13px] mb-4 flex items-start gap-2">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                  </div>
                )}

                <Button type="button" data-testid="register-google-btn" onClick={handleGoogle} disabled={googleLoading}
                  className="w-full bg-[#F0F4FA] border border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0] rounded-full py-2.5 h-11 font-medium flex items-center justify-center gap-2.5 mb-5">
                  {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><GoogleIcon /> Continue with Google</>}
                </Button>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E2E8F0]" /></div>
                  <div className="relative flex justify-center text-[11px]"><span className="bg-white px-3 text-[#94A3B8] uppercase tracking-wider">Or sign up with email</span></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Username */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[#64748B] text-[11px] font-bold uppercase tracking-[0.1em]">Username</label>
                      {statusIcon(usernameStatus)}
                    </div>
                    <Input data-testid="register-username-input" value={username} onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      className={`mt-1 bg-[#F0F4FA] border-[#E2E8F0] focus:bg-white focus:border-[#3B82F6] rounded-xl h-11 ${statusColor(usernameStatus)}`} />
                    {usernameStatus?.msg && (
                      <p className={`text-[11px] mt-1 flex items-center gap-1 ${statusTextColor(usernameStatus)}`}>
                        {usernameStatus.msg}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[#64748B] text-[11px] font-bold uppercase tracking-[0.1em]">Email</label>
                      {statusIcon(emailStatus)}
                    </div>
                    <Input data-testid="register-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`mt-1 bg-[#F0F4FA] border-[#E2E8F0] focus:bg-white focus:border-[#3B82F6] rounded-xl h-11 ${statusColor(emailStatus)}`} />
                    {emailStatus?.msg && (
                      <p className={`text-[11px] mt-1 flex items-center gap-1 ${statusTextColor(emailStatus)}`}>
                        {emailStatus.msg}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-[#64748B] text-[11px] font-bold uppercase tracking-[0.1em]">Password</label>
                    <div className="relative mt-1">
                      <Input data-testid="register-password-input" type={showPw ? 'text' : 'password'} value={password}
                        onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters"
                        className="bg-[#F0F4FA] border-[#E2E8F0] focus:bg-white focus:border-[#3B82F6] rounded-xl h-11 pr-10" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-[#64748B] text-[11px] font-bold uppercase tracking-[0.1em]">Confirm Password</label>
                    <Input data-testid="register-confirm-password-input" type="password" value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repeat password"
                      className="mt-1 bg-[#F0F4FA] border-[#E2E8F0] focus:bg-white focus:border-[#3B82F6] rounded-xl h-11" />
                    {confirmPw && password !== confirmPw && (
                      <span className="text-[#EF4444] text-[11px] mt-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />Passwords don't match
                      </span>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 accent-[#CC0000] cursor-pointer"
                      data-testid="register-terms-checkbox"
                      readOnly
                    />
                    <label htmlFor="terms" className="text-[#64748B] text-[13px]">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowTerms(true)}
                        className="text-[#CC0000] hover:underline font-semibold"
                        data-testid="register-terms-link"
                      >
                        Terms and Conditions
                      </button>
                    </label>
                  </div>

                  <Button type="submit" data-testid="register-submit-btn"
                    disabled={loading || usernameStatus?.type === 'taken' || emailStatus?.type === 'taken' || !termsAccepted}
                    className="w-full bg-[#CC0000] hover:bg-[#A30000] text-white font-semibold rounded-full py-3 h-12 text-[15px] shadow-lg shadow-[#CC0000]/20 mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                  </Button>
                </form>

                <p className="text-center text-[#64748B] text-[13px] mt-5">
                  Already have an account?{' '}
                  <Link to="/login" data-testid="register-to-login-link" className="text-[#CC0000] hover:underline font-semibold">
                    Login
                  </Link>
                </p>
              </>
            )}
          </div>

          <div className="text-center mt-6 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span className="text-[#94A3B8] text-[11px] font-semibold uppercase tracking-wider">Secure Authentication</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-[#94A3B8] text-[12px]">
          Developed and managed by{' '}
          <a 
            href="https://www.linkedin.com/in/mohammed-maaz-a-0aa730217/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#CC0000] hover:underline font-semibold inline-flex items-center gap-1"
          >
            Mohammed Maaz A
            <Linkedin className="w-3 h-3" />
          </a>
        </p>
      </footer>

      <TermsModal 
        open={showTerms} 
        onClose={() => setShowTerms(false)} 
        onAccept={handleTermsAccept}
        showAcceptButton={!termsAccepted}
      />
    </div>
  );
}
