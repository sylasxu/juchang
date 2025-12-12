import { useState, useEffect, useCallback } from 'react';
import { api, apiRequest, type ApiError } from '@/lib/api';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalActivities: number;
  todayRevenue: number;
  conversionRate: number;
  avgFulfillmentRate: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  creator: string;
  participants: number;
  status: 'active' | 'completed' | 'disputed';
  revenue: number;
}

export interface RiskUser {
  id: string;
  name: string;
  phone: string;
  fulfillmentRate: number;
  disputes: number;
  risk: 'high' | 'medium' | 'low';
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  riskUsers: RiskUser[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 并行获取多个数据源
      const [statsResult, activitiesResult, usersResult] = await Promise.all([
        apiRequest(() => api.dashboard.stats.get()),
        apiRequest(() => api.dashboard.activities.get()),
        apiRequest(() => api.dashboard.users.get())
      ]);

      // 检查是否有错误
      if (statsResult.error) {
        setError(statsResult.error.msg);
        return;
      }
      if (activitiesResult.error) {
        setError(activitiesResult.error.msg);
        return;
      }
      if (usersResult.error) {
        setError(usersResult.error.msg);
        return;
      }

      // 组合数据
      if (statsResult.data && activitiesResult.data && usersResult.data) {
        setData({
          stats: statsResult.data,
          recentActivities: activitiesResult.data,
          riskUsers: usersResult.data
        });
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError('获取仪表板数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refreshData,
    setError
  };
}