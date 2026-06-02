'use client';

import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { US_STATES, SUBMISSION_TYPES, PRIORITIES } from './constants';

interface SearchFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterState: string;
  onFilterStateChange: (v: string) => void;
  filterType: string;
  onFilterTypeChange: (v: string) => void;
  filterPriority: string;
  onFilterPriorityChange: (v: string) => void;
  t: (key: string) => string;
  tc: (key: string) => string;
}

export function SearchFilters({
  search, onSearchChange,
  filterState, onFilterStateChange,
  filterType, onFilterTypeChange,
  filterPriority, onFilterPriorityChange,
  t, tc,
}: SearchFiltersProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={tc('search')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={filterState} onValueChange={onFilterStateChange}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder={t('selectState')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={t('submissionType')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {SUBMISSION_TYPES.map((st) => <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder={t('priority')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
