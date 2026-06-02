import { useTranslations } from 'next-intl';
import { Link2, Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { IntegrationData, CatalogIntegration, fadeIn } from './types';
import { EmptyAllConnected, EmptyNoIntegrations } from './EmptyStates';
import { matchesCategory } from './helpers';
import { IntegrationCard } from './IntegrationCard';
import { AvailableIntegrationCard } from './AvailableIntegrationCard';

interface CategoryTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  integrations: IntegrationData[];
  catalog: CatalogIntegration[];
  expandedIntegration: string | null;
  onToggleExpand: (id: string) => void;
  syncingIds: Set<string>;
  onSync: (integration: IntegrationData) => void;
  onDisconnect: (integration: IntegrationData) => void;
  onConnect: (integration: CatalogIntegration) => void;
}

export function CategoryTabs({
  activeTab,
  onTabChange,
  integrations,
  catalog,
  expandedIntegration,
  onToggleExpand,
  syncingIds,
  onSync,
  onDisconnect,
  onConnect,
}: CategoryTabsProps) {
  const t = useTranslations('integrations');

  const filteredIntegrations = integrations.filter((i) => matchesCategory(i.category, activeTab));

  const filteredAvailable = catalog
    .filter((i) => matchesCategory(i.category, activeTab))
    .filter((i) => !integrations.some((existing) => existing.type === i.type));

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm">{t('all')}</TabsTrigger>
          <TabsTrigger value="construction_erp" className="text-xs sm:text-sm">{t('constructionErp')}</TabsTrigger>
          <TabsTrigger value="accounting" className="text-xs sm:text-sm">{t('accounting')}</TabsTrigger>
          <TabsTrigger value="hris" className="text-xs sm:text-sm">{t('hrPayroll')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Connected Integrations */}
          {filteredIntegrations.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Link2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                Connected
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIntegrations.map((integration, idx) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    idx={idx}
                    catalog={catalog}
                    isExpanded={expandedIntegration === integration.id}
                    isSyncing={syncingIds.has(integration.id)}
                    onToggleExpand={onToggleExpand}
                    onSync={onSync}
                    onDisconnect={onDisconnect}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Integrations */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search className="size-5 text-teal-600 dark:text-teal-400" />
              Available
            </h2>
            {filteredAvailable.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAvailable.map((integration, idx) => (
                  <AvailableIntegrationCard
                    key={integration.type}
                    integration={integration}
                    idx={idx}
                    onConnect={onConnect}
                  />
                ))}
              </div>
            ) : filteredIntegrations.length > 0 ? (
              <EmptyAllConnected />
            ) : (
              <EmptyNoIntegrations />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}


