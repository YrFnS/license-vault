'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool, CheckCircle2, XCircle, AlertTriangle, Clock, Shield,
  FileText, Eye, Type, Eraser, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface SignatureRequestData {
  id: string;
  documentTitle: string;
  documentType: string;
  documentContent: string | null;
  requestedToName: string;
  requestedToEmail: string;
  message: string | null;
  status: string;
  signedAt: string | null;
  declinedAt: string | null;
  declinedReason: string | null;
  expiresAt: string | null;
  signatureData: string | null;
  signerName: string | null;
  signerTitle: string | null;
  auditTrail: string | null;
  createdAt: string;
  org?: { name: string; tradeType: string };
}

type SignatureMode = 'draw' | 'type';

export default function SignDocumentPage() {
  const params = useParams();
  const token = params.token as string;

  const [requestData, setRequestData] = useState<SignatureRequestData | null>(null);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);

  // Signature state
  const [sigMode, setSigMode] = useState<SignatureMode>('draw');
  const [typedSig, setTypedSig] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);

  // Decline state
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/signatures/sign/${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load');
      }
      const data = await res.json();
      setRequestData(data.request);
      setOrgName(data.org?.name || '');
      setExpired(data.expired || false);

      if (data.request.status === 'signed') {
        setSigned(true);
      }

      // Pre-fill signer name from request
      if (data.request.requestedToName) {
        setSignerName(data.request.requestedToName);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Canvas drawing setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1a1a1a';
  }, [sigMode]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const getSignatureValue = (): string => {
    if (sigMode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return '';
      return canvas.toDataURL('image/png');
    }
    return typedSig;
  };

  const handleSign = async () => {
    if (!signerName.trim()) {
      return;
    }
    const sigValue = getSignatureValue();
    if (!sigValue || (sigMode === 'type' && !typedSig.trim())) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/signatures/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureType: sigMode,
          signatureValue: sigValue,
          signerName,
          signerTitle,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to sign');
      }

      setSigned(true);
      setConfirmOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      const res = await fetch(`/api/signatures/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline', reason: declineReason }),
      });
      if (!res.ok) throw new Error('Failed to decline');
      setDeclineOpen(false);
      setError('declined');
    } catch (err) {
      setError('Failed to decline');
    } finally {
      setDeclining(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error / Not found state
  if (error === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="py-12 text-center">
            <XCircle className="size-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold">Document Declined</h2>
            <p className="text-muted-foreground mt-2">You have declined this signature request.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !requestData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="size-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold">Error</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!requestData) return null;

  // Expired state
  if (expired || requestData.status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="py-12 text-center">
            <Clock className="size-16 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-bold">Signature Expired</h2>
            <p className="text-muted-foreground mt-2">This signature request has expired. Please contact the requester for a new one.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cancelled state
  if (requestData.status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="py-12 text-center">
            <XCircle className="size-16 mx-auto text-slate-500 mb-4" />
            <h2 className="text-xl font-bold">Request Cancelled</h2>
            <p className="text-muted-foreground mt-2">This signature request has been cancelled by the sender.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already signed state
  if (signed || requestData.status === 'signed') {
    const sigData = requestData.signatureData ? JSON.parse(requestData.signatureData) : null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="shadow-lg border-emerald-200 dark:border-emerald-800">
            <CardContent className="py-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <CheckCircle2 className="size-20 mx-auto text-emerald-500 mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold">Document Signed</h2>
              <p className="text-muted-foreground mt-2">
                This document has been successfully signed on {formatDate(requestData.signedAt)}.
              </p>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg text-start">
                <p className="text-sm font-medium">{requestData.documentTitle}</p>
                <p className="text-sm text-muted-foreground mt-1">Signed by: {requestData.signerName}</p>
                {requestData.signerTitle && <p className="text-sm text-muted-foreground">Title: {requestData.signerTitle}</p>}
                {sigData && sigData.type === 'draw' && (
                  <div className="mt-3">
                    <img src={sigData.value} alt="Signature" className="h-16 bg-white dark:bg-slate-800 rounded border p-1" />
                  </div>
                )}
                {sigData && sigData.type === 'type' && (
                  <p className="mt-2 text-2xl italic font-serif">{sigData.value}</p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="size-3.5" />
                <span>Secured by LicenseVault E-Signatures</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Already declined
  if (requestData.status === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="py-12 text-center">
            <XCircle className="size-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold">Document Declined</h2>
            <p className="text-muted-foreground mt-2">This signature request has been declined.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main signing view
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
              <PenTool className="size-4" />
            </div>
            <span className="font-bold text-sm">LicenseVault E-Sign</span>
          </div>
          <Badge variant="outline" className="text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
            <Shield className="size-3 me-1" />
            Secure
          </Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Document Info */}
          <Card className="shadow-md border-emerald-100 dark:border-emerald-900/50">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{requestData.documentTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Requested by <span className="font-medium">{orgName}</span>
                  </p>
                </div>
                <Badge variant="outline" className={cn(
                  'shrink-0',
                  requestData.status === 'pending' ? 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400' :
                  'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400'
                )}>
                  {requestData.status === 'pending' ? <Clock className="size-3 me-1" /> : <Eye className="size-3 me-1" />}
                  {requestData.status === 'pending' ? 'Pending' : 'Viewed'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {requestData.message && (
                <div className="p-3 bg-muted/50 rounded-lg mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Message:</p>
                  <p className="text-sm">{requestData.message}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  To: {requestData.requestedToName} ({requestData.requestedToEmail})
                </span>
                {requestData.expiresAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    Expires: {formatDate(requestData.expiresAt)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Content */}
          {requestData.documentContent && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Document Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(requestData.documentContent) }}
                />
              </CardContent>
            </Card>
          )}

          {/* Signature Area */}
          <Card className="shadow-md border-emerald-100 dark:border-emerald-900/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <PenTool className="size-5 text-emerald-600" />
                Your Signature
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={sigMode === 'draw' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSigMode('draw')}
                  className={cn(
                    sigMode === 'draw' && 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                  )}
                >
                  <PenTool className="size-3.5 me-1.5" />
                  Draw
                </Button>
                <Button
                  variant={sigMode === 'type' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSigMode('type')}
                  className={cn(
                    sigMode === 'type' && 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                  )}
                >
                  <Type className="size-3.5 me-1.5" />
                  Type
                </Button>
              </div>

              {/* Draw Signature Pad */}
              {sigMode === 'draw' && (
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-lg overflow-hidden bg-white dark:bg-slate-800 relative">
                    <canvas
                      ref={canvasRef}
                      className="w-full touch-none cursor-crosshair"
                      style={{ height: '180px' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    {!hasDrawn && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-muted-foreground/40 text-sm">Draw your signature here</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCanvas}
                    disabled={!hasDrawn}
                  >
                    <Eraser className="size-3.5 me-1.5" />
                    Clear
                  </Button>
                </div>
              )}

              {/* Type Signature */}
              {sigMode === 'type' && (
                <div className="space-y-2">
                  <Input
                    placeholder="Type your name"
                    value={typedSig}
                    onChange={(e) => setTypedSig(e.target.value)}
                    className="text-lg"
                  />
                  {typedSig && (
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border text-center">
                      <p className="text-3xl italic font-serif text-foreground">{typedSig}</p>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Signer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signerName">Full Name *</Label>
                  <Input
                    id="signerName"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signerTitle">Title / Position</Label>
                  <Input
                    id="signerTitle"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    placeholder="e.g., Project Manager"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={
                !signerName.trim() ||
                (sigMode === 'draw' && !hasDrawn) ||
                (sigMode === 'type' && !typedSig.trim())
              }
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-12 text-base font-semibold shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="size-5 me-2" />
              Sign Document
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeclineOpen(true)}
              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 h-12"
            >
              <XCircle className="size-5 me-2" />
              Decline
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground/60 pb-8">
            <div className="flex items-center justify-center gap-1.5">
              <Shield className="size-3" />
              <span>Your signature is legally binding and secured with audit trail</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Confirm Sign Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Signature</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign this document? This action is legally binding and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm font-medium">{requestData.documentTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">Signing as: {signerName}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSign}
              disabled={submitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              {submitting ? <Loader2 className="size-4 me-2 animate-spin" /> : <CheckCircle2 className="size-4 me-2" />}
              {submitting ? 'Signing...' : 'Confirm & Sign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline to Sign</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this signature request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Reason for declining (optional)"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDecline}
              disabled={declining}
              variant="destructive"
            >
              {declining ? <Loader2 className="size-4 me-2 animate-spin" /> : <XCircle className="size-4 me-2" />}
              {declining ? 'Declining...' : 'Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
