/**
 * Mock 数据服务
 * 用于 Admin 前端演示功能，等待后端 API 实现后替换
 */

// ==================== Moderation ====================
export const mockModerationQueue = {
  data: [
    {
      id: '1',
      type: 'activity' as const,
      targetId: 'act-1',
      targetType: 'activity',
      title: '周末徒步活动',
      description: '被举报包含不当内容',
      reportReason: '虚假信息',
      riskScore: 65,
      priority: 'high' as const,
      status: 'pending' as const,
      reportedBy: { id: 'user-1', nickname: '用户A' },
      reportedAt: new Date().toISOString(),
      assignedTo: null,
    },
    {
      id: '2',
      type: 'user' as const,
      targetId: 'user-2',
      targetType: 'user',
      title: '用户资料审核',
      description: '头像违规',
      reportReason: '不当头像',
      riskScore: 45,
      priority: 'medium' as const,
      status: 'pending' as const,
      reportedBy: { id: 'user-3', nickname: '用户B' },
      reportedAt: new Date(Date.now() - 3600000).toISOString(),
      assignedTo: { id: 'mod-1', nickname: '审核员A' },
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
  hasMore: false,
}

export const mockModerationStats = {
  pending: 25,
  approved: 180,
  rejected: 45,
  escalated: 8,
  total: 258,
}

export const mockModerators = {
  data: [
    { id: 'mod-1', nickname: '审核员A', workload: 25 },
    { id: 'mod-2', nickname: '审核员B', workload: 18 },
    { id: 'mod-3', nickname: '审核员C', workload: 32 },
  ]
}


// ==================== Risk Management ====================
export const mockRiskStats = {
  highRisk: 12,
  mediumRisk: 45,
  lowRisk: 180,
  total: 237,
}

export const mockRiskAssessments = {
  data: [],
  total: 0,
  page: 1,
  limit: 20,
}

export const mockRiskTrends = {
  data: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    highRisk: Math.floor(Math.random() * 5),
    mediumRisk: Math.floor(Math.random() * 15),
    lowRisk: Math.floor(Math.random() * 30),
  }))
}

// ==================== Premium Services ====================
export const mockPremiumStats = {
  totalMembers: 1250,
  activeMembers: 980,
  revenue: 125000,
  conversionRate: 12.5,
}

export const mockMembershipDistribution = {
  basic: 8500,
  premium: 980,
  vip: 270,
  total: 9750,
}

export const mockAIQuotaUsage = {
  totalQuota: 100000,
  usedQuota: 65000,
  remainingQuota: 35000,
  usageByService: {
    chatbot: 25000,
    recommendation: 20000,
    translation: 12000,
    moderation: 8000,
  },
  usagePatterns: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usage: Math.floor(Math.random() * 5000) + 3000,
  })),
  topUsers: [
    { userId: '1', nickname: '用户A', usage: 1200, percentage: 1.8 },
    { userId: '2', nickname: '用户B', usage: 980, percentage: 1.5 },
    { userId: '3', nickname: '用户C', usage: 850, percentage: 1.3 },
  ],
}

// ==================== Geography ====================
export const mockHeatmapData = {
  data: Array.from({ length: 100 }, () => ({
    lat: 39.9 + (Math.random() - 0.5) * 0.2,
    lng: 116.4 + (Math.random() - 0.5) * 0.2,
    intensity: Math.random(),
    count: Math.floor(Math.random() * 50) + 1,
  }))
}

export const mockUserDistribution = {
  data: [
    { region: '北京', count: 2500, percentage: 25 },
    { region: '上海', count: 2200, percentage: 22 },
    { region: '广州', count: 1800, percentage: 18 },
    { region: '深圳', count: 1600, percentage: 16 },
    { region: '杭州', count: 1200, percentage: 12 },
    { region: '其他', count: 700, percentage: 7 },
  ],
}

