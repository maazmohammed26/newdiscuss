import { useState, useEffect } from 'react';
import { subscribeToAdminMessage } from '@/lib/db';
import { Info, X } from 'lucide-react';

export default function AdminMessageBanner() {
  const [message, setMessage] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAdminMessage((msg) => {
      setMessage(msg);
      setDismissed(false); // Reset dismissed when message changes
    });
    return unsubscribe;
  }, []);

  // Don't show if no message or dismissed
  if (!message || message.trim() === '' || dismissed) {
    return null;
  }

  return (
    <div 
      data-testid="admin-message-banner"
      className="bg-gradient-to-r from-[#CC0000]/10 via-[#CC0000]/5 to-[#CC0000]/10 border-b border-[#CC0000]/20"
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#CC0000] rounded-lg flex items-center justify-center shrink-0">
          <Info className="w-4 h-4 text-white" />
        </div>
        <p className="flex-1 text-[#0F172A] text-[13px] md:text-[14px]">
          {message}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-lg hover:bg-[#CC0000]/10 text-[#64748B] hover:text-[#CC0000] transition-colors shrink-0"
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
