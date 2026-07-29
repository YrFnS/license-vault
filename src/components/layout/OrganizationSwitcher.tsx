"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface OrganizationOption {
  id: string;
  name: string;
  role: string;
  logoUrl?: string | null;
}

export function OrganizationSwitcher({
  className,
}: {
  className?: string;
}) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const activeOrgId = (session?.user as { activeOrgId?: string } | undefined)
    ?.activeOrgId;

  const loadOrganizations = useCallback(async () => {
    try {
      const response = await fetch("/api/org/memberships", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = await response.json();
      setOrganizations(payload.organizations || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  if (loading) {
    return (
      <div
        className={cn(
          "flex h-8 items-center gap-2 rounded-md border border-slate-200 px-2 text-xs text-slate-500 dark:border-slate-700",
          className,
        )}
      >
        <Loader2 className="size-3.5 animate-spin" />
        <span>Organization</span>
      </div>
    );
  }

  if (organizations.length <= 1) {
    const organization = organizations[0];
    if (!organization) return null;

    return (
      <div
        className={cn(
          "flex h-8 min-w-0 items-center gap-2 rounded-md border border-slate-200 px-2 text-xs dark:border-slate-700",
          className,
        )}
        title={organization.name}
      >
        <Building2 className="size-3.5 shrink-0 text-slate-500" />
        <span className="truncate">{organization.name}</span>
      </div>
    );
  }

  const handleChange = async (orgId: string) => {
    if (!orgId || orgId === activeOrgId) return;
    setSwitching(true);
    try {
      await update({ activeOrgId: orgId });
      router.refresh();
    } finally {
      setSwitching(false);
    }
  };

  return (
    <label
      className={cn(
        "relative flex h-8 min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950",
        className,
      )}
    >
      {switching ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-slate-500" />
      ) : (
        <Building2 className="size-3.5 shrink-0 text-slate-500" />
      )}
      <span className="sr-only">Select organization</span>
      <select
        value={activeOrgId || organizations[0]?.id || ""}
        onChange={(event) => handleChange(event.target.value)}
        disabled={switching}
        className="min-w-0 flex-1 appearance-none bg-transparent pe-5 outline-none"
      >
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>
    </label>
  );
}
