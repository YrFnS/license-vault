'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, Plus, Upload, PanelLeftClose, Keyboard } from 'lucide-react';
import { isMac } from '@/lib/utils';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { key: 'search', icon: Search, combo: 'k' },
  { key: 'newLicense', icon: Plus, combo: 'n' },
  { key: 'importCsv', icon: Upload, combo: 'i' },
  { key: 'toggleSidebar', icon: PanelLeftClose, combo: '.' },
  { key: 'showShortcuts', icon: Keyboard, combo: '/' },
] as const;

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const t = useTranslations('shortcuts');
  const modKey = isMac() ? '⌘' : 'Ctrl';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-5 text-emerald-600 dark:text-emerald-400" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1 mt-2">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <div
                key={shortcut.key}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                    <Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {t(shortcut.key)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-0.5 rounded-md border border-border bg-muted/80 px-2 font-mono text-xs font-medium text-muted-foreground shadow-sm">
                    <span>{modKey}</span>
                  </kbd>
                  <span className="text-muted-foreground/50 text-xs">+</span>
                  <kbd className="pointer-events-none inline-flex h-6 select-none items-center rounded-md border border-border bg-muted/80 px-2 font-mono text-xs font-medium text-muted-foreground shadow-sm uppercase">
                    {shortcut.combo}
                  </kbd>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground/60 text-center mt-3 pt-3 border-t border-border/50">
          {t('footer')}
        </p>
      </DialogContent>
    </Dialog>
  );
}
