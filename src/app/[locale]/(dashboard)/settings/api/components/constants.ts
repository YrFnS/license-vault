export const WEBHOOK_EVENTS = [
  'license.created',
  'license.updated',
  'license.expiring',
  'license.expired',
  'insurance.expiring',
  'insurance.expired',
  'compliance.changed',
  'approval.created',
  'approval.approved',
  'approval.rejected',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
