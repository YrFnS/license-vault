'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ParsedRow {
  name: string;
  licenseNumber: string;
  issuedBy: string;
  issueDate: string;
  expirationDate: string;
  type: string;
  notes: string;
  _valid: boolean;
  _errors: string[];
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function parseCSV(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return { rows: [], errors: ['File must contain at least a header row and one data row'] };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  const normalizedHeaders = headers.map(normalizeHeader);

  // Map headers to our fields
  const fieldMap: Record<string, number> = {};
  const fieldAliases: Record<string, string[]> = {
    name: ['name', 'licensename', 'license_name'],
    licenseNumber: ['licensenumber', 'license_number', 'licenseno', 'license_no', 'number'],
    issuedBy: ['issuedby', 'issued_by', 'issuingauthority', 'issuing_authority', 'authority'],
    issueDate: ['issuedate', 'issue_date', 'dateissued', 'date_issued'],
    expirationDate: ['expirationdate', 'expiration_date', 'expirydate', 'expiry_date', 'expiry', 'expires'],
    type: ['type', 'licensetype', 'license_type', 'category'],
    notes: ['notes', 'note', 'description', 'comments'],
  };

  for (const [field, aliases] of Object.entries(fieldAliases)) {
    for (const alias of aliases) {
      const idx = normalizedHeaders.indexOf(alias);
      if (idx !== -1) {
        fieldMap[field] = idx;
        break;
      }
    }
  }

  // Check required fields
  const missingRequired: string[] = [];
  for (const field of ['name', 'licenseNumber', 'issuedBy', 'issueDate', 'expirationDate']) {
    if (fieldMap[field] === undefined) {
      missingRequired.push(field);
    }
  }

  if (missingRequired.length > 0) {
    return { rows: [], errors: [`Missing required columns: ${missingRequired.join(', ')}`] };
  }

  // Parse data rows
  const rows: ParsedRow[] = [];
  const parseErrors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

    const row: ParsedRow = {
      name: values[fieldMap.name] || '',
      licenseNumber: values[fieldMap.licenseNumber] || '',
      issuedBy: values[fieldMap.issuedBy] || '',
      issueDate: values[fieldMap.issueDate] || '',
      expirationDate: values[fieldMap.expirationDate] || '',
      type: fieldMap.type !== undefined ? values[fieldMap.type] || 'General' : 'General',
      notes: fieldMap.notes !== undefined ? values[fieldMap.notes] || '' : '',
      _valid: true,
      _errors: [],
    };

    // Validate
    if (!row.name) { row._valid = false; row._errors.push('name'); }
    if (!row.licenseNumber) { row._valid = false; row._errors.push('licenseNumber'); }
    if (!row.issuedBy) { row._valid = false; row._errors.push('issuedBy'); }
    if (!row.issueDate) { row._valid = false; row._errors.push('issueDate'); }
    if (!row.expirationDate) { row._valid = false; row._errors.push('expirationDate'); }

    // Try to validate dates
    if (row.issueDate && isNaN(Date.parse(row.issueDate))) {
      row._valid = false;
      row._errors.push('issueDate format');
    }
    if (row.expirationDate && isNaN(Date.parse(row.expirationDate))) {
      row._valid = false;
      row._errors.push('expirationDate format');
    }

    rows.push(row);
  }

  return { rows, errors: parseErrors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

export default function ImportPage() {
  const t = useTranslations('import');
  const locale = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows, errors } = parseCSV(text);
      setParsedRows(rows);
      setParseErrors(errors);
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFile(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    setParsedRows([]);
    setParseErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r._valid);
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setImporting(true);
    let success = 0;
    let failed = 0;

    for (const row of validRows) {
      try {
        const res = await fetch('/api/licenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: row.name,
            type: row.type || 'General',
            licenseNumber: row.licenseNumber,
            issuedBy: row.issuedBy,
            issueDate: new Date(row.issueDate).toISOString(),
            expirationDate: new Date(row.expirationDate).toISOString(),
            notes: row.notes || undefined,
          }),
        });
        if (res.ok) {
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setImporting(false);
    setImportResult({ success, failed });

    if (success > 0) {
      toast.success(t('importSuccess', { count: success }));
    }
    if (failed > 0) {
      toast.error(t('importError'));
    }
  };

  const validCount = parsedRows.filter((r) => r._valid).length;
  const invalidCount = parsedRows.filter((r) => !r._valid).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Upload Area */}
      {!file ? (
        <Card>
          <CardContent className="p-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 md:p-12 text-center transition-colors',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              )}
            >
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  'rounded-full p-4 transition-colors',
                  isDragging ? 'bg-primary/10' : 'bg-muted'
                )}>
                  <Upload className={cn(
                    'size-8',
                    isDragging ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('dragDrop')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('supportedFormats')}</p>
                  <p className="text-xs text-muted-foreground">{t('maxSize')}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('supportedFormats').split(':')[0]}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                <FileSpreadsheet className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{file.name}</CardTitle>
                <CardDescription className="text-xs">
                  {(file.size / 1024).toFixed(1)} KB
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFile}>
              <X className="size-4 me-1" />
              {t('clearFile')}
            </Button>
          </CardHeader>
        </Card>
      )}

      {/* Parse Errors */}
      {parseErrors.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            {parseErrors.map((error, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Required/Optional columns info */}
      {!file && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{t('requiredColumns')}</p>
              <p className="text-xs text-muted-foreground">{t('optionalColumns')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{t('preview')}</CardTitle>
              <Badge variant="secondary" className="text-xs">{parsedRows.length}</Badge>
              {validCount > 0 && (
                <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">
                  <CheckCircle2 className="size-3 me-1" />
                  {validCount}
                </Badge>
              )}
              {invalidCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="size-3 me-1" />
                  {invalidCount}
                </Badge>
              )}
            </div>
            <Button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              {importing ? (
                <>
                  <Loader2 className="size-4 me-1 animate-spin" />
                  {t('importing')}
                </>
              ) : (
                t('startImport')
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>License #</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Exp. Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-8">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, i) => (
                    <TableRow key={i} className={!row._valid ? 'bg-red-50/50 dark:bg-red-950/10' : ''}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className={cn('text-sm', !row.name && 'text-red-400')}>{row.name || '—'}</TableCell>
                      <TableCell className={cn('text-sm', !row.licenseNumber && 'text-red-400')}>{row.licenseNumber || '—'}</TableCell>
                      <TableCell className={cn('text-sm', !row.issuedBy && 'text-red-400')}>{row.issuedBy || '—'}</TableCell>
                      <TableCell className={cn('text-sm', !row.issueDate && 'text-red-400')}>{row.issueDate || '—'}</TableCell>
                      <TableCell className={cn('text-sm', !row.expirationDate && 'text-red-400')}>{row.expirationDate || '—'}</TableCell>
                      <TableCell className="text-sm">{row.type}</TableCell>
                      <TableCell>
                        {row._valid ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="size-4 text-red-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card className={importResult.failed > 0 ? 'border-amber-200 dark:border-amber-800' : 'border-emerald-200 dark:border-emerald-800'}>
          <CardContent className="p-6 text-center">
            <CheckCircle2 className={cn(
              'size-12 mx-auto mb-3',
              importResult.failed > 0 ? 'text-amber-500' : 'text-emerald-500'
            )} />
            <p className="font-medium">
              {t('importSuccess', { count: importResult.success })}
            </p>
            {importResult.failed > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {importResult.failed} row(s) failed to import.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
