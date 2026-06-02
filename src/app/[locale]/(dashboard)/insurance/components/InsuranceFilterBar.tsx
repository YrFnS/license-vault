'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { filterTabs } from './constants';
import type { FilterTab } from './types';

interface InsuranceFilterBarProps {
  activeFilter: FilterTab;
  onFilterChange: (filter: FilterTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  t: (key: string) => string;
}

export default function InsuranceFilterBar({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  t,
}: InsuranceFilterBarProps) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.key}
              variant={activeFilter === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange(tab.key)}
              className={
                activeFilter === tab.key
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-sm'
                  : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700'
              }
            >
              <Icon className="size-3.5 me-1.5" />
              {t(tab.key === 'all' ? 'all' : tab.key === 'expiring' ? 'expiring' : tab.key)}
            </Button>
          );
        })}
      </div>
      <div className="relative w-full sm:w-64">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t('policyNumber') + '...'}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ps-9"
        />
      </div>
    </motion.div>
  );
}
