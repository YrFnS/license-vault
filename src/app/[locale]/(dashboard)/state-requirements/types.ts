export interface StateRequirementData {
  id: string;
  state: string;
  licenseType: string;
  renewPeriodMonths: number;
  ceHoursRequired: number;
  renewalFeeMin: number;
  renewalFeeMax: number;
  bondRequired: boolean;
  bondAmountMin: number;
  insuranceRequired: boolean;
  boardName: string | null;
  boardUrl: string | null;
  boardPhone: string | null;
  notes: string | null;
  reciprocityStates?: string[];
  nasclaAccepted?: boolean;
}
