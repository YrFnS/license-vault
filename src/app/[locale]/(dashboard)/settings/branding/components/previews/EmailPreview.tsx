'use client';

import { BrandingEmailTemplates } from '../types';

interface EmailPreviewProps {
  config: BrandingEmailTemplates;
  primaryColor: string;
}

export function EmailPreview({ config, primaryColor }: EmailPreviewProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="h-5 flex items-center px-3" style={{ backgroundColor: config.headerColor || primaryColor }}>
        <div className="size-3 rounded bg-white/30" />
        <div className="h-1 w-10 rounded bg-white/50 ms-2" />
      </div>
      {/* Body */}
      <div className="p-3 bg-background space-y-1.5">
        <div className="h-1.5 w-20 rounded bg-foreground/30" />
        <div className="h-1 w-full rounded bg-muted" />
        <div className="h-1 w-3/4 rounded bg-muted" />
        <div className="h-1 w-1/2 rounded bg-muted" />
        <div className="h-4 w-16 rounded text-[6px] flex items-center justify-center text-white mt-1" style={{ backgroundColor: primaryColor }}>
          View Details
        </div>
      </div>
      {/* Footer */}
      <div className="border-t border-border p-2 text-[5px] text-muted-foreground text-center">
        {config.footerText || `© ${new Date().getFullYear()} LicenseVault. All rights reserved.`}
      </div>
    </div>
  );
}
