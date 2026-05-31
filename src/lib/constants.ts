export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
] as const

export type USState = (typeof US_STATES)[number]

export const TRADE_TYPES = [
  'Electrical', 'Plumbing', 'HVAC', 'General', 'Roofing', 'Concrete',
  'Painting', 'Landscaping', 'Steel', 'Masonry', 'Flooring', 'Drywall',
  'Insulation', 'Piping', 'Excavation', 'Demolition', 'Other',
] as const

export type TradeType = (typeof TRADE_TYPES)[number]

export const LICENSE_STATUSES = ['active', 'expiring_soon', 'expired', 'revoked'] as const
export const COMPLIANCE_STATUSES = ['compliant', 'pending', 'non_compliant', 'unknown'] as const
export const INSURANCE_STATUSES = ['active', 'expiring', 'expired', 'deficient'] as const

export const DEFAULT_PAGE_SIZE = 25
export const SEARCH_DEBOUNCE_MS = 300
