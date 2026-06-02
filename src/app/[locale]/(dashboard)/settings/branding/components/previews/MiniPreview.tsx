'use client';

import { BrandingColors, BrandingFonts } from '../types';

interface MiniPreviewProps {
  colors: BrandingColors;
  font: BrandingFonts;
  companyName: string;
}

export function MiniPreview({ colors, font, companyName }: MiniPreviewProps) {
  const scaleMap = { compact: '0.75', normal: '0.875', large: '1' };
  const s = scaleMap[font.scale] || '0.875';

  return (
    <div
      className="rounded-lg border border-border overflow-hidden shadow-sm"
      style={{ transform: `scale(${s})`, transformOrigin: 'top start' }}
    >
      {/* Header bar */}
      <div className="h-8 flex items-center px-3 gap-2" style={{ backgroundColor: colors.primary }}>
        <div className="size-4 rounded bg-white/30" />
        <div className="h-2 w-16 rounded bg-white/40" />
        <div className="ms-auto flex gap-1">
          <div className="size-2 rounded-full bg-white/30" />
          <div className="size-2 rounded-full bg-white/30" />
        </div>
      </div>
      {/* Body */}
      <div className="p-3 bg-background space-y-2">
        <div className="h-2 w-24 rounded bg-foreground/20" style={{ fontFamily: font.heading }} />
        <div className="h-1.5 w-full rounded bg-muted" />
        <div className="h-1.5 w-3/4 rounded bg-muted" />
        <div className="flex gap-2 mt-2">
          <div className="h-6 w-16 rounded text-[8px] flex items-center justify-center text-white" style={{ backgroundColor: colors.primary, fontFamily: font.body }}>
            Button
          </div>
          <div className="h-6 w-16 rounded border border-border text-[8px] flex items-center justify-center" style={{ fontFamily: font.body }}>
            Cancel
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <div className="flex-1 h-12 rounded border border-border p-1.5 space-y-1">
            <div className="h-1 w-8 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted/60" />
          </div>
          <div className="flex-1 h-12 rounded border border-border p-1.5 space-y-1">
            <div className="h-1 w-8 rounded bg-muted" />
            <div className="h-4 w-full rounded" style={{ backgroundColor: `${colors.secondary}33` }} />
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className="h-5 flex items-center px-3 border-t border-border">
        <div className="h-1.5 w-20 rounded bg-muted" />
        <div className="ms-auto h-1.5 w-12 rounded" style={{ backgroundColor: `${colors.accent}66` }} />
      </div>
      {companyName && (
        <div className="text-[6px] text-center py-0.5 text-muted-foreground" style={{ fontFamily: font.body }}>
          {companyName}
        </div>
      )}
    </div>
  );
}
