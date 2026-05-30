'use client';

import { useEffect } from 'react';

/**
 * Sets the document title for the current page.
 * Usage: usePageTitle('Licenses') → sets document.title to "Licenses - LicenseVault"
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} - LicenseVault`;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
