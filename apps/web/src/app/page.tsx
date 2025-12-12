'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';
import { ToastManager } from '@/components/ui/Toast';
import SafeTime from '@/components/ui/SafeTime';
import { useDashboard } from '@/hooks/useDashboard';

export default function AdminDashboard() {
  // 使用真实的仪表板数据
  const {
    data,
    loading,
    error,
    lastUpdated,
    refreshData,
    setError
  } = useDashboard();

  // 处理刷新
  const handleRefresh = async () => {
    await refreshData();
    if (!error) {
      ToastManager.success('数据已刷新');
    }
  };

  // 自动刷新
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // 每5分钟自动刷新

    return () => clearInterval(interval);
  }, [refreshData]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据概览</h1>
            <p className="text-gray-500 mt-1">
              聚场平台运营数据总览 · 最后更新: 
              <SafeTime 
                date={lastUpdated || undefined} 
                format="time" 
                fallback="--:--:--" 
              />
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span>刷新数据</span>
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <ErrorAlert
            error={{ code: 500, msg: error }}
            onRetry={refreshData}
            onDismiss={() => setError(null)}
          />
        )}

        {/* 核心指标 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="总用户数"
              value={data.stats.totalUsers}
              change={{ value: '12.5%', type: 'increase', period: '较上月' }}
              icon="👥"
              iconBg="bg-blue-50"
            />
            <StatCard
              title="活跃用户"
              value={data.stats.activeUsers}
              change={{ value: '8.2%', type: 'increase', period: '较上周' }}
              icon="🔥"
              iconBg="bg-green-50"
            />
            <StatCard
              title="今日收入"
              value={`¥${data.stats.todayRevenue.toLocaleString()}`}
              change={{ value: '15.3%', type: 'increase', period: '较昨日' }}
              icon="💰"
              iconBg="bg-yellow-50"
            />
            <StatCard
              title="付费转化率"
              value={`${data.stats.conversionRate}%`}
              change={{ value: '2.1%', type: 'increase', period: '较上月' }}
              icon="📈"
              iconBg="bg-purple-50"
            />
            <StatCard
              title="履约率"
              value={`${data.stats.avgFulfillmentRate}%`}
              change={{ value: '1.2%', type: 'decrease', period: '较上月' }}
              icon="✅"
              iconBg="bg-green-50"
            />
            <StatCard
              title="总活动数"
              value={data.stats.totalActivities}
              change={{ value: '18.7%', type: 'increase', period: '较上月' }}
              icon="🎯"
              iconBg="bg-orange-50"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无数据</p>
          </div>
        )}

        {/* 最近活动 */}
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">最近活动</h3>
            <a href="/activities" className="text-sm text-blue-600 hover:text-blue-700 font-medium">查看全部</a>
          </div>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-4 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : data?.recentActivities.length ? (
            <div className="space-y-4">
              {data.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.status === 'active' ? 'bg-green-400' :
                      activity.status === 'completed' ? 'bg-gray-400' :
                      'bg-red-400'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">发起人: {activity.creator} · {activity.participants}人参与</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">¥{activity.revenue}</p>
                    <p className={`text-sm ${
                      activity.status === 'active' ? 'text-green-600' :
                      activity.status === 'completed' ? 'text-gray-500' :
                      'text-red-600'
                    }`}>
                      {activity.status === 'active' ? '进行中' :
                       activity.status === 'completed' ? '已完成' :
                       '有争议'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无最近活动</p>
            </div>
          )}
        </div>

        {/* 风险用户 */}
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">风险用户监控</h3>
            <a href="/users" className="text-sm text-red-600 hover:text-red-700 font-medium">处理全部</a>
          </div>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-4 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-40"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : data?.riskUsers.length ? (
            <div className="space-y-4">
              {data.riskUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      user.risk === 'high' ? 'bg-red-400' : 'bg-yellow-400'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.phone} · 履约率 {user.fulfillmentRate}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{user.disputes} 次争议</p>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">查看详情</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无风险用户</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
