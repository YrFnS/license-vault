import { motion } from 'framer-motion';
import { Plug, ArrowRightLeft, Puzzle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { CatalogIntegration, ICON_MAP, fadeIn } from './types';
import { getDataFlowLabel } from './helpers';
import { CategoryBadge } from './CategoryBadge';

interface AvailableIntegrationCardProps {
  integration: CatalogIntegration;
  idx: number;
  onConnect: (integration: CatalogIntegration) => void;
}

export function AvailableIntegrationCard({
  integration,
  idx,
  onConnect,
}: AvailableIntegrationCardProps) {
  const t = useTranslations('integrations');
  const Icon = ICON_MAP[integration.icon] || Puzzle;

  return (
    <motion.div
      key={integration.type}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, delay: idx * 0.05 }}
    >
      <Card className="shadow-sm hover:shadow-md transition-all duration-300 group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-muted/80 to-muted/40 group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-all duration-300 shrink-0">
                <Icon className="size-5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm">{integration.name}</h3>
                <CategoryBadge category={integration.category} />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{integration.description}</p>
          {/* Data Flow Indicators */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {integration.dataFlows.map((flow) => (
              <span
                key={flow}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border/50"
              >
                <ArrowRightLeft className="size-2.5" />
                {getDataFlowLabel(flow, t)}
              </span>
            ))}
          </div>
          <Button
            className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm text-xs h-8"
            onClick={() => onConnect(integration)}
          >
            <Plug className="size-3" />
            {t('connect')}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
