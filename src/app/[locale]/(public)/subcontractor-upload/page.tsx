'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function SubcontractorUploadRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      router.replace(`/subcontractor-portal/${token}`);
    }
  }, [token, router]);

  // No token — show invalid link error
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="max-w-md w-full border-red-200 dark:border-red-900">
          <CardContent className="p-8 text-center">
            <div className="rounded-full bg-red-100 dark:bg-red-950/40 p-4 mx-auto w-fit mb-4">
              <XCircle className="size-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground text-sm">
              This link is invalid or has expired. Please request a new link from the organization.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token exists — show loading spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <p className="text-muted-foreground">Redirecting to portal...</p>
      </div>
    </div>
  );
}
