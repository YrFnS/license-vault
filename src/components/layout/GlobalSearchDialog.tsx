'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Key, Users, FileText, MapPin, Loader2 } from 'lucide-react';

interface LicenseResult {
  id: string;
  name: string;
  licenseNumber: string;
  type: string;
  expirationDate: string;
  status: 'active' | 'expiring_soon' | 'expired';
}

interface MemberResult {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
}

interface AuditLogResult {
  id: string;
  action: string;
  entityName: string | null;
  createdAt: string;
}

interface LocationResult {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

interface SearchResults {
  licenses: LicenseResult[];
  licensesHasMore: boolean;
  members: MemberResult[];
  membersHasMore: boolean;
  auditLogs: AuditLogResult[];
  auditLogsHasMore: boolean;
  locations: LocationResult[];
  locationsHasMore: boolean;
}

const emptyResults: SearchResults = {
  licenses: [],
  licensesHasMore: false,
  members: [],
  membersHasMore: false,
  auditLogs: [],
  auditLogsHasMore: false,
  locations: [],
  locationsHasMore: false,
};

function StatusBadgeMini({ status }: { status: string }) {
  const t = useTranslations('licenses.status');
  const config: Record<string, { label: string; className: string }> = {
    active: {
      label: t('active'),
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    },
    expiring_soon: {
      label: t('expiringSoon'),
      className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    },
    expired: {
      label: t('expired'),
      className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    },
  };

  const { label, className: colorClass } = config[status] || config.active;

  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-medium ${colorClass}`}>
      {label}
    </Badge>
  );
}

function RoleBadgeMini({ role }: { role: string }) {
  const t = useTranslations('team.roles');
  const config: Record<string, { label: string; className: string }> = {
    owner: {
      label: t('owner'),
      className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    },
    admin: {
      label: t('admin'),
      className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    },
    member: {
      label: t('member'),
      className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700',
    },
  };

  const { label, className: colorClass } = config[role] || config.member;

  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-medium ${colorClass}`}>
      {label}
    </Badge>
  );
}

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const t = useTranslations('search');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(emptyResults);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setHasSearched(true);
        } else {
          setResults(emptyResults);
          setHasSearched(true);
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setResults(emptyResults);
        setHasSearched(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults(emptyResults);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const hasAnyResults =
    results.licenses.length > 0 ||
    results.members.length > 0 ||
    results.auditLogs.length > 0 ||
    results.locations.length > 0;

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      setQuery('');
      setResults(emptyResults);
      setHasSearched(false);
      router.push(href as any);
    },
    [onOpenChange, router]
  );

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setQuery('');
    setResults(emptyResults);
    setHasSearched(false);
  }, [onOpenChange]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        } else {
          onOpenChange(true);
        }
      }}
      title={t('title')}
      description={t('placeholder')}
      showCloseButton={false}
      className="sm:max-w-lg"
      commandFilter={() => 1}
    >
      <CommandInput
        placeholder={t('placeholder')}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {isSearching && (
          <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>{t('searching')}</span>
          </div>
        )}

        {!isSearching && hasSearched && !hasAnyResults && (
          <CommandEmpty>{t('noResults')}</CommandEmpty>
        )}

        {!isSearching && !hasSearched && query.trim() === '' && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {query.trim() === '' ? t('placeholder') : ''}
          </div>
        )}

        {!isSearching && results.licenses.length > 0 && (
          <CommandGroup heading={`🔑 ${t('licenses')}`}>
            {results.licenses.map((license) => (
              <CommandItem
                key={license.id}
                value={`license-${license.id}`}
                onSelect={() => handleSelect(`/licenses/${license.id}`)}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate font-medium text-sm">{license.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {license.licenseNumber} · {license.type}
                  </span>
                </div>
                <StatusBadgeMini status={license.status} />
              </CommandItem>
            ))}
            {results.licensesHasMore && (
              <CommandItem
                value="licenses-view-all"
                onSelect={() => handleSelect('/licenses')}
                className="text-center text-xs text-primary justify-center cursor-pointer font-medium"
              >
                {t('viewAll')} →
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {!isSearching && results.licenses.length > 0 && results.members.length > 0 && (
          <CommandSeparator />
        )}

        {!isSearching && results.members.length > 0 && (
          <CommandGroup heading={`👥 ${t('team')}`}>
            {results.members.map((member) => (
              <CommandItem
                key={member.id}
                value={`member-${member.id}`}
                onSelect={() => handleSelect('/team')}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate font-medium text-sm">
                    {member.fullName || member.email}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </span>
                </div>
                <RoleBadgeMini role={member.role} />
              </CommandItem>
            ))}
            {results.membersHasMore && (
              <CommandItem
                value="team-view-all"
                onSelect={() => handleSelect('/team')}
                className="text-center text-xs text-primary justify-center cursor-pointer font-medium"
              >
                {t('viewAll')} →
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {!isSearching && (results.licenses.length > 0 || results.members.length > 0) && results.auditLogs.length > 0 && (
          <CommandSeparator />
        )}

        {!isSearching && results.auditLogs.length > 0 && (
          <CommandGroup heading={`📋 ${t('auditLog')}`}>
            {results.auditLogs.map((log) => (
              <CommandItem
                key={log.id}
                value={`audit-${log.id}`}
                onSelect={() => handleSelect('/audit-log')}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate font-medium text-sm capitalize">
                    {log.action} {log.entityName || ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
              </CommandItem>
            ))}
            {results.auditLogsHasMore && (
              <CommandItem
                value="audit-view-all"
                onSelect={() => handleSelect('/audit-log')}
                className="text-center text-xs text-primary justify-center cursor-pointer font-medium"
              >
                {t('viewAll')} →
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {!isSearching && (results.licenses.length > 0 || results.members.length > 0 || results.auditLogs.length > 0) && results.locations.length > 0 && (
          <CommandSeparator />
        )}

        {!isSearching && results.locations.length > 0 && (
          <CommandGroup heading={`📍 ${t('locations')}`}>
            {results.locations.map((location) => (
              <CommandItem
                key={location.id}
                value={`location-${location.id}`}
                onSelect={() => handleSelect('/settings/locations')}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate font-medium text-sm">{location.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {[location.city, location.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              </CommandItem>
            ))}
            {results.locationsHasMore && (
              <CommandItem
                value="locations-view-all"
                onSelect={() => handleSelect('/settings/locations')}
                className="text-center text-xs text-primary justify-center cursor-pointer font-medium"
              >
                {t('viewAll')} →
              </CommandItem>
            )}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
