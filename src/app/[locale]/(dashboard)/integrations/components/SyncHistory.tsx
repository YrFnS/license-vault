import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SyncLogData } from './types';
import { formatTime } from './helpers';
import { useTranslations } from 'next-intl';

interface SyncHistoryProps {
  syncLogs: SyncLogData[];
  isExpanded: boolean;
}

export function SyncHistory({ syncLogs, isExpanded }: SyncHistoryProps) {
  const t = useTranslations('integrations');

  return (
    <AnimatePresence>
      {isExpanded && syncLogs.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-4 py-3 border-t border-border/50 bg-muted/10">
            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-md bg-background/50 border border-border/30"
                  >
                    <div className="flex items-center gap-2">
                      {log.status === 'completed' && <CheckCircle2 className="size-3 text-emerald-500" />}
                      {log.status === 'failed' && <XCircle className="size-3 text-red-500" />}
                      {log.status === 'running' && <Loader2 className="size-3 animate-spin text-amber-500" />}
                      <span className="font-medium capitalize">{log.type}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{log.recordsSynced} records</span>
                      <span>{formatTime(log.startedAt, t)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
