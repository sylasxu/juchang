import { useState, useEffect, useCallback } from 'react';
import { api, apiRequest, type ApiError } from '@/lib/api';

export interface Activity {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creator?: {
    id: string;
    nickname: string;
    avatarUrl?: string;
  };
  type: 'food' | 'entertainment' | 'sports' | 'study' | 'other';
  status: 'published' | 'full' | 'completed' | 'cancelled' | 'disputed';
  maxParticipants: number;
  currentParticipants: number;
  startAt: string;
  endAt?: string;
  locationName: string;
  address: string;
  location: [number, number];
  feeType: 'free' | 'aa' | 'treat';
  estimatedCost: number;
  isBoosted: boolean;
  isPinPlus: boolean;
  isLocationBlurred: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFilters {
  search?: string;
  status?: 'all' | 'published' | 'completed' | 'cancelled' | 'disputed';
  type?: 'all' | 'food' | 'entertainment' | 'sports' | 'study' | 'other';
  riskLevel?: 'all' | 'low' | 'medium' | 'high';
  page?: number;
  limit?: number;
}

export interface ActivityListResponse {
  data: Activity[];
  total: number;
  page: number;
  totalPages: number;
}

export function useActivities(filters: ActivityFilters = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters.page || 1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await apiRequest(() =>
      api.activities.get({
        query: {
          page: filters.page || page,
          limit: filters.limit || 20,
          search: filters.search,
          status: filters.status === 'all' ? undefined : filters.status,
          type: filters.type === 'all' ? undefined : filters.type,
          riskLevel: filters.riskLevel === 'all' ? undefined : filters.riskLevel,
        }
      })
    );

    if (apiError) {
      setError(apiError);
    } else if (data) {
      setActivities(data.data);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    }

    setLoading(false);
  }, [filters, page]);

  const cancelActivity = useCallback(async (activityId: string, reason?: string) => {
    const { error: apiError } = await apiRequest(() =>
      api.activities[activityId].cancel.post({
        reason
      })
    );

    if (apiError) {
      setError(apiError);
      return false;
    }

    // 更新本地状态
    setActivities(prev => prev.map(activity => 
      activity.id === activityId ? { ...activity, status: 'cancelled' as const } : activity
    ));
    return true;
  }, []);

  const resolveDispute = useCallback(async (activityId: string, resolution: string) => {
    const { error: apiError } = await apiRequest(() =>
      api.activities[activityId].resolve.post({
        resolution
      })
    );

    if (apiError) {
      setError(apiError);
      return false;
    }

    // 更新本地状态
    setActivities(prev => prev.map(activity => 
      activity.id === activityId ? { ...activity, status: 'completed' as const } : activity
    ));
    return true;
  }, []);

  const refreshActivities = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    total,
    page,
    totalPages,
    cancelActivity,
    resolveDispute,
    refreshActivities,
    setPage,
    setError
  };
}