import { ICON_MAP, CatalogIntegration } from './types';

export function getIntegrationIcon(type: string, catalog: CatalogIntegration[]) {
  const found = catalog.find((i) => i.type === type);
  if (found && ICON_MAP[found.icon]) return ICON_MAP[found.icon];
  const Puzzle = ICON_MAP['Puzzle'];
  return Puzzle!;
}

export function getDataFlowLabel(flow: string, t: (key: string) => string): string {
  switch (flow) {
    case 'licenses': return t('licenses');
    case 'projects': return t('projects');
    case 'contractors': return t('contractors');
    case 'documents': return t('documents');
    default: return flow;
  }
}

export function formatTime(dateStr: string | null, t: (key: string) => string): string {
  if (!dateStr) return t('never');
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function matchesCategory(
  category: string,
  activeTab: string
): boolean {
  if (activeTab === 'all') return true;
  return category === activeTab;
}
