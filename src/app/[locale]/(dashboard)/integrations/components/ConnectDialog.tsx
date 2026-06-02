import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Plug, Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ICON_MAP, CatalogIntegration } from './types';
import { getDataFlowLabel } from './helpers';

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIntegration: CatalogIntegration | null;
  apiKey: string;
  onApiKeyChange: (val: string) => void;
  baseUrl: string;
  onBaseUrlChange: (val: string) => void;
  syncFrequency: string;
  onSyncFrequencyChange: (val: string) => void;
  dataMappings: Record<string, boolean>;
  onDataMappingsChange: (val: Record<string, boolean>) => void;
  testResult: 'idle' | 'success' | 'failed';
  testMessage: string;
  testing: boolean;
  connecting: boolean;
  onTestConnection: () => void;
  onConnect: () => void;
}

export function ConnectDialog({
  open,
  onOpenChange,
  selectedIntegration,
  apiKey,
  onApiKeyChange,
  baseUrl,
  onBaseUrlChange,
  syncFrequency,
  onSyncFrequencyChange,
  dataMappings,
  onDataMappingsChange,
  testResult,
  testMessage,
  testing,
  connecting,
  onTestConnection,
  onConnect,
}: ConnectDialogProps) {
  const t = useTranslations('integrations');

  if (!selectedIntegration) return null;

  const ConnectIcon = ICON_MAP[selectedIntegration.icon] || (ICON_MAP['Puzzle']!);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ConnectIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
            {t('connect')} {selectedIntegration.name}
          </DialogTitle>
          <DialogDescription>
            {selectedIntegration.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">{t('apiKey')}</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baseUrl">{t('baseUrl')}</Label>
            <Input
              id="baseUrl"
              placeholder="https://api.example.com"
              value={baseUrl}
              onChange={(e) => onBaseUrlChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('syncFrequency')}</Label>
            <Select value={syncFrequency} onValueChange={onSyncFrequencyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">{t('realtime')}</SelectItem>
                <SelectItem value="hourly">{t('hourly')}</SelectItem>
                <SelectItem value="daily">{t('daily')}</SelectItem>
                <SelectItem value="weekly">{t('weekly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('dataMapping')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {selectedIntegration.dataFlows.map((flow) => (
                <label
                  key={flow}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all duration-200',
                    dataMappings[flow]
                      ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20'
                      : 'border-border bg-background hover:bg-muted/50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={dataMappings[flow] || false}
                    onChange={(e) => onDataMappingsChange({ ...dataMappings, [flow]: e.target.checked })}
                    className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium">{getDataFlowLabel(flow, t)}</span>
                </label>
              ))}
            </div>
          </div>

          {testResult !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg text-sm font-medium',
                testResult === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
              )}
            >
              {testResult === 'success' ? (
                <CheckCircle2 className="size-4 shrink-0" />
              ) : (
                <XCircle className="size-4 shrink-0" />
              )}
              {testMessage || (testResult === 'success' ? t('connectionSuccess') : t('connectionFailed'))}
            </motion.div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onTestConnection}
            disabled={testing}
            className="gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
          >
            {testing ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            {t('testConnection')}
          </Button>
          <Button
            onClick={onConnect}
            disabled={connecting}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            {connecting ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
            {t('saveConnect')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
