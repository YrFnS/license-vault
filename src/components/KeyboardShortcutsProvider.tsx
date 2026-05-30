'use client';

import { useState, useCallback } from 'react';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import { useRouter } from '@/i18n/navigation';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  onSearch?: () => void;
}

export function KeyboardShortcutsProvider({ children, onSearch }: KeyboardShortcutsProviderProps) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const router = useRouter();

  const handleSearch = useCallback(() => {
    // Dispatch a custom event that TopNav listens to
    window.dispatchEvent(new CustomEvent('open-search'));
    onSearch?.();
  }, [onSearch]);

  const handleNewLicense = useCallback(() => {
    router.push('/licenses/new');
  }, [router]);

  const handleImportCsv = useCallback(() => {
    router.push('/import');
  }, [router]);

  const handleToggleSidebar = useCallback(() => {
    // Dispatch custom event for sidebar toggle
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  }, []);

  const handleShowShortcuts = useCallback(() => {
    setShortcutsOpen(true);
  }, []);

  useKeyboardShortcuts({
    onSearch: handleSearch,
    onNewLicense: handleNewLicense,
    onImportCsv: handleImportCsv,
    onToggleSidebar: handleToggleSidebar,
    onShowShortcuts: handleShowShortcuts,
  });

  return (
    <>
      {children}
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </>
  );
}