export const mockRegionPerformance = {
  data: [
    { region: '北京', activities: 450, engagement: 0.85, avgParticipants: 8.5 },
    { region: '上海', activities: 380, engagement: 0.78, avgParticipants: 7.2 },
    { region: '广州', activities: 320, engagement: 0.72, avgParticipants: 6.8 },
    { region: '深圳', activities: 290, engagement: 0.75, avgParticipants: 7.0 },
  ],
}


// ==================== Communication ====================
export const mockCommunicationStats = {
  totalMessages: 15000,
  moderatedMessages: 250,
  flaggedMessages: 45,
  notifications: 1200,
  supportRequests: 85,
  openRequests: 23,
  avgResponseTime: 2.5,
}

export const mockChatMessages = {
  data: [],
  total: 0,
  page: 1,
  limit: 20,
}

export const mockNotifications = {
  data: [],
  total: 0,
  page: 1,
  limit: 20,
}

export const mockSupportRequests = {
  data: [],
  total: 0,
  page: 1,
  limit: 20,
}

// ==================== System ====================
export const mockSystemHealth = {
  status: 'healthy' as const,
  services: [
    { name: 'database', status: 'healthy', uptime: 99.9, responseTime: 12 },
    { name: 'redis', status: 'healthy', uptime: 99.8, responseTime: 2 },
    { name: 'api', status: 'healthy', uptime: 99.7, responseTime: 45 },
    { name: 'storage', status: 'healthy', uptime: 99.5, responseTime: 85 },
  ],
  metrics: {
    cpu: 45.2,
    memory: 68.5,
    disk: 32.1,
    network: 25.8,
  }
}

export const mockSystemConfigs = {
  data: [
    { id: '1', key: 'max_participants', value: '50', type: 'number', category: 'activity' },
    { id: '2', key: 'auto_approve', value: 'false', type: 'boolean', category: 'moderation' },
  ],
}

export const mockBusinessRules = {
  data: [
    { id: '1', name: '活动审核规则', key: 'activity_review', enabled: true },
    { id: '2', name: '用户注册规则', key: 'user_registration', enabled: true },
    { id: '3', name: '支付验证规则', key: 'payment_verify', enabled: true },
  ]
}

export const mockFeatureFlags = {
  data: [
    { id: '1', name: 'new_ui', displayName: '新版UI', enabled: true },
    { id: '2', name: 'ai_recommendations', displayName: 'AI推荐', enabled: false },
    { id: '3', name: 'live_chat', displayName: '实时聊天', enabled: true },
  ]
}

export const mockAnnouncements = {
  data: [
    {
      id: '1',
      title: '系统维护通知',
      content: '系统将于今晚进行维护',
      type: 'maintenance',
      status: 'active',
      createdAt: new Date().toISOString(),
    }
  ]
}

export const mockAuditLogs = {
  data: [],
  total: 0,
  page: 1,
  limit: 20,
}

export const mockMaintenanceStatus = {
  data: [
    {
      id: '1',
      title: '数据库维护',
      status: 'scheduled',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: 120,
    }
  ]
}

// ==================== Analytics ====================
export const mockAnalyticsOverview = {
  users: { total: 12500, active: 8900, growth: 12.5 },
  activities: { total: 3500, active: 280, growth: 8.2 },
  transactions: { total: 45000, revenue: 125000, growth: 15.3 },
  engagement: { avgSessionTime: 25, avgActivitiesPerUser: 2.3 },
}

export const mockUserGrowth = {
  data: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    users: Math.floor(Math.random() * 100) + 50,
    activeUsers: Math.floor(Math.random() * 80) + 30,
  }))
}

export const mockRevenueData = {
  data: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    revenue: Math.floor(Math.random() * 10000) + 5000,
    transactions: Math.floor(Math.random() * 100) + 20,
  }))
}

export const mockGeographicDistribution = {
  regions: [
    { name: '北京', users: 2500, activities: 450 },
    { name: '上海', users: 2200, activities: 380 },
    { name: '广州', users: 1800, activities: 320 },
    { name: '深圳', users: 1600, activities: 290 },
    { name: '杭州', users: 1200, activities: 220 },
  ]
}