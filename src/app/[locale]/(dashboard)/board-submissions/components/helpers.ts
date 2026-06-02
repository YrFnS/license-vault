import {
  Sparkles, RotateCcw, Shield, Edit3, MapPin, FileText,
} from 'lucide-react';
import { SUBMISSION_TYPES, PRIORITIES } from './constants';

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    ready: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    submitted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    returned: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  };
  return map[status] || map.draft;
}

export function getPriorityColor(priority: string) {
  const map: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    normal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
  return map[priority] || map.normal;
}

export function getSubmissionTypeIcon(type: string) {
  const map: Record<string, any> = {
    new_license: Sparkles,
    renewal: RotateCcw,
    reinstatement: Shield,
    name_change: Edit3,
    address_change: MapPin,
    ce_report: FileText,
    other: FileText,
  };
  return map[type] || FileText;
}

export function formatDate(dateStr: string | null) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'N/A';
  }
}

export function getSubmissionTypeLabel(type: string) {
  const found = SUBMISSION_TYPES.find((st) => st.value === type);
  return found?.label || type;
}

export function getPriorityLabel(p: string) {
  const found = PRIORITIES.find((pr) => pr.value === p);
  return found?.label || p;
}
