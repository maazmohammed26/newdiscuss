import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    const alreadyShown = localStorage.getItem('pwa_banner_shown');
    if (alreadyShown) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const timer = setTimeout(() => {
      if (!isInstalled) setShowBanner(true);
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
      if (outcome === 'accepted') setShowBanner(false);
      setDeferredPrompt(null);
    } else {
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
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white dark:bg-[#1E293B] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[#E2E8F0] dark:border-[#334155] p-4 z-50 animate-slide-up"
    >
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
      `}</style>

      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-[#F5F5F7] dark:hover:bg-[#334155] text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] transition-colors"
        data-testid="pwa-dismiss-btn"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-[#2563EB]/20">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-[15px]">Add to Home Screen</h3>
          <p className="text-[#6275AF] dark:text-[#94A3B8] text-[12px] mt-0.5">Install Discuss for the best experience</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#F5F5F7] dark:bg-[#0F172A] rounded-lg p-2 text-center">
          <Zap className="w-4 h-4 text-[#2563EB] mx-auto mb-1" />
          <span className="text-[10px] text-[#6275AF] dark:text-[#94A3B8] font-medium">PWA Enabled</span>
        </div>
        <div className="bg-[#F5F5F7] dark:bg-[#0F172A] rounded-lg p-2 text-center">
          <Shield className="w-4 h-4 text-[#10B981] mx-auto mb-1" />
          <span className="text-[10px] text-[#6275AF] dark:text-[#94A3B8] font-medium">100% Secure</span>
        </div>
        <div className="bg-[#F5F5F7] dark:bg-[#0F172A] rounded-lg p-2 text-center">
          <Download className="w-4 h-4 text-[#BC4800] mx-auto mb-1" />
          <span className="text-[10px] text-[#6275AF] dark:text-[#94A3B8] font-medium">No APK</span>
        </div>
      </div>

      <p className="text-[#6275AF] dark:text-[#94A3B8] text-[12px] mb-4 leading-relaxed">
        No need to download any APK! This is a <span className="font-semibold text-[#2563EB]">Progressive Web App</span> - install directly from your browser. Completely secured with encrypted data.
      </p>

      <Button
        onClick={handleInstall}
        className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-full py-2.5 h-11 shadow-lg shadow-[#2563EB]/20 flex items-center justify-center gap-2"
        data-testid="pwa-install-btn"
      >
        <Download className="w-4 h-4" />
        Install Now
      </Button>
    </div>
  );
}
