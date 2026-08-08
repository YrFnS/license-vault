import Image from "next/image";
import React from "react";
import { ICON_MAP, CatalogIntegration } from './types';

export function CatalogIcon({
  integration,
  className = "size-5",
}: {
  integration: Pick<CatalogIntegration, "icon" | "iconUrl" | "name">;
  className?: string;
}) {
  if (integration.iconUrl) {
    return React.createElement(Image, {
      src: integration.iconUrl,
      alt: `${integration.name} logo`,
      width: 20,
      height: 20,
      className,
    });
  }

  const Icon = ICON_MAP[integration.icon] ?? ICON_MAP.Puzzle;
  return Icon ? React.createElement(Icon, { className }) : null;
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
