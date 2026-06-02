'use client';

import { BrandingLoginPage } from '../types';

interface LoginPagePreviewProps {
  config: BrandingLoginPage;
  primaryColor: string;
}

export function LoginPagePreview({ config, primaryColor }: LoginPagePreviewProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden shadow-sm aspect-[4/3] flex">
      {/* Left panel */}
      <div
        className="w-2/5 p-3 flex flex-col justify-center items-center text-white"
        style={{ backgroundColor: config.leftPanelColor || primaryColor }}
      >
        <div className="size-6 rounded-full bg-white/30 mb-1.5" />
        <div className="h-1.5 w-16 rounded bg-white/70 text-center text-[5px] leading-[6px]">
          {config.title || 'Welcome Back'}
        </div>
        <div className="h-1 w-12 rounded bg-white/30 mt-1 text-[4px] leading-[4px] text-center">
          {config.subtitle || 'Sign in to your account'}
        </div>
      </div>
      {/* Right panel */}
      <div className="flex-1 p-3 bg-background space-y-2">
        <div className="h-1.5 w-14 rounded bg-foreground/30" />
        <div className="h-4 w-full rounded border border-border bg-muted/50" />
        <div className="h-1.5 w-12 rounded bg-foreground/30" />
        <div className="h-4 w-full rounded border border-border bg-muted/50" />
        <div className="h-5 w-full rounded text-[6px] flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
          Sign In
        </div>
        {config.showSocialLogin && (
          <div className="flex gap-1 justify-center">
            <div className="size-4 rounded-full border border-border" />
            <div className="size-4 rounded-full border border-border" />
          </div>
        )}
      </div>
    </div>
  );
}
