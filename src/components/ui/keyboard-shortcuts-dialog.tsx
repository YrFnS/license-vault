'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Settings,
  Plus,
  Search,
  PanelLeftClose,
  RefreshCw,
  Keyboard,
  Compass,
  Zap,
  Info,
  Users,
  ShieldCheck,
  CalendarDays,
  BarChart3,
  MessageSquare,
} from 'lucide-react';
import { isMac } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutEntry {
  key: string;
  icon: LucideIcon;
  keys: string[];
  // For two-step shortcuts like "G then D"
  keys2?: string[];
}

interface ShortcutCategory {
  categoryKey: string;
  icon: LucideIcon;
  entries: ShortcutEntry[];
}

function getModLabel(): string {
  if (typeof window === 'undefined') return 'Ctrl';
  return isMac() ? '⌘' : 'Ctrl';
}

function getShortcutCategories(mod: string): ShortcutCategory[] {
  return [
    {
      categoryKey: 'navigation',
      icon: Compass,
      entries: [
        { key: 'navDashboard', icon: LayoutDashboard, keys: ['G'], keys2: ['D'] },
        { key: 'navLicenses', icon: FileText, keys: ['G'], keys2: ['L'] },
        { key: 'navProjects', icon: FolderKanban, keys: ['G'], keys2: ['P'] },
        { key: 'navSettings', icon: Settings, keys: ['G'], keys2: ['S'] },
        { key: 'navTeam', icon: Users, keys: ['G'], keys2: ['T'] },
        { key: 'navCompliance', icon: ShieldCheck, keys: ['G'], keys2: ['C'] },
        { key: 'navCalendar', icon: CalendarDays, keys: ['G'], keys2: ['K'] },
        { key: 'navAdmin', icon: BarChart3, keys: ['G'], keys2: ['A'] },
        { key: 'navAiChat', icon: MessageSquare, keys: ['G'], keys2: ['X'] },
      ],
    },
    {
      categoryKey: 'actions',
      icon: Zap,
      entries: [
        { key: 'actNewLicense', icon: Plus, keys: ['N'] },
        { key: 'actSearch', icon: Search, keys: [mod, 'K'] },
        { key: 'actToggleSidebar', icon: PanelLeftClose, keys: [mod, 'B'] },
        { key: 'actRefresh', icon: RefreshCw, keys: ['R'] },
      ],
    },
    {
      categoryKey: 'general',
      icon: Info,
      entries: [
        { key: 'genShowShortcuts', icon: Keyboard, keys: ['?'] },
        { key: 'genShowShortcutsAlt', icon: Keyboard, keys: [mod, '/'] },
        { key: 'genCloseDialog', icon: Settings, keys: ['Esc'] },
      ],
    },
  ];
}

const contentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 } as const,
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  },
};

const categoryVariants = {
  hidden: { opacity: 0 } as const,
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.08, duration: 0.3, ease: 'easeOut' as const },
  }),
};

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="pointer-events-none inline-flex h-7 min-w-[28px] select-none items-center justify-center gap-0.5 rounded-md
        border border-emerald-200/60 dark:border-emerald-700/40
        bg-gradient-to-b from-emerald-50/80 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/30
        px-2 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300
        shadow-[0_1px_2px_rgba(16,185,129,0.12)] dark:shadow-[0_1px_2px_rgba(16,185,129,0.08)]
        transition-colors duration-150"
    >
      {children}
    </kbd>
  );
}

function ShortcutRow({
  entry,
  label,
  thenLabel,
}: {
  entry: ShortcutEntry;
  label: string;
  thenLabel: string;
}) {
  const Icon = entry.icon;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-3 py-2 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors duration-150 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors duration-150">
          <Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="text-sm font-medium text-foreground truncate">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {entry.keys.map((k, idx) => (
          <span key={idx} className="flex items-center gap-1">
            <Kbd>{k}</Kbd>
          </span>
        ))}
        {entry.keys2 && (
          <>
            <span className="text-emerald-400/60 dark:text-emerald-500/60 text-xs font-medium mx-0.5">
              {thenLabel}
            </span>
            {entry.keys2.map((k, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <Kbd>{k}</Kbd>
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const t = useTranslations('keyboardShortcuts');
  const [modLabel] = useState(() => (typeof window !== 'undefined' && isMac()) ? '⌘' : 'Ctrl');

  const categories = getShortcutCategories(modLabel);
  const thenLabel = t('then');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg p-0 gap-0 overflow-hidden border-emerald-200/50 dark:border-emerald-800/30"
        showCloseButton={false}
      >
        <AnimatePresence>
          {open && (
            <>
              {/* Header */}
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={contentVariants}
              >
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-teal-50/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-teal-950/20 p-6 pb-4 border-b border-emerald-100/60 dark:border-emerald-800/30">
                  {/* Decorative glow */}
                  <div className="absolute -top-8 -end-8 size-32 rounded-full bg-emerald-200/30 dark:bg-emerald-700/20 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-4 -start-4 size-20 rounded-full bg-teal-200/20 dark:bg-teal-800/15 blur-xl pointer-events-none" />

                  <DialogHeader className="relative">
                    <DialogTitle className="flex items-center gap-2.5 text-lg">
                      <div className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20">
                        <Keyboard className="size-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent font-bold">
                        {t('title')}
                      </span>
                    </DialogTitle>
                    <DialogDescription className="text-emerald-700/70 dark:text-emerald-300/60 ps-[44px]">
                      {t('subtitle')}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* Scrollable content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-5">
                    {categories.map((cat, catIdx) => {
                      const CatIcon = cat.icon;
                      return (
                        <motion.div
                          key={cat.categoryKey}
                          custom={catIdx}
                          initial="hidden"
                          animate="visible"
                          variants={categoryVariants}
                        >
                          {/* Category header */}
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <CatIcon className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              {t(`categories.${cat.categoryKey}`)}
                            </h3>
                            <div className="flex-1 h-px bg-gradient-to-r from-emerald-200/60 to-transparent dark:from-emerald-700/30 dark:to-transparent" />
                          </div>

                          {/* Shortcut entries */}
                          <div className="space-y-0.5">
                            {cat.entries.map((entry) => (
                              <ShortcutRow
                                key={entry.key}
                                entry={entry}
                                label={t(`shortcuts.${entry.key}`)}
                                thenLabel={thenLabel}
                              />
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-emerald-100/60 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/10">
                  <p className="text-[11px] text-emerald-600/50 dark:text-emerald-400/40 text-center">
                    {t('footer')}
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
