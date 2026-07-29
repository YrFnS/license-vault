"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import { FileText, Plus, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import {
  ActivityTimeline,
  ActivityTimelineSkeleton,
  type ActivityEntry,
} from "@/components/dashboard/ActivityTimeline";
import {
  ComplianceForecast,
  ComplianceForecastSkeleton,
  type ForecastLicense,
} from "@/components/dashboard/ComplianceForecast";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { LicenseQuickView } from "@/components/licenses/LicenseQuickView";
import { LicenseTable, type License } from "@/components/licenses/LicenseTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ComplianceScoreCard } from "./ComplianceScoreCard";
import { GetStartedBanner } from "./GetStartedBanner";
import { QuickActions } from "./QuickActions";

interface DashboardData {
  summary: {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
  };
  recentLicenses: License[];
  recentActivity: ActivityEntry[];
  expiringLicenses: ForecastLicense[];
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [quickViewLicense, setQuickViewLicense] = useState<License | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const payload: DashboardData = await response.json();
      setData(payload);
      setLastUpdated(new Date());

      if (payload.summary.total === 0) {
        const dismissed = localStorage.getItem("dashboard_getStarted_dismissed");
        setShowGetStarted(!dismissed);
      } else {
        setShowGetStarted(false);
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleDismissGetStarted = useCallback(() => {
    setShowGetStarted(false);
    localStorage.setItem("dashboard_getStarted_dismissed", "true");
  }, []);

  const handleDeleteLicense = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/licenses/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete license");
        toast.success("License deleted successfully");
        fetchDashboard();
      } catch {
        toast.error("Failed to delete license");
      }
    },
    [fetchDashboard],
  );

  const firstName = (session?.user?.name || "User").split(" ")[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-4 w-20" />
                <Skeleton className="h-7 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <ComplianceForecastSkeleton />
        <ActivityTimelineSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="size-7 text-destructive" />
            </div>
            <p className="text-lg font-semibold text-foreground">
              {t("loadError") || "Failed to load dashboard"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="mt-6 gap-2">
              <RefreshCw className="size-4" />
              {tc("retry") || "Retry"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showGetStarted && data.summary.total === 0 && (
          <GetStartedBanner onDismiss={handleDismissGetStarted} />
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("welcomeBack")}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("overview")}</p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {t("lastUpdated")}: {lastUpdated.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label={tc("retry")}
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        )}
      </div>

      <QuickActions />

      <SummaryCards
        total={data.summary.total}
        active={data.summary.active}
        expiring={data.summary.expiringSoon}
        expired={data.summary.expired}
      />

      <AlertBanner
        expiredCount={data.summary.expired}
        expiringCount={data.summary.expiringSoon}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ComplianceScoreCard active={data.summary.active} total={data.summary.total} />
        </div>
        <div className="lg:col-span-2">
          <ComplianceForecast
            licenses={data.expiringLicenses}
            totalLicenses={data.summary.total}
            activeLicenses={data.summary.active}
          />
        </div>
      </div>

      <ActivityTimeline activities={data.recentActivity} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{t("recentLicenses")}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {data.recentLicenses.length}
            </Badge>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/licenses/new">
              <Plus className="me-1 size-4" />
              {tc("create")}
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {data.recentLicenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-xl bg-muted p-4">
                <FileText className="size-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">{t("emptyStateTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("emptyStateDesc")}</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/licenses/new">
                  <Plus className="me-1 size-4" />
                  {tc("create")}
                </Link>
              </Button>
            </div>
          ) : (
            <LicenseTable
              licenses={data.recentLicenses}
              onDelete={handleDeleteLicense}
              onQuickView={(license) => {
                setQuickViewLicense(license);
                setQuickViewOpen(true);
              }}
              compact
            />
          )}
        </CardContent>
      </Card>

      <LicenseQuickView
        license={quickViewLicense}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        onRenew={(id) => router.push(`/licenses/${id}`)}
      />
    </div>
  );
}
