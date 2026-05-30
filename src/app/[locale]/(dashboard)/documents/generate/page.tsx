'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilePenLine,
  FileText,
  Copy,
  Download,
  Printer,
  RefreshCw,
  ChevronDown,
  Eye,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

const TEMPLATES = [
  { key: 'renewal_letter', icon: '📋' },
  { key: 'compliance_certificate', icon: '✅' },
  { key: 'board_letter', icon: '📨' },
  { key: 'notice_to_proceed', icon: '🏗️' },
  { key: 'vendor_questionnaire', icon: '📝' },
  { key: 'custom', icon: '✨' },
];

interface TemplateField {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

interface HistoryItem {
  id: string;
  template: string;
  inputData: string;
  format: string;
  createdAt: string;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function DocumentGeneratorPage() {
  const t = useTranslations('documentGenerator');
  const tc = useTranslations('common');

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [format, setFormat] = useState<'html' | 'text'>('html');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch template fields when template changes
  useEffect(() => {
    if (selectedTemplate) {
      fetchTemplateFields(selectedTemplate);
    } else {
      setFields([]);
    }
    setFormData({});
    setGeneratedContent('');
  }, [selectedTemplate]);

  const fetchTemplateFields = async (template: string) => {
    try {
      // Fields are defined client-side based on template
      const templateFieldsMap: Record<string, TemplateField[]> = {
        renewal_letter: [
          { key: 'orgName', label: 'Organization Name', type: 'text', required: true },
          { key: 'licenseName', label: 'License Name', type: 'text', required: true },
          { key: 'licenseNumber', label: 'License Number', type: 'text', required: true },
          { key: 'boardName', label: 'Board Name', type: 'text', required: true },
          { key: 'state', label: 'State', type: 'text', required: true },
          { key: 'renewalPeriod', label: 'Renewal Period', type: 'text', required: true },
          { key: 'expirationDate', label: 'Current Expiration Date', type: 'date', required: true },
          { key: 'contactName', label: 'Contact Name', type: 'text', required: false },
          { key: 'contactEmail', label: 'Contact Email', type: 'text', required: false },
          { key: 'additionalNotes', label: 'Additional Notes', type: 'textarea', required: false },
        ],
        compliance_certificate: [
          { key: 'orgName', label: 'Organization Name', type: 'text', required: true },
          { key: 'projectName', label: 'Project Name', type: 'text', required: true },
          { key: 'projectLocation', label: 'Project Location', type: 'text', required: false },
          { key: 'complianceScore', label: 'Compliance Score', type: 'text', required: false },
          { key: 'dateRange', label: 'Date Range', type: 'text', required: false },
          { key: 'authorizedName', label: 'Authorized Person Name', type: 'text', required: true },
          { key: 'authorizedTitle', label: 'Title', type: 'text', required: false },
          { key: 'additionalInfo', label: 'Additional Information', type: 'textarea', required: false },
        ],
        board_letter: [
          { key: 'boardName', label: 'Board Name', type: 'text', required: true },
          { key: 'subject', label: 'Subject', type: 'text', required: true },
          { key: 'orgName', label: 'Organization Name', type: 'text', required: true },
          { key: 'licenseName', label: 'License Name', type: 'text', required: false },
          { key: 'licenseNumber', label: 'License Number', type: 'text', required: false },
          { key: 'state', label: 'State', type: 'text', required: true },
          { key: 'bodyContent', label: 'Letter Body / Key Points', type: 'textarea', required: true },
          { key: 'contactName', label: 'Contact Name', type: 'text', required: false },
        ],
        notice_to_proceed: [
          { key: 'projectName', label: 'Project Name', type: 'text', required: true },
          { key: 'projectLocation', label: 'Project Location', type: 'text', required: false },
          { key: 'subcontractorName', label: 'Subcontractor Name', type: 'text', required: true },
          { key: 'startDate', label: 'Start Date', type: 'date', required: true },
          { key: 'scopeOfWork', label: 'Scope of Work', type: 'textarea', required: true },
          { key: 'completionDate', label: 'Completion Date', type: 'date', required: false },
          { key: 'contractAmount', label: 'Contract Amount', type: 'text', required: false },
          { key: 'specialConditions', label: 'Special Conditions', type: 'textarea', required: false },
          { key: 'issuedBy', label: 'Issued By', type: 'text', required: true },
        ],
        vendor_questionnaire: [
          { key: 'orgName', label: 'Organization Name', type: 'text', required: true },
          { key: 'tradeType', label: 'Trade Type', type: 'text', required: true },
          { key: 'statesOfOperation', label: 'States of Operation', type: 'text', required: true },
          { key: 'yearsInBusiness', label: 'Years in Business', type: 'text', required: false },
          { key: 'licenseCount', label: 'Number of Active Licenses', type: 'text', required: false },
          { key: 'insuranceProvider', label: 'Insurance Provider', type: 'text', required: false },
          { key: 'insuranceAmount', label: 'Insurance Coverage Amount', type: 'text', required: false },
          { key: 'references', label: 'References (3 minimum)', type: 'textarea', required: false },
        ],
        custom: [
          { key: 'prompt', label: 'Custom Prompt', type: 'textarea', required: true },
        ],
      };
      setFields(templateFieldsMap[template] || []);
    } catch {
      setFields([]);
    }
  };

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/documents/generate/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.documents || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleGenerate = async () => {
    // Validate required fields
    const missingRequired = fields
      .filter(f => f.required && !formData[f.key]?.trim())
      .map(f => f.label);
    if (missingRequired.length > 0) {
      toast.error(`Required fields: ${missingRequired.join(', ')}`);
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate,
          data: formData,
          format,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedContent(data.document.content);
        toast.success(t('generate'));
        fetchHistory();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to generate document');
      }
    } catch {
      toast.error('Failed to generate document');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success(t('copyContent'));
  };

  const handleDownload = () => {
    const ext = format === 'html' ? 'html' : 'txt';
    const mimeType = format === 'html' ? 'text/html' : 'text/plain';
    const blob = new Blob([generatedContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate.replace(/_/g, '-')}-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('downloadHtml'));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(format === 'html' ? generatedContent : `<pre>${generatedContent}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-emerald-600 dark:to-emerald-400 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* Template Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('selectTemplate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {TEMPLATES.map(tpl => {
                  const templateKey = tpl.key as string;
                  const templateName = t(tpl.key as any);
                  return (
                    <button
                      key={tpl.key}
                      onClick={() => setSelectedTemplate(tpl.key)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all text-center',
                        selectedTemplate === tpl.key
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm ring-1 ring-emerald-500/20'
                          : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-muted/50',
                      )}
                    >
                      <span className="text-lg">{tpl.icon}</span>
                      <span className="text-[10px] font-medium leading-tight">
                        {templateName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Form Fields */}
          {selectedTemplate && fields.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{t('templateData')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fields.map(field => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500 ms-0.5">*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          value={formData[field.key] || ''}
                          onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.label}
                          rows={3}
                          className="text-sm"
                        />
                      ) : (
                        <Input
                          type={field.type === 'date' ? 'date' : 'text'}
                          value={formData[field.key] || ''}
                          onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.label}
                          className="text-sm"
                        />
                      )}
                    </div>
                  ))}

                  <Separator className="my-3" />

                  {/* Format selection */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t('format')}</Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFormat('html')}
                        className={cn(
                          'flex-1 py-2 text-xs font-medium rounded-lg border transition-all',
                          format === 'html'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                            : 'border-border hover:bg-muted/50 text-muted-foreground',
                        )}
                      >
                        HTML
                      </button>
                      <button
                        onClick={() => setFormat('text')}
                        className={cn(
                          'flex-1 py-2 text-xs font-medium rounded-lg border transition-all',
                          format === 'text'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                            : 'border-border hover:bg-muted/50 text-muted-foreground',
                        )}
                      >
                        Text
                      </button>
                    </div>
                  </div>

                  {/* Generate button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white mt-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {t('generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        {t('generate')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* History */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{t('generationHistory')}</CardTitle>
                <Button variant="ghost" size="sm" onClick={fetchHistory} className="size-7">
                  <RefreshCw className={cn('size-3.5', loadingHistory && 'animate-spin')} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="size-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">{t('noHistory')}</p>
                </div>
              ) : (
                <ScrollArea className="max-h-48">
                  <div className="space-y-1.5">
                    {history.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <FileText className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {t(item.template as any) || item.template.replace(/_/g, ' ')}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {item.format?.toUpperCase()}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{t('preview')}</CardTitle>
                {generatedContent && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="size-7 gap-1">
                      <Copy className="size-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownload} className="size-7 gap-1">
                      <Download className="size-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handlePrint} className="size-7 gap-1">
                      <Printer className="size-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!generatedContent ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FilePenLine className="size-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Select a template and fill in the details to generate a document
                  </p>
                </div>
              ) : format === 'html' ? (
                <ScrollArea className="max-h-[calc(100vh-350px)]">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generatedContent) }}
                  />
                </ScrollArea>
              ) : (
                <ScrollArea className="max-h-[calc(100vh-350px)]">
                  <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/30 p-4 rounded-lg">
                    {generatedContent}
                  </pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
