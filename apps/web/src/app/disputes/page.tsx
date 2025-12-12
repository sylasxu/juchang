'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import StatCard from '@/components/StatCard';

export default function DisputesPage() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // 模拟争议数据
  const disputes = [
    {
      id: '1',
      activityTitle: '周末火锅局',
      disputeType: 'absence',
      reporter: '张三',
      reported: '李四',
      description: '李四未按时到场，但声称已到场',
      status: 'pending',
      priority: 'medium',
      createdAt: '2025-12-12 10:30',
      evidence: ['聊天记录截图', '位置信息'],
      autoResolveAt: '2025-12-13 10:30'
    },
    {
      id: '2',
      activityTitle: '剧本杀推理',
      disputeType: 'behavior',
      reporter: '王五',
      reported: '赵六',
      description: '赵六在活动中态度恶劣，影响其他参与者体验',
      status: 'investigating',
      priority: 'high',
      createdAt: '2025-12-11 16:45',
      evidence: ['其他参与者证言', '活动群聊记录'],
      autoResolveAt: null
    },
    {
      id: '3',
      activityTitle: '夜跑小分队',
      disputeType: 'content',
      reporter: '系统检测',
      reported: '孙七',
      description: '活动内容与实际描述不符，疑似虚假活动',
      status: 'resolved',
      priority: 'high',
      createdAt: '2025-12-10 14:20',
      evidence: ['AI风险评估报告', '用户举报'],
      resolution: '确认为虚假活动，已封禁用户账号'
    },
  ];

  const disputeStats = {
    total: 47,
    pending: 12,
    investigating: 8,
    resolved: 27
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'investigating': return 'text-blue-600 bg-blue-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDisputeTypeText = (type: string) => {
    switch (type) {
      case 'absence': return '未到场争议';
      case 'behavior': return '行为不当';
      case 'content': return '内容违规';
      case 'payment': return '支付争议';
      default: return '其他';
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesStatus = filterStatus === 'all' || dispute.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || dispute.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">争议处理</h1>
          <p className="text-gray-500 mt-1">处理用户争议，维护平台秩序</p>
        </div>

        {/* 争议统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="总争议数"
            value={disputeStats.total}
            change={{ value: '5.2%', type: 'decrease', period: '较上月' }}
            icon="⚖️"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="待处理"
            value={disputeStats.pending}
            change={{ value: '2.1%', type: 'increase', period: '较昨日' }}
            icon="⏳"
            iconBg="bg-yellow-50"
          />
          <StatCard
            title="调查中"
            value={disputeStats.investigating}
            change={{ value: '1.5%', type: 'decrease', period: '较昨日' }}
            icon="🔍"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="已解决"
            value={disputeStats.resolved}
            change={{ value: '8.7%', type: 'increase', period: '较上周' }}
            icon="✅"
            iconBg="bg-green-50"
          />
        </div>

        {/* 争议列表 */}
        <div className="bg-white rounded-xl">
          {/* 筛选 */}
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="investigating">调查中</option>
                  <option value="resolved">已解决</option>
                  <option value="rejected">已驳回</option>
                </select>
                
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部优先级</option>
                  <option value="high">高优先级</option>
                  <option value="medium">中优先级</option>
                  <option value="low">低优先级</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  批量处理
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  导出报告
                </button>
              </div>
            </div>
          </div>

          {/* 争议表格 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">争议信息</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">涉及用户</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">类型</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">优先级</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">自动解决时间</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDisputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{dispute.activityTitle}</p>
                        <p className="text-sm text-gray-500 mt-1">{dispute.description}</p>
                        <p className="text-xs text-gray-400 mt-1">创建时间: {dispute.createdAt}</p>
                        {dispute.evidence.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {dispute.evidence.map((item, index) => (
                              <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                📎 {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">举报人: {dispute.reporter}</p>
                        <p className="text-gray-500">被举报: {dispute.reported}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {getDisputeTypeText(dispute.disputeType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(dispute.priority)}`}>
                        {dispute.priority === 'high' ? '高' : 
                         dispute.priority === 'medium' ? '中' : '低'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dispute.status)}`}>
                        {dispute.status === 'pending' ? '待处理' :
                         dispute.status === 'investigating' ? '调查中' :
                         dispute.status === 'resolved' ? '已解决' : '已驳回'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {dispute.autoResolveAt ? (
                        <div className="text-sm">
                          <p className="text-gray-900">{dispute.autoResolveAt}</p>
                          <p className="text-xs text-gray-500">24小时后自动解决</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">手动处理</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          查看详情
                        </button>
                        {dispute.status === 'pending' && (
                          <>
                            <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                              接受
                            </button>
                            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                              驳回
                            </button>
                          </>
                        )}
                        {dispute.status === 'investigating' && (
                          <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
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
              显示 1-{filteredDisputes.length} 条，共 {disputes.length} 条记录
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">上一页</button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
              <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">2</button>
              <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">下一页</button>
            </div>
          </div>
        </div>

        {/* 处理规则说明 */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">争议处理规则</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">自动处理规则</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 未到场争议：24小时内无申诉自动生效</li>
                <li>• 轻微行为问题：系统自动警告处理</li>
                <li>• 重复违规：自动升级处理等级</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">人工处理标准</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 高风险用户争议需人工审核</li>
                <li>• 涉及金额争议需详细调查</li>
                <li>• 恶意举报将反向处罚</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}