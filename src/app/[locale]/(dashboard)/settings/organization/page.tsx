'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { OrgProfileSection } from './components/OrgProfileSection';
import { BrandingSection } from './components/BrandingSection';
import { HierarchySection } from './components/HierarchySection';
import { CrossComplianceSection } from './components/CrossComplianceSection';
import { PlanBillingSection } from './components/PlanBillingSection';
import { UnlinkDialog } from './components/UnlinkDialog';
import { fadeIn } from './components/helpers';
import { useOrganizationSettings } from './components/useOrganizationSettings';

export default function OrganizationSettingsPage() {
  const t = useTranslations('organization');
  const state = useOrganizationSettings();

  if (state.loading) {
    return <LoadingSkeleton />;
  }

  const hasSubsidiaries = (state.hierarchy?.subsidiaries.length ?? 0) > 0;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <motion.div {...fadeIn}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <Building2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>
      </motion.div>

      {/* Section 1: Organization Profile */}
      <OrgProfileSection
        profileForm={state.profileForm}
        setProfileForm={state.setProfileForm}
        savingProfile={state.savingProfile}
        canManage={state.canManage}
        onSave={state.handleSaveProfile}
      />

      {/* Section 2: Branding & Customization */}
      <BrandingSection
        orgSettings={state.orgSettings}
        brandingForm={state.brandingForm}
        setBrandingForm={state.setBrandingForm}
        savingBranding={state.savingBranding}
        canManage={state.canManage}
        onSave={state.handleSaveBranding}
      />

      {/* Section 3: Organization Hierarchy (owner only) */}
      {state.isOwner && (
        <HierarchySection
          hierarchy={state.hierarchy}
          subsidiaryDialog={state.subsidiaryDialog}
          setSubsidiaryDialog={state.setSubsidiaryDialog}
          subsidiaryForm={state.subsidiaryForm}
          setSubsidiaryForm={state.setSubsidiaryForm}
          creatingSubsidiary={state.creatingSubsidiary}
          onCreateSubsidiary={state.handleCreateSubsidiary}
          onUnlinkTarget={state.setUnlinkTarget}
        />
      )}

      {/* Section 4: Cross-Organization Compliance (owner only, only if has subsidiaries) */}
      {state.isOwner && state.crossCompliance && (
        <CrossComplianceSection
          crossCompliance={state.crossCompliance}
          hasSubsidiaries={hasSubsidiaries}
        />
      )}

      {/* Section 5: Plan & Billing Info */}
      <PlanBillingSection
        orgSettings={state.orgSettings}
        hierarchy={state.hierarchy}
      />

      {/* Unlink confirmation dialog */}
      <UnlinkDialog
        unlinkTarget={state.unlinkTarget}
        onOpenChange={(open) => !open && state.setUnlinkTarget(null)}
        onConfirm={state.handleUnlinkSubsidiary}
      />
    </div>
  );
}
