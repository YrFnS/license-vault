'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';

interface ShortcutActions {
  onSearch?: () => void;
  onNewLicense?: () => void;
  onImportCsv?: () => void;
  onToggleSidebar?: () => void;
  onShowShortcuts?: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  const router = useRouter();
  const actionsRef = useRef(actions);

  // Update ref inside effect to avoid lint error about refs during render
  useEffect(() => {
    actionsRef.current = actions;
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMeta = e.metaKey || e.ctrlKey;

    // Don't trigger shortcuts when typing in input/textarea/contentEditable
    const target = e.target as HTMLElement;
    const isInputFocused =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    // Cmd/Ctrl+K - Search (always available, handled by TopNav too)
    if (isMeta && e.key === 'k') {
      e.preventDefault();
      actionsRef.current.onSearch?.();
      return;
    }

    // Skip other shortcuts when input is focused
    if (isInputFocused) return;

    // Cmd/Ctrl+N - New License
    if (isMeta && e.key === 'n') {
      e.preventDefault();
      actionsRef.current.onNewLicense?.();
      return;
    }

    // Cmd/Ctrl+I - Import CSV
    if (isMeta && e.key === 'i') {
      e.preventDefault();
      actionsRef.current.onImportCsv?.();
      return;
    }

    // Cmd/Ctrl+. - Toggle Sidebar
    if (isMeta && e.key === '.') {
      e.preventDefault();
      actionsRef.current.onToggleSidebar?.();
      return;
    }

    // Cmd/Ctrl+/ - Show Shortcuts
    if (isMeta && e.key === '/') {
      e.preventDefault();
      actionsRef.current.onShowShortcuts?.();
      return;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
