import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useModerationStats } from '@/hooks/use-moderation'

// 颜色配置
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function ModerationStats() {
  const { data: stats, isLoading } = useModerationStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // 模拟数据 - 实际应该从 API 获取
  const dailyStats = [
    { date: '12-10', pending: 45, approved: 32, rejected: 8 },
    { date: '12-11', pending: 52, approved: 28, rejected: 12 },
    { date: '12-12', pending: 38, approved: 41, rejected: 6 },
    { date: '12-13', pending: 61, approved: 35, rejected: 15 },
    { date: '12-14', pending: 43, approved: 38, rejected: 9 },
    { date: '12-15', pending: 55, approved: 42, rejected: 11 },
    { date: '12-16', pending: 48, approved: 45, rejected: 7 },
  ]

  const typeDistribution = [
    { name: '用户举报', value: 156, fill: COLORS[0] },
    { name: '活动审核', value: 89, fill: COLORS[1] },
    { name: '消息监控', value: 234, fill: COLORS[2] },
    { name: '系统标记', value: 67, fill: COLORS[3] },
  ]

  const moderatorPerformance = [
    { name: '张三', processed: 145, accuracy: 96 },
    { name: '李四', processed: 132, accuracy: 94 },
    { name: '王五', processed: 128, accuracy: 98 },
    { name: '赵六', processed: 115, accuracy: 92 },
    { name: '钱七', processed: 98, accuracy: 95 },
  ]

  const riskDistribution = [
    { level: '低风险', count: 234, color: '#10B981' },
    { level: '中风险', count: 156, color: '#F59E0B' },
    { level: '高风险', count: 89, color: '#EF4444' },
    { level: '极高风险', count: 23, color: '#DC2626' },
  ]

  return (
    <div className="space-y-6">
      {/* 第一行：趋势图表 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 每日审核趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>每日审核趋势</CardTitle>
            <CardDescription>过去7天的审核处理情况</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="#F59E0B" 
                  name="待审核"
                />
                <Line 
                  type="monotone" 
                  dataKey="approved" 
                  stroke="#10B981" 
                  name="已批准"
                />
                <Line 
                  type="monotone" 
                  dataKey="rejected" 
                  stroke="#EF4444" 
                  name="已拒绝"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 内容类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle>内容类型分布</CardTitle>
            <CardDescription>不同类型内容的审核占比</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 第二行：性能和风险分析 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 审核员绩效 */}
        <Card>
          <CardHeader>
            <CardTitle>审核员绩效</CardTitle>
            <CardDescription>审核员处理量和准确率统计</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={moderatorPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="processed" 
                  fill="#3B82F6" 
                  name="处理数量"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#10B981" 
                  name="准确率(%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 风险等级分布 */}
        <Card>
          <CardHeader>
            <CardTitle>风险等级分布</CardTitle>
            <CardDescription>不同风险等级的内容数量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskDistribution.map((item, index) => {
                const total = riskDistribution.reduce((sum, item) => sum + item.count, 0)
                const percentage = ((item.count / total) * 100).toFixed(1)
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {item.count} ({percentage}%)
                      </span>
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            backgroundColor: item.color,
                            width: `${percentage}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 第三行：关键指标 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均处理时间</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3小时</div>
            <p className="text-xs text-muted-foreground">
              比上周减少 15%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">审核准确率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.8%</div>
            <p className="text-xs text-muted-foreground">
              比上周提升 2.1%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">申诉率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">
              比上周减少 0.8%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">自动化率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67.5%</div>
            <p className="text-xs text-muted-foreground">
              比上周提升 5.2%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}