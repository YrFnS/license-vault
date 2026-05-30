'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DocumentScanner, ScanTips } from '@/components/documents/DocumentScanner';
import { Badge } from '@/components/ui/badge';
import { ScanSearch, Sparkles } from 'lucide-react';

interface ScanHistoryItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  extractedData: Record<string, unknown>;
  rawText: string | null;
  confidence: number;
  status: string;
  createdAt: string;
}

export default function DocumentScanPage() {
  const t = useTranslations('documentScanner');
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/documents/scan');
        if (response.ok) {
          const data = await response.json();
          setScanHistory(data.scans || []);
        }
      } catch {
        // Silently fail - history is non-critical
      } finally {
        setHistoryLoaded(true);
      }
    }

    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 text-white shadow-md shadow-emerald-500/25">
            <ScanSearch className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-400/20 text-[10px] px-2 py-0.5 font-bold">
                <Sparkles className="size-3 me-1" />
                AI
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{t('description')}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <DocumentScanner scanHistory={historyLoaded ? scanHistory : []} />
        </div>

        {/* Tips Sidebar */}
        <div className="space-y-4">
          <ScanTips />
        </div>
      </div>
    </div>
  );
}
