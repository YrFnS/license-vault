'use client';

import { AnimatePresence } from 'framer-motion';
import { Plus, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import type { VendorScoreData } from '../types';
import { VendorCard } from './VendorCard';

interface VendorListProps {
  vendors: VendorScoreData[];
  assessing: boolean;
  selectedVendorId: string | null;
  onAssess: (vendor: VendorScoreData) => void;
  onViewDetails: (vendor: VendorScoreData) => void;
  onFlag: (vendor: VendorScoreData) => void;
  onDelete: (id: string) => void;
  onAddVendor: () => void;
}

export function VendorList({ vendors, assessing, selectedVendorId, onAssess, onViewDetails, onFlag, onDelete, onAddVendor }: VendorListProps) {
  const t = useTranslations('vendorScores');

  if (vendors.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ShieldCheck className="size-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">{t('noVendors')}</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">{t('noVendorsDesc')}</p>
          <Button className="mt-4 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white" onClick={onAddVendor}>
            <Plus className="size-4" /> {t('addVendor')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <AnimatePresence>
        {vendors.map((vendor, idx) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            index={idx}
            assessing={assessing}
            selectedVendorId={selectedVendorId}
            onAssess={onAssess}
            onViewDetails={onViewDetails}
            onFlag={onFlag}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
