'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Map route segments to translation keys
const routeLabelMap: Record<string, string> = {
  dashboard: 'dashboard',
  licenses: 'licenses',
  calendar: 'calendar',
  projects: 'projects',
  subcontractors: 'subcontractors',
  approvals: 'approvals',
  qualifiers: 'qualifiers',
  'ce-tracking': 'ceTracking',
  insurance: 'insurance',
  team: 'team',
  alerts: 'alerts',
  'audit-log': 'auditLog',
  settings: 'settings',
  admin: 'admin',
  reports: 'reports',
  'state-requirements': 'stateRequirements',
  'ai-chat': 'aiChat',
  import: 'import',
  locations: 'locations',
  api: 'apiWebhooks',
  profile: 'profile',
  onboarding: 'onboarding',
  notifications: 'notifications',
};

export function Breadcrumbs() {
  const t = useTranslations('common');
  const pathname = usePathname();

  // Extract path segments after locale
  const segments = pathname.split('/').filter(Boolean);
  // Remove locale segment (e.g., 'en' or 'ar')
  const locale = segments[0];
  const pathSegments = segments.slice(1);

  if (pathSegments.length === 0) return null;

  const items: BreadcrumbItem[] = [
    { label: t('home'), href: '/dashboard' },
  ];

  let currentPath = '';
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    currentPath += `/${segment}`;

    // Skip dynamic segments (IDs)
    if (segment.startsWith('[') || (segment.length > 10 && i === pathSegments.length - 1 && /^[a-zA-Z0-9]+$/.test(segment))) {
      continue;
    }

    const labelKey = routeLabelMap[segment];
    const label = labelKey ? t(labelKey) : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    const isLast = i === pathSegments.length - 1;

    items.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground overflow-hidden">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1 min-w-0">
            {index > 0 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40 rtl:rotate-180" />
            )}
            {isFirst && (
              <Home className="size-3.5 shrink-0 text-muted-foreground/60" />
            )}
            {isLast ? (
              <span className="font-semibold text-foreground truncate max-w-[200px]">
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200 truncate max-w-[120px]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="truncate max-w-[200px]">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
