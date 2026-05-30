interface InsuranceRecord {
  coverageAmount: number;
  perOccurrenceLimit: number;
  aggregateLimit: number;
  additionalInsured: boolean;
  primaryNoncontrib: boolean;
  waiverSubrogation: boolean;
  endorsementTypes: string | null;
  requiredCoverage: number;
  requiredPerOccurrence: number;
  requiredAggregate: number;
  requiredEndorsements: string | null;
  expirationDate: Date | string;
  complianceStatus: string;
}

export interface ComplianceResult {
  isCompliant: boolean;
  deficiencies: string[];
}

export function checkInsuranceCompliance(record: InsuranceRecord): ComplianceResult {
  const deficiencies: string[] = [];

  // Check if expired
  const now = new Date();
  const expDate = new Date(record.expirationDate);
  if (expDate <= now) {
    deficiencies.push('Policy has expired');
    return { isCompliant: false, deficiencies };
  }

  // Check coverage amount
  if (record.requiredCoverage > 0 && record.coverageAmount < record.requiredCoverage) {
    deficiencies.push(
      `Coverage amount (${formatCurrency(record.coverageAmount)}) is below required minimum (${formatCurrency(record.requiredCoverage)})`
    );
  }

  // Check per-occurrence limit
  if (record.requiredPerOccurrence > 0 && record.perOccurrenceLimit < record.requiredPerOccurrence) {
    deficiencies.push(
      `Per Occurrence limit (${formatCurrency(record.perOccurrenceLimit)}) is below required minimum (${formatCurrency(record.requiredPerOccurrence)})`
    );
  }

  // Check aggregate limit
  if (record.requiredAggregate > 0 && record.aggregateLimit < record.requiredAggregate) {
    deficiencies.push(
      `Aggregate limit (${formatCurrency(record.aggregateLimit)}) is below required minimum (${formatCurrency(record.requiredAggregate)})`
    );
  }

  // Check required endorsements
  if (record.requiredEndorsements) {
    try {
      const requiredEndorsements: string[] = JSON.parse(record.requiredEndorsements);
      const actualEndorsements: string[] = record.endorsementTypes
        ? JSON.parse(record.endorsementTypes)
        : [];

      const missingEndorsements = requiredEndorsements.filter(
        (req) => !actualEndorsements.includes(req)
      );

      if (missingEndorsements.length > 0) {
        deficiencies.push(
          `Missing required endorsements: ${missingEndorsements.join(', ')}`
        );
      }
    } catch {
      // If JSON parse fails, skip endorsement check
    }
  }

  // Check additional insured
  if (record.requiredEndorsements) {
    try {
      const requiredEndorsements: string[] = JSON.parse(record.requiredEndorsements);
      if (requiredEndorsements.includes('additional_insured') && !record.additionalInsured) {
        deficiencies.push('Additional Insured endorsement is required but not present');
      }
      if (requiredEndorsements.includes('primary_noncontrib') && !record.primaryNoncontrib) {
        deficiencies.push('Primary & Noncontributory endorsement is required but not present');
      }
      if (requiredEndorsements.includes('waiver_subrogation') && !record.waiverSubrogation) {
        deficiencies.push('Waiver of Subrogation endorsement is required but not present');
      }
    } catch {
      // If JSON parse fails, skip
    }
  }

  return {
    isCompliant: deficiencies.length === 0,
    deficiencies,
  };
}

export function computeComplianceStatus(
  record: InsuranceRecord
): 'compliant' | 'deficient' | 'expired' | 'pending' {
  // Check if expired first
  const now = new Date();
  const expDate = new Date(record.expirationDate);
  if (expDate <= now) {
    return 'expired';
  }

  // Check if there are any requirements set
  const hasRequirements =
    record.requiredCoverage > 0 ||
    record.requiredPerOccurrence > 0 ||
    record.requiredAggregate > 0 ||
    (record.requiredEndorsements && record.requiredEndorsements !== '[]' && record.requiredEndorsements !== null);

  if (!hasRequirements) {
    // No requirements defined, still pending compliance verification
    return 'pending';
  }

  const { isCompliant } = checkInsuranceCompliance(record);
  return isCompliant ? 'compliant' : 'deficient';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
