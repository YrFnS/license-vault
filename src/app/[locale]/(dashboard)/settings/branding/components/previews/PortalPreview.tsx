'use client';

import { BrandingPortal } from '../types';

interface PortalPreviewProps {
  config: BrandingPortal;
  primaryColor: string;
}

export function PortalPreview({ config, primaryColor }: PortalPreviewProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="h-6 flex items-center px-3" style={{ backgroundColor: primaryColor }}>
        <div className="size-3 rounded bg-white/30" />
        <div className="h-1 w-14 rounded bg-white/50 ms-2" />
        {config.showComplianceScore && (
          <div className="ms-auto size-4 rounded-full border-2 border-white/50 flex items-center justify-center text-[4px] text-white">
            ✓
          </div>
        )}
      </div>
      {/* Body */}
      <div className="p-3 bg-background space-y-1.5">
        {config.welcomeMessage && (
          <div className="h-1.5 w-20 rounded bg-foreground/30" />
        )}
        <div className="h-1 w-full rounded bg-muted" />
        <div className="h-1 w-3/4 rounded bg-muted" />
        <div className="flex gap-1.5 mt-1">
          <div className="flex-1 h-8 rounded border border-border p-1">
            <div className="h-1 w-6 rounded bg-muted" />
            <div className="h-3 w-full rounded mt-0.5" style={{ backgroundColor: `${primaryColor}33` }} />
          </div>
          <div className="flex-1 h-8 rounded border border-border p-1">
            <div className="h-1 w-6 rounded bg-muted" />
            <div className="h-3 w-full rounded mt-0.5" style={{ backgroundColor: `${primaryColor}33` }} />
          </div>
        </div>
        {config.showContactInfo && (
          <div className="h-1 w-16 rounded bg-muted mt-1" />
        )}
      </div>
      {/* Footer */}
      <div className="border-t border-border p-1.5 text-[5px] text-muted-foreground text-center">
        {config.footerText || 'Powered by LicenseVault'}
      </div>
    </div>
  );
}
