import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  useUserGrowthTrend, 
  useActivityTypeDistribution, 
  useRevenueTrend,
  useGeographicDistribution 
} from '@/hooks/use-dashboard'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { format } from 'date-fns'

// 颜色配置
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function Analytics() {
  return (
    <div className='space-y-6'>
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">用户分析</TabsTrigger>
          <TabsTrigger value="activities">活动分析</TabsTrigger>
          <TabsTrigger value="financial">财务分析</TabsTrigger>
          <TabsTrigger value="geographic">地理分布</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserAnalytics />
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <ActivityAnalytics />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialAnalytics />
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <GeographicAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 用户分析组件
function UserAnalytics() {
  const { data: growthData, isLoading: growthLoading } = useUserGrowthTrend(30)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      {/* 用户增长趋势 */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>用户增长趋势</CardTitle>
          <CardDescription>过去30天的用户增长情况</CardDescription>
        </CardHeader>
        <CardContent>
          {growthLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData?.map(item => ({
                date: format(new Date(item.date), 'MM/dd'),
                totalUsers: item.totalUsers,
                newUsers: item.newUsers,
                activeUsers: item.activeUsers,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalUsers" 
                  stroke="#8884d8" 
                  name="总用户数"
                />
                <Line 
                  type="monotone" 
                  dataKey="newUsers" 
                  stroke="#82ca9d" 
                  name="新增用户"
                />
                <Line 
                  type="monotone" 
                  dataKey="activeUsers" 
                  stroke="#ffc658" 
                  name="活跃用户"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 用户参与度指标 */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>用户参与度</CardTitle>
          <CardDescription>关键参与度指标</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">日活跃用户率</span>
            <span className="text-2xl font-bold">23.5%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">周活跃用户率</span>
            <span className="text-2xl font-bold">45.2%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">月活跃用户率</span>
            <span className="text-2xl font-bold">67.8%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">平均会话时长</span>
            <span className="text-2xl font-bold">12m 34s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">用户留存率 (7天)</span>
            <span className="text-2xl font-bold">78.9%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 活动分析组件
function ActivityAnalytics() {
  const { data: typeDistribution, isLoading: typeLoading } = useActivityTypeDistribution()

  // 转换数据格式用于饼图
  const pieData = Object.entries(typeDistribution || {}).map(([type, count], index) => ({
    name: getActivityTypeName(type),
    value: count,
    fill: COLORS[index % COLORS.length]
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      {/* 活动类型分布 */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>活动类型分布</CardTitle>
          <CardDescription>各类型活动的数量分布</CardDescription>
        </CardHeader>
        <CardContent>
          {typeLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 活动关键指标 */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>活动关键指标</CardTitle>
          <CardDescription>活动相关的重要数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">活动完成率</span>
            <span className="text-2xl font-bold">85.3%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">平均参与人数</span>
            <span className="text-2xl font-bold">4.2人</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">活动取消率</span>
            <span className="text-2xl font-bold">8.7%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">热门时段</span>
            <span className="text-2xl font-bold">19:00-21:00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">平均活动时长</span>
            <span className="text-2xl font-bold">2.5小时</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 财务分析组件
function FinancialAnalytics() {
  const { data: revenueData, isLoading: revenueLoading } = useRevenueTrend(30)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      {/* 收入趋势 */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>收入趋势</CardTitle>
          <CardDescription>过去30天的收入变化</CardDescription>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData?.map(item => ({
                date: format(new Date(item.date), 'MM/dd'),
                revenue: item.revenue,
                transactions: item.transactions,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `¥${value}` : value,
                    name === 'revenue' ? '收入' : '交易数'
                  ]}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="收入" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 财务关键指标 */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>财务关键指标</CardTitle>
          <CardDescription>重要的财务数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">月收入</span>
            <span className="text-2xl font-bold">¥89,432</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">平均客单价</span>
            <span className="text-2xl font-bold">¥23.5</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">付费用户率</span>
            <span className="text-2xl font-bold">15.8%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">退款率</span>
            <span className="text-2xl font-bold">2.3%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">会员转化率</span>
            <span className="text-2xl font-bold">8.9%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 地理分析组件
function GeographicAnalytics() {
  const { isLoading: geoLoading } = useGeographicDistribution()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 城市分布 */}
      <Card>
        <CardHeader>
          <CardTitle>城市分布</CardTitle>
          <CardDescription>用户和活动的地理分布</CardDescription>
        </CardHeader>
        <CardContent>
          {geoLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="space-y-4">
              <SimpleBarList
                items={[
                  { name: '北京', value: 2543 },
                  { name: '上海', value: 1876 },
                  { name: '深圳', value: 1234 },
                  { name: '广州', value: 987 },
                  { name: '杭州', value: 765 },
                ]}
                barClass="bg-primary"
                valueFormatter={(n) => `${n}人`}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 热门区域 */}
      <Card>
        <CardHeader>
          <CardTitle>热门区域</CardTitle>
          <CardDescription>活动最活跃的区域</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SimpleBarList
              items={[
                { name: '朝阳区', value: 456 },
                { name: '海淀区', value: 389 },
                { name: '西城区', value: 234 },
                { name: '东城区', value: 198 },
                { name: '丰台区', value: 156 },
              ]}
              barClass="bg-green-500"
              valueFormatter={(n) => `${n}个活动`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 工具函数
function getActivityTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    sports: '运动健身',
    food: '美食聚餐',
    entertainment: '娱乐休闲',
    study: '学习交流',
    travel: '旅游出行',
    social: '社交聚会',
    business: '商务活动',
    other: '其他',
  }
  return typeNames[type] || type
}

// 简单条形图列表组件
function SimpleBarList({
  items,
  valueFormatter,
  barClass,
}: {
  items: { name: string; value: number }[]
  valueFormatter: (n: number) => string
  barClass: string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className='space-y-3'>
      {items.map((i) => {
        const width = `${Math.round((i.value / max) * 100)}%`
        return (
          <li key={i.name} className='flex items-center justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='text-muted-foreground mb-1 truncate text-xs'>
                {i.name}
              </div>
              <div className='bg-muted h-2.5 w-full rounded-full'>
                <div
                  className={`h-2.5 rounded-full ${barClass}`}
                  style={{ width }}
                />
              </div>
            </div>
            <div className='ps-2 text-xs font-medium tabular-nums'>
              {valueFormatter(i.value)}
            </div>
          </li>
        )
      })}
    </ul>
  )
}