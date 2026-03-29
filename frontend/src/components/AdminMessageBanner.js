import { useState, useEffect } from 'react';
import { subscribeToAdminMessage } from '@/lib/db';
import { MessageCircle, X } from 'lucide-react';

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
      className="bg-[#EFF6FF] border-b border-[#3B82F6]/20"
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
        <p className="flex-1 text-[13px] md:text-[14px]">
          <span className="text-[#0F172A] font-medium">Message from </span>
          <span className="text-[#3B82F6] font-bold">&lt;Discuss Admin&gt;</span>
          <span className="text-[#0F172A] font-medium"> : </span>
          <span className="text-[#3B82F6]">{message}</span>
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-lg hover:bg-[#3B82F6]/10 text-[#64748B] hover:text-[#3B82F6] transition-colors shrink-0"
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
