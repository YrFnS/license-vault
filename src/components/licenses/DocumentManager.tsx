'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  FileIcon,
  Download,
  Trash2,
  Eye,
  User,
  Loader2,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentData {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileSizeFormatted: string;
  category: string;
  uploadedBy: string | null;
  createdAt: string;
}

interface DocumentManagerProps {
  licenseId: string;
  userRole: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DOCUMENT_CATEGORIES = [
  'license_copy',
  'coi',
  'bond',
  'ce_certificate',
  'correspondence',
  'other',
] as const;

function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'pdf':
      return <FileText className="size-4 text-red-500 dark:text-red-400" />;
    case 'doc':
    case 'docx':
      return <FileSpreadsheet className="size-4 text-teal-600 dark:text-teal-400" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <ImageIcon className="size-4 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <FileIcon className="size-4 text-muted-foreground" />;
  }
}

function getCategoryBadgeStyle(category: string) {
  switch (category) {
    case 'license_copy':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'coi':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
    case 'bond':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'ce_certificate':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400';
    case 'correspondence':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

export function DocumentManager({ licenseId, userRole }: DocumentManagerProps) {
  const t = useTranslations('licenses');
  const tD = useTranslations('licenses.documents');
  const tc = useTranslations('common');

  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('license_copy');
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deleteDocName, setDeleteDocName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canDelete = userRole === 'owner' || userRole === 'admin';
  const canUpload = userRole === 'owner' || userRole === 'admin';

  const fetchDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      const res = await fetch(`/api/licenses/${licenseId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      // Silently fail
    } finally {
      setDocumentsLoading(false);
    }
  }, [licenseId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const validateFile = useCallback((file: File): string | null => {
    // Validate file type
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isMimeTypeAllowed = ALLOWED_TYPES.includes(file.type);
    const isExtAllowed = ALLOWED_EXTENSIONS.includes(extension);

    if (!isMimeTypeAllowed && !isExtAllowed) {
      return tD('invalidFileType');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return tD('fileTooLarge');
    }

    return null;
  }, [tD]);

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadingDoc(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', selectedCategory);

      // Simulate progress since fetch doesn't support upload progress natively
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      const res = await fetch(`/api/licenses/${licenseId}/documents`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload document');
      }

      // Small delay to show 100% completion
      await new Promise((r) => setTimeout(r, 300));

      toast.success(tD('uploadSuccess'));
      fetchDocuments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tD('uploadError'));
    } finally {
      setUploadingDoc(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [licenseId, fetchDocuments, selectedCategory, validateFile, tD]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, [uploadFile]);

  const handleDocumentView = useCallback((docId: string) => {
    window.open(`/api/licenses/${licenseId}/documents/${docId}`, '_blank');
  }, [licenseId]);

  const handleDocumentDownload = useCallback((docId: string) => {
    const link = document.createElement('a');
    link.href = `/api/licenses/${licenseId}/documents/${docId}`;
    link.target = '_blank';
    link.click();
  }, [licenseId]);

  const handleDocumentDelete = useCallback(async (docId: string, docName: string) => {
    try {
      const res = await fetch(`/api/licenses/${licenseId}/documents/${docId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete document');
      }
      toast.success(tD('deleteSuccess', { name: docName }));
      fetchDocuments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeleteDocId(null);
      setDeleteDocName('');
    }
  }, [licenseId, fetchDocuments, tD]);

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileIcon className="size-5 text-primary" />
          {tD('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        {canUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileUpload}
            />

            {/* Category Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground shrink-0">
                {tD('category')}:
              </span>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {tD(`category_${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drag & Drop Zone */}
            <motion.div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploadingDoc && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                isDragOver
                  ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]'
                  : uploadingDoc
                    ? 'border-emerald-300 dark:border-emerald-700 opacity-60 pointer-events-none'
                    : 'border-muted-foreground/25 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 cursor-pointer'
              }`}
              animate={isDragOver ? { scale: 1.01 } : { scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`rounded-full p-3 transition-colors duration-200 ${
                  isDragOver
                    ? 'bg-emerald-100 dark:bg-emerald-900/40'
                    : 'bg-emerald-50 dark:bg-emerald-950/30'
                }`}>
                  {uploadingDoc ? (
                    <Loader2 className="size-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  ) : isDragOver ? (
                    <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Upload className="size-6 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {uploadingDoc
                      ? tD('uploading')
                      : isDragOver
                        ? tD('dropHere')
                        : tD('uploadArea')
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tD('uploadHint')}
                  </p>
                </div>

                {/* Upload Progress Bar */}
                <AnimatePresence>
                  {uploadingDoc && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full max-w-xs"
                    >
                      <div className="h-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 text-center">
                        {uploadProgress}%
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}

        {/* Document List */}
        {documentsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-2">
            {/* Header row - Desktop only */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_120px_100px_80px_100px] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>{tD('fileName')}</span>
              <span>{tD('categoryLabel')}</span>
              <span>{tD('uploadedDate')}</span>
              <span>{tD('fileSize')}</span>
              <span>{tD('actions')}</span>
            </div>
            <Separator />

            {/* Document rows */}
            <div className="space-y-1">
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  {/* Desktop Layout */}
                  <div className="hidden lg:grid lg:grid-cols-[1fr_120px_100px_80px_100px] gap-3 items-center px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors duration-150 group">
                    {/* File name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-1.5">
                        {getFileIcon(doc.fileType)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium truncate block">{doc.fileName}</span>
                        {doc.uploadedBy && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="size-2.5" />
                            {doc.uploadedBy}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Category */}
                    <Badge
                      variant="secondary"
                      className={`text-xs justify-self-start ${getCategoryBadgeStyle(doc.category)}`}
                    >
                      {tD(`category_${doc.category}` as 'category_license_copy')}
                    </Badge>
                    {/* Uploaded date */}
                    <span className="text-xs text-muted-foreground">
                      {formatShortDate(doc.createdAt)}
                    </span>
                    {/* File size */}
                    <span className="text-xs text-muted-foreground">
                      {doc.fileSizeFormatted}
                    </span>
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                        onClick={() => handleDocumentDownload(doc.id)}
                      >
                        <Download className="size-3" />
                        {tD('download')}
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          onClick={() => {
                            setDeleteDocId(doc.id);
                            setDeleteDocName(doc.fileName);
                          }}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mobile / Tablet Card Layout */}
                  <div className="lg:hidden rounded-lg border p-4 space-y-3 group">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                        {getFileIcon(doc.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium truncate">{doc.fileName}</span>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] shrink-0 ${getCategoryBadgeStyle(doc.category)}`}
                          >
                            {tD(`category_${doc.category}` as 'category_license_copy')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {formatShortDate(doc.createdAt)}
                          </span>
                          <span className="text-xs text-muted-foreground/40">·</span>
                          <span className="text-xs text-muted-foreground">
                            {doc.fileSizeFormatted}
                          </span>
                          {doc.uploadedBy && (
                            <>
                              <span className="text-xs text-muted-foreground/40">·</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <User className="size-2.5" />
                                {doc.uploadedBy}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Mobile actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs gap-1.5 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"
                        onClick={() => handleDocumentView(doc.id)}
                      >
                        <Eye className="size-3" />
                        {tD('view')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs gap-1.5"
                        onClick={() => handleDocumentDownload(doc.id)}
                      >
                        <Download className="size-3" />
                        {tD('download')}
                      </Button>
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 text-xs gap-1.5 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800 ms-auto"
                          onClick={() => {
                            setDeleteDocId(doc.id);
                            setDeleteDocName(doc.fileName);
                          }}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 p-5 mb-4">
              <Upload className="size-10 text-emerald-400 dark:text-emerald-500" />
            </div>
            <p className="font-medium text-foreground">{tD('noDocuments')}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {tD('noDocumentsDesc')}
            </p>
            {canUpload && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-2 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-3.5" />
                {tD('uploadFirst')}
              </Button>
            )}
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteDocId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteDocId(null);
              setDeleteDocName('');
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="size-5 text-red-500" />
                {tD('deleteConfirmTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {tD('deleteConfirmDesc', { name: deleteDocName })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteDocId) {
                    handleDocumentDelete(deleteDocId, deleteDocName);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {tD('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
