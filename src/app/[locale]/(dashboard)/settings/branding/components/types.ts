export interface BrandingColors {
  primary: string;
  secondary: string;
  accent: string;
  darkPrimary: string;
  darkSecondary: string;
}

export interface BrandingFonts {
  heading: string;
  body: string;
  scale: 'compact' | 'normal' | 'large';
}

export interface BrandingLoginPage {
  backgroundImage: string;
  title: string;
  subtitle: string;
  leftPanelColor: string;
  showSocialLogin: boolean;
  welcomeMessage: string;
}

export interface BrandingEmailTemplates {
  headerColor: string;
  footerText: string;
  showLogo: boolean;
  signature: string;
}

export interface BrandingPortal {
  subdomain: string;
  welcomeMessage: string;
  showComplianceScore: boolean;
  showContactInfo: boolean;
  footerText: string;
}

export interface BrandingConfig {
  customLogo: string;
  customFavicon: string;
  customColors: BrandingColors;
  customFonts: BrandingFonts;
  loginPage: BrandingLoginPage;
  emailTemplates: BrandingEmailTemplates;
  portal: BrandingPortal;
  customCSS: string;
  customHeadJS: string;
  customBodyJS: string;
  tagline?: string;
}

export interface BrandingData {
  id: string;
  name: string;
  primaryColor: string;
  logoUrl: string;
  companyName: string;
  tagline: string;
  brandingConfig: BrandingConfig;
}
