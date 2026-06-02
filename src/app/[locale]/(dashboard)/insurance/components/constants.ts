import type { ElementType } from 'react';
import { Shield, FileText, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { FilterTab } from './types';

export interface FilterTabConfig {
  key: FilterTab;
  icon: ElementType;
}

export const filterTabs: FilterTabConfig[] = [
  { key: 'all', icon: Shield },
  { key: 'insurance', icon: Shield },
  { key: 'bond', icon: FileText },
  { key: 'certificate', icon: CheckCircle2 },
  { key: 'active', icon: CheckCircle2 },
  { key: 'expiring', icon: AlertTriangle },
  { key: 'expired', icon: XCircle },
  { key: 'compliant', icon: ShieldCheck },
  { key: 'deficient', icon: ShieldAlert },
];

export interface EndorsementOption {
  value: string;
  label: string;
}

export const ENDORSEMENT_OPTIONS: EndorsementOption[] = [
  { value: 'CG_20_10', label: 'CG 20 10' },
  { value: 'CG_20_37', label: 'CG 20 37' },
  { value: 'CG_20_26', label: 'CG 20 26' },
  { value: 'CG_20_33', label: 'CG 20 33' },
  { value: 'CG_20_11', label: 'CG 20 11' },
  { value: 'CG_20_12', label: 'CG 20 12' },
  { value: 'CG_21_04', label: 'CG 21 04' },
  { value: 'CG_21_05', label: 'CG 21 05' },
  { value: 'additional_insured', label: 'Additional Insured' },
  { value: 'primary_noncontrib', label: 'Primary & Noncontributory' },
  { value: 'waiver_subrogation', label: 'Waiver of Subrogation' },
];
