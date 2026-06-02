'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ComplianceData } from './types';

export function useComplianceData() {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompliance = useCallback(async () => {
    try {
      const res = await fetch('/api/compliance?type=score');
      if (!res.ok) throw new Error('Failed to fetch compliance data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCompliance();
  }, [fetchCompliance]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCompliance();
  };

  return { data, loading, error, refreshing, handleRefresh };
}
