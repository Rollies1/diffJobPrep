import { useState, useEffect } from 'react';

export interface KPI {
  id: string;
  label: string;
  current: number;
  target: number;
  format: 'percentage' | 'currency' | 'number';
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
}

export interface AdminMetrics {
  kpis: KPI[];
  abTest: {
    winner: string;
    lift: number;
  };
  health: {
    offlineSync: number;
    perfIssues: number;
  };
}

// Mock data to simulate backend fetch
const MOCK_METRICS: AdminMetrics = {
  kpis: [
    {
      id: 'paywall',
      label: 'Paywall Conversion',
      current: 8.2,
      target: 8.0,
      format: 'percentage',
      trend: 'up',
      trendValue: '+0.5% vs last week'
    },
    {
      id: 'funnel',
      label: 'Preview → Paid Funnel',
      current: 12.4,
      target: 12.0,
      format: 'percentage',
      trend: 'up',
      trendValue: '+1.2% vs last week'
    },
    {
      id: 'retention',
      label: 'Day-7 Retention',
      current: 26.1,
      target: 25.0,
      format: 'percentage',
      trend: 'up',
      trendValue: '+2.1% vs last week'
    },
    {
      id: 'completion',
      label: 'Session Completion',
      current: 72.5,
      target: 70.0,
      format: 'percentage',
      trend: 'up',
      trendValue: '+1.5% vs last week'
    },
    {
      id: 'ltv',
      label: 'Revenue LTV',
      current: 47.50,
      target: 45.00,
      format: 'currency',
      trend: 'up',
      trendValue: '+$2.50 vs last month'
    },
  ],
  abTest: {
    winner: 'Urgency',
    lift: 16.7
  },
  health: {
    offlineSync: 98.5, // Target ≥98%
    perfIssues: 0      // Target 0 per 1k
  }
};

export function useAdminMetrics() {
  const [data, setData] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setData(MOCK_METRICS);
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    data,
    loading,
    refetch: fetchMetrics
  };
}
