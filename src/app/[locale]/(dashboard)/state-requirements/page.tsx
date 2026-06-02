'use client';

import { useTranslations } from 'next-intl';
import { useStateRequirements } from './hooks/useStateRequirements';
import PageHeader from './components/PageHeader';
import LoadingSkeleton from './components/LoadingSkeleton';
import RequirementWizard from './components/RequirementWizard';
import YourStateCard from './components/YourStateCard';
import StateFilters from './components/StateFilters';
import RequirementsTable from './components/RequirementsTable';
import RequirementsCards from './components/RequirementsCards';

export default function StateRequirementsPage() {
  const t = useTranslations('stateRequirements');

  const {
    requirements,
    loading,
    stateFilter,
    setStateFilter,
    licenseTypeFilter,
    setLicenseTypeFilter,
    expandedRows,
    toggleRow,
    primaryState,
    primaryStateRequirements,
    wizardState,
    setWizardState,
    wizardType,
    setWizardType,
    wizardResult,
    wizardLoading,
    wizardSubmitted,
    handleWizardCheck,
  } = useStateRequirements();

  if (loading && requirements.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      <RequirementWizard
        wizardState={wizardState}
        setWizardState={setWizardState}
        wizardType={wizardType}
        setWizardType={setWizardType}
        wizardResult={wizardResult}
        wizardLoading={wizardLoading}
        wizardSubmitted={wizardSubmitted}
        handleWizardCheck={handleWizardCheck}
      />

      <YourStateCard
        primaryState={primaryState}
        primaryStateRequirements={primaryStateRequirements}
      />

      <StateFilters
        stateFilter={stateFilter}
        setStateFilter={setStateFilter}
        licenseTypeFilter={licenseTypeFilter}
        setLicenseTypeFilter={setLicenseTypeFilter}
      />

      {requirements.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {requirements.length} {requirements.length === 1 ? 'requirement' : 'requirements'} found
        </p>
      )}

      <RequirementsTable
        requirements={requirements}
        expandedRows={expandedRows}
        toggleRow={toggleRow}
        loading={loading}
      />

      <RequirementsCards
        requirements={requirements}
        expandedRows={expandedRows}
        toggleRow={toggleRow}
        loading={loading}
      />
    </div>
  );
}
