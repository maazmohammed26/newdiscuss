import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, Shield } from 'lucide-react';

export default function ExternalLinkModal({ open, onClose, url, isHttp = false }) {
  const handleProceed = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${isHttp ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`} />
            External Link Warning
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {isHttp && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#EF4444] text-[13px] font-semibold">Security Warning!</p>
                  <p className="text-[#EF4444]/80 text-[12px] mt-0.5">
                    This link uses HTTP (not HTTPS) and is NOT secure. Your data may be visible to others.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
            <p className="text-[#64748B] text-[13px] mb-3">You are about to open an external link:</p>
            <div className="bg-white rounded-lg p-3 border border-[#E2E8F0] break-all">
              <p className="text-[#0F172A] text-[13px] font-mono flex items-start gap-2">
                <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 text-[#3B82F6]" />
                {url}
              </p>
            </div>
          </div>

          <div className="bg-[#FEF3C7] rounded-xl p-3 mt-4">
            <p className="text-[#92400E] text-[12px]">
              <strong>Disclaimer:</strong> Discuss is not responsible for external content. 
              Please proceed with caution and verify the link before entering any personal information.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-[#E2E8F0] text-[#64748B] hover:bg-[#F0F4FA] rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleProceed}
            className={`flex-1 ${isHttp ? 'bg-[#EF4444] hover:bg-[#DC2626]' : 'bg-[#CC0000] hover:bg-[#A30000]'} text-white rounded-full`}
          >
            {isHttp ? 'Proceed Anyway' : 'Open Link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
