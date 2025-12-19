/**
 * Mock 数据服务
 * 用于 Admin 前端演示功能，等待后端 API 实现后替换
 */

// ==================== Analytics (Dashboard) ====================
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
    { name: '重庆', users: 3500, activities: 650 },
    { name: '成都', users: 2200, activities: 380 },
    { name: '贵阳', users: 1200, activities: 220 },
    { name: '昆明', users: 800, activities: 150 },
    { name: '其他', users: 500, activities: 100 },
  ]
}
