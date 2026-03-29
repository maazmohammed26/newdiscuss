import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Shield, Database, Lock, Smartphone, CheckCircle } from 'lucide-react';

export default function TermsModal({ open, onClose, onAccept, showAcceptButton = false }) {
  const [canAccept, setCanAccept] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open) {
      setCanAccept(false);
    }
  }, [open]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Check if scrolled to bottom (with 20px tolerance)
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setCanAccept(true);
      }
    }
  };

  const handleAccept = () => {
    if (canAccept && onAccept) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-heading text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#CC0000]" />
              Terms and Conditions
            </DialogTitle>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#F0F4FA] text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.terms-scroll::-webkit-scrollbar { display: none; }`}</style>
          
          <div className="space-y-6 text-[#0F172A] text-[14px] leading-relaxed terms-scroll">
            <p className="text-[#64748B]">
              Last updated: January 2026
            </p>

            <div className="bg-[#F0F4FA] rounded-xl p-4 border border-[#E2E8F0]">
              <h3 className="font-bold text-[15px] mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#10B981]" />
                Data Encryption & Security
              </h3>
              <p className="text-[13px] text-[#64748B]">
                All your data is encrypted using industry-standard encryption protocols. We employ AES-256 encryption for data at rest and TLS 1.3 for data in transit. Your passwords are hashed using bcrypt with salt rounds, ensuring they can never be retrieved or exposed.
              </p>
            </div>

            <div className="bg-[#F0F4FA] rounded-xl p-4 border border-[#E2E8F0]">
              <h3 className="font-bold text-[15px] mb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#3B82F6]" />
                Firebase Database Usage
              </h3>
              <p className="text-[13px] text-[#64748B]">
                We use Google Firebase Realtime Database, a secure, scalable, and reliable cloud database solution. Firebase provides automatic data synchronization, offline support, and is compliant with major security standards including SOC 1, SOC 2, and ISO 27001.
              </p>
            </div>

            <div className="bg-[#F0F4FA] rounded-xl p-4 border border-[#E2E8F0]">
              <h3 className="font-bold text-[15px] mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#CC0000]" />
                Full Security Assurance
              </h3>
              <ul className="text-[13px] text-[#64748B] space-y-1.5 list-disc list-inside">
                <li>Secure authentication via Firebase Auth</li>
                <li>Real-time security rules enforcement</li>
                <li>Protection against XSS, CSRF, and injection attacks</li>
                <li>Regular security audits and updates</li>
                <li>GDPR and CCPA compliant data handling</li>
                <li>No third-party data sharing without consent</li>
              </ul>
            </div>

            <div className="bg-[#F0F4FA] rounded-xl p-4 border border-[#E2E8F0]">
              <h3 className="font-bold text-[15px] mb-2 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#8B5CF6]" />
                Progressive Web App (PWA) Enabled
              </h3>
              <p className="text-[13px] text-[#64748B]">
                Our platform is PWA-enabled, allowing you to install it on your device for a native app-like experience. Features include offline access, push notifications, and seamless updates without app store downloads.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[15px] mb-2">User Responsibilities</h3>
              <p className="text-[13px] text-[#64748B]">
                By using this platform, you agree to:
              </p>
              <ul className="text-[13px] text-[#64748B] space-y-1 list-disc list-inside mt-2">
                <li>Provide accurate and truthful information</li>
                <li>Keep your login credentials secure</li>
                <li>Not engage in harassment, spam, or malicious activities</li>
                <li>Respect intellectual property rights</li>
                <li>Report any security vulnerabilities responsibly</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[15px] mb-2">Content Guidelines</h3>
              <p className="text-[13px] text-[#64748B]">
                Users are responsible for the content they post. We reserve the right to remove content that violates our community guidelines, including but not limited to hate speech, illegal content, or spam.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[15px] mb-2">Account Termination</h3>
              <p className="text-[13px] text-[#64748B]">
                We reserve the right to suspend or terminate accounts that violate these terms. Users may also delete their accounts at any time through their profile settings.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[15px] mb-2">Contact & Support</h3>
              <p className="text-[13px] text-[#64748B]">
                For any questions or concerns regarding these terms, please contact our support team. We are committed to addressing your queries promptly and transparently.
              </p>
            </div>

            <div className="bg-[#10B981]/10 rounded-xl p-4 border border-[#10B981]/20">
              <p className="text-[13px] text-[#10B981] font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                By accepting these terms, you acknowledge that you have read, understood, and agree to be bound by all the conditions stated above.
              </p>
            </div>
          </div>
        </div>

        {showAcceptButton && (
          <div className="p-6 pt-4 border-t border-[#E2E8F0] flex-shrink-0">
            <Button
              onClick={handleAccept}
              disabled={!canAccept}
              className={`w-full rounded-full py-3 h-12 font-semibold transition-all ${
                canAccept 
                  ? 'bg-[#CC0000] hover:bg-[#A30000] text-white shadow-lg shadow-[#CC0000]/20' 
                  : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              {canAccept ? 'I Accept the Terms and Conditions' : 'Please scroll to the bottom to accept'}
            </Button>
          </div>
        )}

        {!showAcceptButton && (
          <div className="p-6 pt-4 border-t border-[#E2E8F0] flex-shrink-0">
            <Button
              onClick={onClose}
              className="w-full bg-[#F0F4FA] hover:bg-[#E2E8F0] text-[#0F172A] rounded-full py-3 h-12 font-semibold"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
