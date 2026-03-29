import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if already shown once (never show again)
    const alreadyShown = localStorage.getItem('pwa_banner_shown');
    if (alreadyShown) {
      return;
    }

    // Listen for install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show banner after 2 seconds even without prompt (for iOS)
    const timer = setTimeout(() => {
      if (!isInstalled) {
        setShowBanner(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // For iOS - show instructions
      alert('To install: Tap the Share button in your browser, then select "Add to Home Screen"');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_shown', 'true');
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div 
      data-testid="pwa-install-banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#E2E8F0] p-4 z-50 animate-slide-up"
    >
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
      `}</style>
      
      {/* Close button */}
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-[#F0F4FA] text-[#94A3B8] hover:text-[#0F172A] transition-colors"
        data-testid="pwa-dismiss-btn"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-[#CC0000] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-[#CC0000]/20">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-[#0F172A] text-[15px]">Add to Home Screen</h3>
          <p className="text-[#64748B] text-[12px] mt-0.5">Install Discuss for the best experience</p>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#F0F4FA] rounded-lg p-2 text-center">
          <Zap className="w-4 h-4 text-[#CC0000] mx-auto mb-1" />
          <span className="text-[10px] text-[#64748B] font-medium">PWA Enabled</span>
        </div>
        <div className="bg-[#F0F4FA] rounded-lg p-2 text-center">
          <Shield className="w-4 h-4 text-[#10B981] mx-auto mb-1" />
          <span className="text-[10px] text-[#64748B] font-medium">100% Secure</span>
        </div>
        <div className="bg-[#F0F4FA] rounded-lg p-2 text-center">
          <Download className="w-4 h-4 text-[#3B82F6] mx-auto mb-1" />
          <span className="text-[10px] text-[#64748B] font-medium">No APK</span>
        </div>
      </div>

      {/* Message */}
      <p className="text-[#64748B] text-[12px] mb-4 leading-relaxed">
        No need to download any APK! This is a <span className="font-semibold text-[#CC0000]">Progressive Web App</span> - install directly from your browser. Completely secured with encrypted data.
      </p>

      {/* Install button */}
      <Button
        onClick={handleInstall}
        className="w-full bg-[#CC0000] hover:bg-[#A30000] text-white font-semibold rounded-full py-2.5 h-11 shadow-lg shadow-[#CC0000]/20 flex items-center justify-center gap-2"
        data-testid="pwa-install-btn"
      >
        <Download className="w-4 h-4" />
        Install Now
      </Button>
    </div>
  );
}
