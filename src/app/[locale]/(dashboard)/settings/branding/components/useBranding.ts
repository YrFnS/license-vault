import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DEFAULT_COLORS, THEME_PRESETS } from './constants';
import type {
	BrandingColors,
	BrandingFonts,
	BrandingLoginPage,
	BrandingEmailTemplates,
	BrandingPortal,
	BrandingData,
} from './types';

export function useBranding(t: (key: string) => string) {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [primaryColor, setPrimaryColor] = useState('#10b981');
	const [logoUrl, setLogoUrl] = useState('');
	const [companyName, setCompanyName] = useState('');
	const [tagline, setTagline] = useState('');
	const [customLogo, setCustomLogo] = useState('');
	const [customFavicon, setCustomFavicon] = useState('');
	const [colors, setColors] = useState<BrandingColors>(DEFAULT_COLORS);
	const [fonts, setFonts] = useState<BrandingFonts>({ heading: 'Inter', body: 'Inter', scale: 'normal' });
	const [loginPage, setLoginPage] = useState<BrandingLoginPage>({
		backgroundImage: '', title: '', subtitle: '', leftPanelColor: '', showSocialLogin: true, welcomeMessage: '',
	});
	const [emailTemplates, setEmailTemplates] = useState<BrandingEmailTemplates>({
		headerColor: '#10b981', footerText: '', showLogo: true, signature: '',
	});
	const [portal, setPortal] = useState<BrandingPortal>({
		subdomain: '', welcomeMessage: '', showComplianceScore: true, showContactInfo: true, footerText: '',
	});
	const [customCSS, setCustomCSS] = useState('');
	const [customHeadJS, setCustomHeadJS] = useState('');
	const [customBodyJS, setCustomBodyJS] = useState('');

	const fetchBranding = useCallback(async () => {
		try {
			setLoading(true);
			const res = await fetch('/api/org/branding');
			if (res.ok) {
				const data: BrandingData = await res.json();
				setPrimaryColor(data.primaryColor);
				setLogoUrl(data.logoUrl);
				setCompanyName(data.companyName);
				setTagline(data.tagline);
				const bc = data.brandingConfig;
				setCustomLogo(bc.customLogo || '');
				setCustomFavicon(bc.customFavicon || '');
				setColors(bc.customColors || DEFAULT_COLORS);
				setFonts(bc.customFonts || { heading: 'Inter', body: 'Inter', scale: 'normal' });
				setLoginPage(bc.loginPage || { backgroundImage: '', title: '', subtitle: '', leftPanelColor: '', showSocialLogin: true, welcomeMessage: '' });
				setEmailTemplates(bc.emailTemplates || { headerColor: '#10b981', footerText: '', showLogo: true, signature: '' });
				setPortal(bc.portal || { subdomain: '', welcomeMessage: '', showComplianceScore: true, showContactInfo: true, footerText: '' });
				setCustomCSS(bc.customCSS || '');
				setCustomHeadJS(bc.customHeadJS || '');
				setCustomBodyJS(bc.customBodyJS || '');
			}
		} catch {
			// silently fail
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { fetchBranding(); }, [fetchBranding]);

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await fetch('/api/org/branding', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					primaryColor, logoUrl, companyName, tagline,
					brandingConfig: {
						customLogo, customFavicon, customColors: colors, customFonts: fonts,
						loginPage, emailTemplates, portal, customCSS, customHeadJS, customBodyJS,
					},
				}),
			});
			if (res.ok) {
				toast.success(t('saveSuccess'));
			} else {
				const data = await res.json();
				toast.error(data.error || 'Failed to save branding');
			}
		} catch {
			toast.error('Failed to save branding');
		} finally {
			setSaving(false);
		}
	};

	const handleReset = async () => {
		setSaving(true);
		try {
			const res = await fetch('/api/org/branding', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					primaryColor: '#10b981', logoUrl: '', companyName: '', tagline: '',
					brandingConfig: {
						customLogo: '', customFavicon: '', customColors: DEFAULT_COLORS,
						customFonts: { heading: 'Inter', body: 'Inter', scale: 'normal' },
						loginPage: { backgroundImage: '', title: '', subtitle: '', leftPanelColor: '', showSocialLogin: true, welcomeMessage: '' },
						emailTemplates: { headerColor: '#10b981', footerText: '', showLogo: true, signature: '' },
						portal: { subdomain: '', welcomeMessage: '', showComplianceScore: true, showContactInfo: true, footerText: '' },
						customCSS: '', customHeadJS: '', customBodyJS: '',
					},
				}),
			});
			if (res.ok) {
				await fetchBranding();
				toast.success(t('resetSuccess'));
			}
		} catch {
			toast.error('Failed to reset');
		} finally {
			setSaving(false);
		}
	};

	const handleExportBranding = () => {
		const data = {
			primaryColor, logoUrl, companyName, tagline,
			brandingConfig: {
				customLogo, customFavicon, customColors: colors, customFonts: fonts,
				loginPage, emailTemplates, portal, customCSS, customHeadJS, customBodyJS,
			},
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'branding-config.json';
		a.click();
		URL.revokeObjectURL(url);
		toast.success(t('exportSuccess'));
	};

	const handleImportBranding = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (ev) => {
				try {
					const data = JSON.parse(ev.target?.result as string);
					if (data.primaryColor) setPrimaryColor(data.primaryColor);
					if (data.logoUrl !== undefined) setLogoUrl(data.logoUrl);
					if (data.companyName !== undefined) setCompanyName(data.companyName);
					if (data.tagline !== undefined) setTagline(data.tagline);
					const bc = data.brandingConfig;
					if (bc) {
						if (bc.customLogo !== undefined) setCustomLogo(bc.customLogo);
						if (bc.customFavicon !== undefined) setCustomFavicon(bc.customFavicon);
						if (bc.customColors) setColors(bc.customColors);
						if (bc.customFonts) setFonts(bc.customFonts);
						if (bc.loginPage) setLoginPage(bc.loginPage);
						if (bc.emailTemplates) setEmailTemplates(bc.emailTemplates);
						if (bc.portal) setPortal(bc.portal);
						if (bc.customCSS !== undefined) setCustomCSS(bc.customCSS);
						if (bc.customHeadJS !== undefined) setCustomHeadJS(bc.customHeadJS);
						if (bc.customBodyJS !== undefined) setCustomBodyJS(bc.customBodyJS);
					}
					toast.success(t('importSuccess'));
				} catch {
					toast.error('Invalid JSON file');
				}
			};
			reader.readAsText(file);
		};
		input.click();
	};

	const applyPreset = (presetKey: string) => {
		const preset = THEME_PRESETS[presetKey];
		if (preset) {
			setColors(preset);
			setPrimaryColor(preset.primary);
		}
	};

	return {
		loading, saving, primaryColor, setPrimaryColor,
		logoUrl, setLogoUrl, companyName, setCompanyName,
		tagline, setTagline, customLogo, setCustomLogo,
		customFavicon, setCustomFavicon, colors, setColors,
		fonts, setFonts, loginPage, setLoginPage,
		emailTemplates, setEmailTemplates, portal, setPortal,
		customCSS, setCustomCSS, customHeadJS, setCustomHeadJS,
		customBodyJS, setCustomBodyJS,
		fetchBranding, handleSave, handleReset,
		handleExportBranding, handleImportBranding, applyPreset,
	};
}
