'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        nonce={nonce}
      >
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
