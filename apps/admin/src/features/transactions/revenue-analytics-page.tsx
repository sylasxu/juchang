import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// 预设时间范围
const timeRangePresets = [
  { label: '最近7天', value: '7d', start: () => subDays(new Date(), 7), end: () => new Date() },
  { label: '最近30天', value: '30d', start: () => subDays(new Date(), 30), end: () => new Date() },
  { label: '本月', value: 'thisMonth', start: () => startOfMonth(new Date()), end: () => endOfMonth(new Date()) },
  { label: '最近3个月', value: '3m', start: () => subMonths(new Date(), 3), end: () => new Date() },
  { label: '最近6个月', value: '6m', start: () => subMonths(new Date(), 6), end: () => new Date() },
  { label: '最近12个月', value: '12m', start: () => subMonths(new Date(), 12), end: () => new Date() },
];

// 产品颜色映射
const productColors = {
  boost: '#8884d8',
  pin_plus: '#82ca9d',
  fast_pass: '#ffc658',
  ai_pack: '#ff7300',
  pro_monthly: '#00ff00',
  ai_report: '#ff0000',
};

interface RevenueAnalyticsFilters {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  productTypes: string[];
}

export function RevenueAnalyticsPage() {
  const [filters, setFilters] = useState<RevenueAnalyticsFilters>({
    period: 'daily',
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    productTypes: [],
  });

  // 获取收入分析数据
  const { data, refetch } = useQuery({
    queryKey: ['revenue-analytics', filters],
    queryFn: async () => {
      // TODO: 使用 Eden Treaty 调用 API
      // const response = await api.admin.transactions.analytics.revenue.get({
      //   query: filters,
      // });
      // return response.data;
      
      // 模拟数据
      return {
        totalRevenue: 125000,
        revenueByProduct: {
          boost: 45000,
          pin_plus: 32000,
          fast_pass: 18000,
          ai_pack: 15000,
          pro_monthly: 15000,
        },
        revenueByPeriod: [
          { period: '2024-11-16', revenue: 4200, transactionCount: 28, refundAmount: 300 },
          { period: '2024-11-17', revenue: 3800, transactionCount: 25, refundAmount: 200 },
          { period: '2024-11-18', revenue: 5100, transactionCount: 34, refundAmount: 150 },
          { period: '2024-11-19', revenue: 4600, transactionCount: 31, refundAmount: 400 },
          { period: '2024-11-20', revenue: 5500, transactionCount: 37, refundAmount: 250 },
        ],
        conversionRates: {
          boost: 0.15,
          pin_plus: 0.08,
          fast_pass: 0.25,
          ai_pack: 0.12,
          pro_monthly: 0.05,
        },
        userSegmentAnalysis: {
          newUsers: { revenue: 35000, count: 180 },
          returningUsers: { revenue: 75000, count: 320 },
          proMembers: { revenue: 15000, count: 45 },
        },
        trends: [
          { date: '2024-11-16', revenue: 4200, transactions: 28, avgOrderValue: 150 },
          { date: '2024-11-17', revenue: 3800, transactions: 25, avgOrderValue: 152 },
          { date: '2024-11-18', revenue: 5100, transactions: 34, avgOrderValue: 150 },
          { date: '2024-11-19', revenue: 4600, transactions: 31, avgOrderValue: 148 },
          { date: '2024-11-20', revenue: 5500, transactions: 37, avgOrderValue: 149 },
        ],
      };
    },
  });

  // 处理时间范围预设选择
  const handleTimeRangePreset = (presetValue: string) => {
    const preset = timeRangePresets.find(p => p.value === presetValue);
    if (preset) {
      setFilters(prev => ({
        ...prev,
        startDate: preset.start(),
        endDate: preset.end(),
      }));
    }
  };

  // 产品收入饼图数据
  const pieChartData = useMemo(() => {
    if (!data?.revenueByProduct) return [];
    return Object.entries(data.revenueByProduct).map(([product, revenue]) => ({
      name: product,
      value: revenue / 100, // 转换为元
      color: productColors[product as keyof typeof productColors],
    }));
  }, [data?.revenueByProduct]);

  // 趋势图数据
  const trendChartData = useMemo(() => {
    if (!data?.trends) return [];
    return data.trends.map(item => ({
      ...item,
      revenue: item.revenue / 100, // 转换为元
      avgOrderValue: item.avgOrderValue / 100,
      date: format(new Date(item.date), 'MM-dd'),
    }));
  }, [data?.trends]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">收入分析</h1>
          <p className="text-muted-foreground">
            分析平台收入趋势、产品表现和用户群体数据
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出报告
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            时间范围和筛选
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">时间粒度</label>
              <Select
                value={filters.period}
                onValueChange={(value) =>
                  setFilters(prev => ({ ...prev, period: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">按天</SelectItem>
                  <SelectItem value="weekly">按周</SelectItem>
                  <SelectItem value="monthly">按月</SelectItem>
                  <SelectItem value="yearly">按年</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">快速选择</label>
              <Select onValueChange={handleTimeRangePreset}>
                <SelectTrigger>
                  <SelectValue placeholder="选择时间范围" />
                </SelectTrigger>
                <SelectContent>
                  {timeRangePresets.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">开始日期</label>
              <Input
                type="date"
                value={format(filters.startDate, 'yyyy-MM-dd')}
                onChange={(e) =>
                  e.target.value && setFilters(prev => ({ ...prev, startDate: new Date(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">结束日期</label>
              <Input
                type="date"
                value={format(filters.endDate, 'yyyy-MM-dd')}
                onChange={(e) =>
                  e.target.value && setFilters(prev => ({ ...prev, endDate: new Date(e.target.value) }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 关键指标卡片 */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总收入</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{(data.totalRevenue / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                较上期增长 12.5%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均订单价值</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{data.trends.length > 0 ? 
                  (data.trends.reduce((sum, item) => sum + item.avgOrderValue, 0) / data.trends.length / 100).toFixed(2) : 
                  '0.00'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingDown className="inline h-3 w-3 mr-1" />
                较上期下降 2.1%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">付费用户</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.userSegmentAnalysis.newUsers.count + data.userSegmentAnalysis.returningUsers.count}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                较上期增长 8.3%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">转化率</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(data.conversionRates).length > 0 ? 
                  (Object.values(data.conversionRates).reduce((sum, rate) => sum + rate, 0) / Object.values(data.conversionRates).length * 100).toFixed(1) : 
                  '0.0'
                }%
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                较上期增长 5.2%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 图表分析 */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">收入趋势</TabsTrigger>
          <TabsTrigger value="products">产品分析</TabsTrigger>
          <TabsTrigger value="users">用户群体</TabsTrigger>
          <TabsTrigger value="conversion">转化分析</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>收入趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `¥${value}` : value,
                      name === 'revenue' ? '收入' : name === 'transactions' ? '交易数' : '平均订单价值'
                    ]}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                    name="收入"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#82ca9d" 
                    name="交易数"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>产品收入分布</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`¥${value}`, '收入']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>产品转化率</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data && Object.entries(data.conversionRates).map(([product, rate]) => (
                  <div key={product} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{product}</span>
                      <span>{(rate * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={rate * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>用户群体收入分析</CardTitle>
            </CardHeader>
            <CardContent>
              {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ¥{(data.userSegmentAnalysis.newUsers.revenue / 100).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">新用户收入</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {data.userSegmentAnalysis.newUsers.count} 人
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ¥{(data.userSegmentAnalysis.returningUsers.revenue / 100).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">回头客收入</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {data.userSegmentAnalysis.returningUsers.count} 人
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ¥{(data.userSegmentAnalysis.proMembers.revenue / 100).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Pro会员收入</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {data.userSegmentAnalysis.proMembers.count} 人
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>转化漏斗分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                转化漏斗分析功能开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}