'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Award,
  Phone,
  Mail,
  ArrowRight,
  Loader2,
  Save,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface SubcontractorDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  reviewStatus: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

interface SubcontractorData {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  tradeType: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseExpiry: string | null;
  insuranceProvider: string | null;
  insuranceExpiry: string | null;
  insuranceAmount: number;
  complianceStatus: string;
  orgName: string;
  documents: SubcontractorDocument[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExpiryColor(dateStr: string | null): string {
  if (!dateStr) return 'text-muted-foreground';
  const date = new Date(dateStr);
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  if (date < now) return 'text-red-600 dark:text-red-400';
  if (date <= thirtyDays) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function getExpiryLabel(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Expired ${Math.abs(diffDays)}d ago`;
  if (diffDays === 0) return 'Expires today';
  if (diffDays <= 30) return `${diffDays}d remaining`;
  return `${diffDays}d remaining`;
}

export default function SubcontractorPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<SubcontractorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [phone, setPhone] = useState('');
  const [docCategory, setDocCategory] = useState('license_copy');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/subcontractors/${token}/portal`);
      if (!res.ok) {
        if (res.status === 410) {
          setError('expired');
        } else {
          setError('not_found');
        }
        return;
      }
      const json = await res.json();
      setData(json.subcontractor);

      // Populate form fields
      const sub = json.subcontractor;
      setLicenseNumber(sub.licenseNumber || '');
      setLicenseState(sub.licenseState || '');
      setLicenseExpiry(sub.licenseExpiry ? sub.licenseExpiry.split('T')[0] : '');
      setInsuranceProvider(sub.insuranceProvider || '');
      setInsuranceExpiry(sub.insuranceExpiry ? sub.insuranceExpiry.split('T')[0] : '');
      setPhone(sub.phone || '');
    } catch {
      setError('not_found');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveInfo = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/subcontractors/${token}/portal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseNumber: licenseNumber || undefined,
          licenseState: licenseState || undefined,
          licenseExpiry: licenseExpiry || null,
          insuranceProvider: insuranceProvider || undefined,
          insuranceExpiry: insuranceExpiry || null,
          phone: phone || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      const json = await res.json();
      setData((prev) => prev ? { ...prev, ...json.subcontractor } : prev);
      toast.success('Information updated successfully');
    } catch {
      toast.error('Failed to update information');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', docCategory);

      const res = await fetch(`/api/subcontractors/${data?.id}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Upload failed');
      }

      toast.success('Document uploaded successfully');
      fetchData(); // Refresh data
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Calculate compliance completeness
  const requiredDocs = ['license_copy', 'certificate_of_insurance'];
  const submittedCategories = new Set(data?.documents.map((d) => d.category) || []);
  const hasLicenseInfo = !!(data?.licenseNumber && data?.licenseExpiry);
  const hasInsuranceInfo = !!(data?.insuranceProvider && data?.insuranceExpiry);

  const totalSteps = requiredDocs.length + 2; // 2 doc categories + license info + insurance info
  const completedSteps =
    requiredDocs.filter((cat) => submittedCategories.has(cat)).length +
    (hasLicenseInfo ? 1 : 0) +
    (hasInsuranceInfo ? 1 : 0);
  const completenessPercent = Math.round((completedSteps / totalSteps) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 dark:border-red-900/50">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="size-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {error === 'expired' ? 'Portal Link Expired' : 'Invalid Portal Link'}
            </h2>
            <p className="text-muted-foreground">
              {error === 'expired'
                ? 'This portal link has expired. Please request a new link from the organization.'
                : 'This portal link is invalid or has been removed. Please request a new link from the organization.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"><CheckCircle2 className="size-3 me-1" />Compliant</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"><Clock className="size-3 me-1" />Pending</Badge>;
      case 'non_compliant':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"><XCircle className="size-3 me-1" />Non-Compliant</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDocReviewBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs"><CheckCircle2 className="size-3 me-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs"><XCircle className="size-3 me-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs"><Clock className="size-3 me-1" />Pending Review</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <Shield className="size-4.5" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-lg">Subcontractor Portal</h1>
            <p className="text-xs text-muted-foreground">{data.orgName}</p>
          </div>
          {getStatusBadge(data.complianceStatus)}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Card */}
        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-50/80 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shrink-0">
                <Building2 className="size-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">Welcome, {data.name}!</h2>
                {data.company && <p className="text-muted-foreground mb-2">{data.company}</p>}
                <p className="text-sm text-muted-foreground">
                  Complete your compliance profile by providing your license and insurance information and uploading the required documents below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="size-4 text-emerald-600" />
              Compliance Completeness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-bold text-emerald-600">{completenessPercent}%</span>
              </div>
              <Progress value={completenessPercent} className="h-2.5" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                <div className={`flex items-center gap-1.5 text-xs p-2 rounded-lg ${hasLicenseInfo ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground'}`}>
                  {hasLicenseInfo ? <Check className="size-3.5" /> : <Clock className="size-3.5" />}
                  License Info
                </div>
                <div className={`flex items-center gap-1.5 text-xs p-2 rounded-lg ${hasInsuranceInfo ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground'}`}>
                  {hasInsuranceInfo ? <Check className="size-3.5" /> : <Clock className="size-3.5" />}
                  Insurance Info
                </div>
                <div className={`flex items-center gap-1.5 text-xs p-2 rounded-lg ${submittedCategories.has('license_copy') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground'}`}>
                  {submittedCategories.has('license_copy') ? <Check className="size-3.5" /> : <Clock className="size-3.5" />}
                  License Copy
                </div>
                <div className={`flex items-center gap-1.5 text-xs p-2 rounded-lg ${submittedCategories.has('certificate_of_insurance') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-muted/50 text-muted-foreground'}`}>
                  {submittedCategories.has('certificate_of_insurance') ? <Check className="size-3.5" /> : <Clock className="size-3.5" />}
                  COI Document
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* License Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4 text-emerald-600" />
                License Information
              </CardTitle>
              <CardDescription>Provide your license details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="licenseNumber" className="text-xs">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g., EL-2024-12345"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="licenseState" className="text-xs">License State</Label>
                <Input
                  id="licenseState"
                  value={licenseState}
                  onChange={(e) => setLicenseState(e.target.value)}
                  placeholder="e.g., CA"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="licenseExpiry" className="text-xs">License Expiry Date</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., (555) 123-4567"
                />
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="size-4 text-teal-600" />
                Insurance Information
              </CardTitle>
              <CardDescription>Provide your insurance details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="insuranceProvider" className="text-xs">Insurance Provider</Label>
                <Input
                  id="insuranceProvider"
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  placeholder="e.g., State Farm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="insuranceExpiry" className="text-xs">Insurance Expiry Date</Label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                />
              </div>
              {data.insuranceExpiry && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={getExpiryColor(data.insuranceExpiry)}>
                    {getExpiryLabel(data.insuranceExpiry)}
                  </span>
                </div>
              )}
              {data.licenseExpiry && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">License Status:</span>
                  <span className={getExpiryColor(data.licenseExpiry)}>
                    {getExpiryLabel(data.licenseExpiry)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveInfo}
            disabled={saving}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
          >
            {saving ? <Loader2 className="size-4 me-2 animate-spin" /> : <Save className="size-4 me-2" />}
            Save Information
          </Button>
        </div>

        <Separator />

        {/* Document Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="size-4 text-emerald-600" />
              Upload Documents
            </CardTitle>
            <CardDescription>Upload your license copy, COI, and other required documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={docCategory} onValueChange={setDocCategory}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="license_copy">License Copy</SelectItem>
                    <SelectItem value="certificate_of_insurance">Certificate of Insurance</SelectItem>
                    <SelectItem value="bond_certificate">Bond Certificate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30 transition-colors">
                    {uploading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="size-4" />
                        Choose File (PDF, DOC, JPG up to 10MB)
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Required Documents Checklist */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Required Documents</p>
                {[
                  { category: 'license_copy', label: 'License Copy' },
                  { category: 'certificate_of_insurance', label: 'Certificate of Insurance' },
                ].map((req) => {
                  const doc = data.documents.find((d) => d.category === req.category);
                  return (
                    <div key={req.category} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2.5">
                        {doc ? (
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="size-4 text-amber-500" />
                        )}
                        <span className="text-sm font-medium">{req.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc ? (
                          <>
                            {getDocReviewBadge(doc.reviewStatus)}
                            <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Missing</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Documents */}
        {data.documents.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4 text-teal-600" />
                Document Status
              </CardTitle>
              <CardDescription>Review status of your submitted documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.documents.map((doc) => (
                  <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center size-8 rounded-lg ${
                        doc.reviewStatus === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                        doc.reviewStatus === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' :
                        'bg-amber-100 dark:bg-amber-900/30'
                      }`}>
                        <FileText className={`size-4 ${
                          doc.reviewStatus === 'approved' ? 'text-emerald-600' :
                          doc.reviewStatus === 'rejected' ? 'text-red-600' :
                          'text-amber-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} • {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ps-11 sm:ps-0">
                      {getDocReviewBadge(doc.reviewStatus)}
                      {doc.reviewNotes && (
                        <p className="text-xs text-muted-foreground max-w-48 truncate" title={doc.reviewNotes}>
                          {doc.reviewNotes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold">LicenseVault</span> • Subcontractor Compliance Portal
          </p>
        </div>
      </main>
    </div>
  );
}
