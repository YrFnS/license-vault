// US States list
export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
];

// Trade types
export const TRADE_TYPES = [
  'general', 'electrical', 'plumbing', 'hvac', 'roofing', 'concrete',
  'carpentry', 'masonry', 'painting', 'drywall', 'flooring', 'landscaping',
  'excavation', 'welding', 'insulation', 'glass', 'elevator', 'fire_sprinkler',
  'alarm', 'well_drilling', 'solar', 'other',
];

export interface OrgSettings {
  id: string;
  name: string;
  tradeType: string;
  primaryState: string;
  logoUrl: string | null;
  primaryColor: string | null;
  companyName: string | null;
  brandingConfig: string | null;
  plan: string;
  parentId: string | null;
  parent: { id: string; name: string; tradeType: string; primaryState: string } | null;
  subsidiaryCount: number;
}

export interface SubsidiaryInfo {
  id: string;
  name: string;
  tradeType: string;
  primaryState: string;
  licenseCount: number;
  memberCount: number;
  complianceScore: number;
}

export interface HierarchyData {
  currentOrg: {
    id: string;
    name: string;
    tradeType: string;
    primaryState: string;
    licenseCount: number;
    memberCount: number;
    complianceScore: number;
    parentId: string | null;
  };
  parent: { id: string; name: string; tradeType: string; primaryState: string } | null;
  subsidiaries: SubsidiaryInfo[];
  projectCount: number;
  apiCallCount: number;
}

export interface CrossComplianceData {
  summary: {
    totalOrgs: number;
    combinedCompliance: number;
    totalLicenses: number;
    atRisk: number;
  };
  organizations: {
    id: string;
    name: string;
    totalLicenses: number;
    activeLicenses: number;
    expiringLicenses: number;
    expiredLicenses: number;
    atRisk: number;
    complianceRate: number;
  }[];
}
