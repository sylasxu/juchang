'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import StatCard from '@/components/StatCard';

export default function ActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // 模拟活动数据
  const activities = [
    {
      id: '1',
      title: '周末火锅局',
      creator: '张三',
      type: 'food',
      status: 'published',
      participants: { current: 4, max: 6 },
      startTime: '2025-12-14 19:00',
      location: '观音桥步行街',
      revenue: 12,
      isBoosted: true,
      isPinPlus: false,
      createdAt: '2025-12-12 14:30',
      riskLevel: 'low'
    },
    {
      id: '2',
      title: '夜跑小分队',
      creator: '李四',
      type: 'sports',
      status: 'completed',
      participants: { current: 8, max: 8 },
      startTime: '2025-12-11 20:00',
      location: '南滨路',
      revenue: 0,
      isBoosted: false,
      isPinPlus: false,
      createdAt: '2025-12-10 16:20',
      riskLevel: 'low'
    },
    {
      id: '3',
      title: '剧本杀推理',
      creator: '王五',
      type: 'entertainment',
      status: 'disputed',
      participants: { current: 6, max: 6 },
      startTime: '2025-12-10 14:00',
      location: '解放碑某剧本杀店',
      revenue: 24,
      isBoosted: false,
      isPinPlus: true,
      createdAt: '2025-12-09 10:15',
      riskLevel: 'high'
    },
  ];

  const activityStats = {
    total: 1892,
    active: 234,
    completed: 1534,
    disputed: 12
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      case 'disputed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'food': return 'text-orange-600 bg-orange-50';
      case 'sports': return 'text-green-600 bg-green-50';
      case 'entertainment': return 'text-purple-600 bg-purple-50';
      case 'study': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.includes(searchTerm) || activity.creator.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
    const matchesType = filterType === 'all' || activity.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">活动管理</h1>
          <p className="text-gray-500 mt-1">管理平台活动，监控活动质量和风险</p>
        </div>

        {/* 活动统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="总活动数"
            value={activityStats.total}
            change={{ value: '18.7%', type: 'increase', period: '较上月' }}
            icon="🎯"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="进行中"
            value={activityStats.active}
            change={{ value: '5.2%', type: 'increase', period: '较昨日' }}
            icon="🔥"
            iconBg="bg-green-50"
          />
          <StatCard
            title="已完成"
            value={activityStats.completed}
            change={{ value: '12.3%', type: 'increase', period: '较上周' }}
            icon="✅"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="有争议"
            value={activityStats.disputed}
            change={{ value: '2.1%', type: 'decrease', period: '较上月' }}
            icon="⚠️"
            iconBg="bg-red-50"
          />
        </div>

        {/* 活动列表 */}
        <div className="bg-white rounded-xl">
          {/* 搜索和筛选 */}
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="搜索活动标题或发起人..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部状态</option>
                  <option value="published">招募中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                  <option value="disputed">有争议</option>
                </select>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部类型</option>
                  <option value="food">聚餐</option>
                  <option value="sports">运动</option>
                  <option value="entertainment">娱乐</option>
                  <option value="study">学习</option>
                </select>
                
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  导出数据
                </button>
              </div>
            </div>
          </div>

          {/* 活动表格 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">活动信息</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">类型</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">参与情况</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">增值服务</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">收入</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">风险等级</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">发起人: {activity.creator}</p>
                        <p className="text-xs text-gray-400">{activity.location}</p>
                        <p className="text-xs text-gray-400">{activity.startTime}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(activity.type)}`}>
                        {activity.type === 'food' ? '聚餐' :
                         activity.type === 'sports' ? '运动' :
                         activity.type === 'entertainment' ? '娱乐' : '学习'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {activity.participants.current}/{activity.participants.max}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${(activity.participants.current / activity.participants.max) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        {activity.isBoosted && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded-full">
                            🚀 强力召唤
                          </span>
                        )}
                        {activity.isPinPlus && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium text-yellow-600 bg-yellow-50 rounded-full">
                            👑 黄金置顶
                          </span>
                        )}
                        {!activity.isBoosted && !activity.isPinPlus && (
                          <span className="text-xs text-gray-400">无</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">¥{activity.revenue}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(activity.riskLevel)}`}>
                        {activity.riskLevel === 'low' ? '低风险' : 
                         activity.riskLevel === 'medium' ? '中风险' : '高风险'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status === 'published' ? '招募中' :
                         activity.status === 'completed' ? '已完成' :
                         activity.status === 'cancelled' ? '已取消' : '有争议'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          查看
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                          编辑
                        </button>
                        {activity.status === 'disputed' && (
                          <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                            处理
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              显示 1-{filteredActivities.length} 条，共 {activities.length} 条记录
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">上一页</button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
              <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">2</button>
              <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">下一页</button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}