'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { ToastManager } from '@/components/ui/Toast';
import { ExportManager } from '@/lib/export';
import { useUsers, type UserFilters, type User } from '@/hooks/useUsers';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked' | 'inactive'>('all');
  const [filterMembership, setFilterMembership] = useState<'all' | 'free' | 'pro'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'block' | 'unblock';
    userId: string;
    userName: string;
  }>({
    isOpen: false,
    type: 'block',
    userId: '',
    userName: ''
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 构建过滤器
  const filters: UserFilters = useMemo(() => ({
    search: searchTerm || undefined,
    status: filterStatus,
    membershipType: filterMembership,
    limit: 20
  }), [searchTerm, filterStatus, filterMembership]);

  // 使用真实数据
  const {
    users,
    loading,
    error,
    total,
    page,
    totalPages,
    blockUser,
    unblockUser,
    refreshUsers,
    setPage,
    setError
  } = useUsers(filters);

  // 计算统计数据
  const userStats = useMemo(() => {
    const active = users.filter(u => !u.isBlocked).length;
    const pro = users.filter(u => u.membershipType === 'pro').length;
    const blocked = users.filter(u => u.isBlocked).length;
    
    return {
      total,
      active,
      pro,
      blocked
    };
  }, [users, total]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'blocked': return 'text-red-600 bg-red-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // 处理用户操作
  const handleBlockUser = async (userId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'block',
      userId,
      userName
    });
  };

  const handleUnblockUser = async (userId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'unblock',
      userId,
      userName
    });
  };

  const executeUserAction = async () => {
    setActionLoading(confirmDialog.userId);
    
    let success = false;
    if (confirmDialog.type === 'block') {
      success = await blockUser(confirmDialog.userId);
      if (success) {
        ToastManager.success('用户已成功封禁');
      }
    } else {
      success = await unblockUser(confirmDialog.userId);
      if (success) {
        ToastManager.success('用户已成功解封');
      }
    }
    
    setActionLoading(null);
    setConfirmDialog({ isOpen: false, type: 'block', userId: '', userName: '' });
  };

  const handleExportUsers = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      ExportManager.exportToCSV(
        users,
        `用户数据_${today}`,
        [
          { key: 'nickname', label: '用户名' },
          { key: 'phoneNumber', label: '手机号' },
          { 
            key: 'membershipType', 
            label: '会员类型',
            formatter: ExportManager.formatMembershipType
          },
          { key: 'participationCount', label: '参与次数' },
          { key: 'fulfillmentCount', label: '履约次数' },
          { 
            key: 'fulfillmentCount', 
            label: '履约率',
            formatter: (user: User) => ExportManager.formatFulfillmentRate(user.participationCount, user.fulfillmentCount)
          },
          { 
            key: 'isBlocked', 
            label: '是否封禁',
            formatter: ExportManager.formatBoolean
          },
          { 
            key: 'createdAt', 
            label: '注册时间',
            formatter: ExportManager.formatDate
          },
          { 
            key: 'lastActiveAt', 
            label: '最后活跃',
            formatter: (date: string) => date ? ExportManager.formatDate(date) : '未知'
          }
        ]
      );
      ToastManager.success('用户数据导出成功');
    } catch (error) {
      ToastManager.error('导出失败：' + (error as Error).message);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refreshUsers();
  };

  const calculateFulfillmentRate = (user: any) => {
    if (user.participationCount === 0) return 0;
    return Math.round((user.fulfillmentCount / user.participationCount) * 100);
  };

  const getRiskLevel = (fulfillmentRate: number) => {
    if (fulfillmentRate >= 80) return 'low';
    if (fulfillmentRate >= 60) return 'medium';
    return 'high';
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-500 mt-1">管理平台用户，监控用户行为和风险</p>
        </div>

        {/* 用户统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="总用户数"
            value={userStats.total}
            change={{ value: '12.5%', type: 'increase', period: '较上月' }}
            icon="👥"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="活跃用户"
            value={userStats.active}
            change={{ value: '8.2%', type: 'increase', period: '较上周' }}
            icon="🔥"
            iconBg="bg-green-50"
          />
          <StatCard
            title="Pro 会员"
            value={userStats.pro}
            change={{ value: '15.3%', type: 'increase', period: '较上月' }}
            icon="👑"
            iconBg="bg-yellow-50"
          />
          <StatCard
            title="封禁用户"
            value={userStats.blocked}
            change={{ value: '2.1%', type: 'decrease', period: '较上月' }}
            icon="🚫"
            iconBg="bg-red-50"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <ErrorAlert
            error={error}
            onRetry={refreshUsers}
            onDismiss={() => setError(null)}
          />
        )}

        {/* 用户列表 */}
        <div className="bg-white rounded-xl">
          {/* 搜索和筛选 */}
          <div className="p-6 space-y-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="搜索用户名或手机号..."
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
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部状态</option>
                  <option value="active">正常</option>
                  <option value="blocked">已封禁</option>
                  <option value="inactive">不活跃</option>
                </select>

                <select
                  value={filterMembership}
                  onChange={(e) => setFilterMembership(e.target.value as any)}
                  className="px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部会员</option>
                  <option value="free">免费用户</option>
                  <option value="pro">Pro会员</option>
                </select>
                
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  <span>搜索</span>
                </button>

                <button 
                  onClick={handleExportUsers}
                  disabled={loading || users.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>导出数据</span>
                </button>
              </div>
            </form>
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-500">加载用户数据...</span>
            </div>
          )}

          {/* 空状态 */}
          {!loading && users.length === 0 && !error && (
            <EmptyState
              icon="👥"
              title="暂无用户数据"
              description="没有找到符合条件的用户，请尝试调整筛选条件"
              action={{
                label: "刷新数据",
                onClick: refreshUsers
              }}
            />
          )}

          {/* 用户表格 */}
          {!loading && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">用户信息</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">履约率</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">活动数据</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">会员类型</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">风险等级</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => {
                    const fulfillmentRate = calculateFulfillmentRate(user);
                    const riskLevel = getRiskLevel(fulfillmentRate);
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.nickname} className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs text-gray-500">{user.nickname[0]}</span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{user.nickname}</p>
                              <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                              <p className="text-xs text-gray-400">注册: {new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">{fulfillmentRate}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    fulfillmentRate >= 80 ? 'bg-green-500' :
                                    fulfillmentRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(fulfillmentRate, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900">参与 {user.participationCount} 次</p>
                            <p className="text-gray-500">履约 {user.fulfillmentCount} 次</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.membershipType === 'pro' 
                              ? 'text-yellow-600 bg-yellow-50' 
                              : 'text-gray-600 bg-gray-50'
                          }`}>
                            {user.membershipType === 'pro' ? 'Pro 会员' : '免费用户'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(riskLevel)}`}>
                            {riskLevel === 'low' ? '低风险' : 
                             riskLevel === 'medium' ? '中风险' : '高风险'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.isBlocked ? 'blocked' : 'active')}`}>
                            {user.isBlocked ? '已封禁' : '正常'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => setSelectedUser(user)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              查看
                            </button>
                            {!user.isBlocked ? (
                              <button 
                                onClick={() => handleBlockUser(user.id, user.nickname)}
                                disabled={actionLoading === user.id}
                                className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 flex items-center space-x-1"
                              >
                                {actionLoading === user.id && <LoadingSpinner size="sm" />}
                                <span>封禁</span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUnblockUser(user.id, user.nickname)}
                                disabled={actionLoading === user.id}
                                className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50 flex items-center space-x-1"
                              >
                                {actionLoading === user.id && <LoadingSpinner size="sm" />}
                                <span>解封</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {!loading && users.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                显示第 {page} 页，共 {totalPages} 页，总计 {total} 条记录
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  上一页
                </button>
                
                {/* 页码按钮 */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages, page - 2 + i));
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded ${
                        pageNum === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 确认对话框 */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.type === 'block' ? '封禁用户' : '解封用户'}
          message={
            confirmDialog.type === 'block'
              ? `确定要封禁用户 "${confirmDialog.userName}" 吗？封禁后该用户将无法使用平台功能。`
              : `确定要解封用户 "${confirmDialog.userName}" 吗？解封后该用户将恢复正常使用权限。`
          }
          type={confirmDialog.type === 'block' ? 'danger' : 'warning'}
          confirmText={confirmDialog.type === 'block' ? '确认封禁' : '确认解封'}
          onConfirm={executeUserAction}
          onCancel={() => setConfirmDialog({ isOpen: false, type: 'block', userId: '', userName: '' })}
          loading={!!actionLoading}
        />

        {/* 用户详情模态框 */}
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title="用户详情"
          size="lg"
        >
          {selectedUser && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">基本信息</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      {selectedUser.avatarUrl ? (
                        <img src={selectedUser.avatarUrl} alt={selectedUser.nickname} className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-lg text-gray-500">{selectedUser.nickname[0]}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{selectedUser.nickname}</p>
                        <p className="text-sm text-gray-500">{selectedUser.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">注册时间:</span>
                        <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">最后活跃:</span>
                        <p className="font-medium">
                          {selectedUser.lastActiveAt 
                            ? new Date(selectedUser.lastActiveAt).toLocaleString()
                            : '未知'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">账户状态</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">会员类型:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        selectedUser.membershipType === 'pro' 
                          ? 'text-yellow-600 bg-yellow-50' 
                          : 'text-gray-600 bg-gray-50'
                      }`}>
                        {selectedUser.membershipType === 'pro' ? 'Pro 会员' : '免费用户'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">账户状态:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        selectedUser.isBlocked ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'
                      }`}>
                        {selectedUser.isBlocked ? '已封禁' : '正常'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">风险等级:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        getRiskColor(getRiskLevel(calculateFulfillmentRate(selectedUser)))
                      }`}>
                        {(() => {
                          const risk = getRiskLevel(calculateFulfillmentRate(selectedUser));
                          return risk === 'low' ? '低风险' : risk === 'medium' ? '中风险' : '高风险';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 活动统计 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">活动统计</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{selectedUser.participationCount}</p>
                    <p className="text-sm text-gray-500">参与次数</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{selectedUser.fulfillmentCount}</p>
                    <p className="text-sm text-gray-500">履约次数</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{calculateFulfillmentRate(selectedUser)}%</p>
                    <p className="text-sm text-gray-500">履约率</p>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  关闭
                </button>
                {!selectedUser.isBlocked ? (
                  <button
                    onClick={() => {
                      handleBlockUser(selectedUser.id, selectedUser.nickname);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    封禁用户
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleUnblockUser(selectedUser.id, selectedUser.nickname);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    解封用户
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}