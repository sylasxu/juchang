// ExploreInspector - 展示探索结果
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  MapPin, 
  ExternalLink,
  Utensils,
  Gamepad2,
  Dumbbell,
  Dice5,
  CircleDot,
  Clock,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 活动类型图标映射
const typeIcons: Record<string, React.ElementType> = {
  food: Utensils,
  entertainment: Gamepad2,
  sports: Dumbbell,
  boardgame: Dice5,
  other: CircleDot,
}

interface ExploreResult {
  id: string
  title: string
  type: string
  lat: number
  lng: number
  locationName: string
  distance: number
  startAt: string
  currentParticipants: number
  maxParticipants: number
}

interface ExploreData {
  center?: {
    lat: number
    lng: number
    name: string
  }
  results?: ExploreResult[]
  title?: string
  searchKeywords?: string[]
}

interface ExploreInspectorProps {
  data: ExploreData
  className?: string
}

export function ExploreInspector({ data, className }: ExploreInspectorProps) {
  // 生成腾讯地图链接
  const centerMapUrl = data.center
    ? `https://map.qq.com/?type=marker&isopeninfowin=1&markertype=1&pointx=${data.center.lng}&pointy=${data.center.lat}&name=${encodeURIComponent(data.center.name || '搜索中心')}`
    : null

  return (
    <Card className={className}>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
          <Search className='h-4 w-4' />
          探索结果 (Widget_Explore)
          {data.results && (
            <Badge variant='secondary' className='ml-auto'>
              {data.results.length} 个结果
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* 标题 */}
        {data.title && (
          <p className='text-sm font-medium'>{data.title}</p>
        )}

        {/* 搜索关键词 */}
        {data.searchKeywords && data.searchKeywords.length > 0 && (
          <div>
            <span className='text-xs text-muted-foreground'>搜索关键词:</span>
            <div className='mt-1 flex flex-wrap gap-1'>
              {data.searchKeywords.map((keyword, i) => (
                <Badge key={i} variant='outline' className='text-xs'>
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 中心点坐标 */}
        {data.center && (
          <div className='flex items-center gap-2'>
            <MapPin className='h-4 w-4 text-muted-foreground' />
            <div className='flex-1'>
              <span className='text-xs text-muted-foreground'>搜索中心:</span>
              <p className='text-sm'>{data.center.name}</p>
              <p className='font-mono text-xs text-muted-foreground'>
                [{data.center.lng.toFixed(6)}, {data.center.lat.toFixed(6)}]
              </p>
            </div>
            {centerMapUrl && (
              <Button variant='ghost' size='sm' className='h-6 px-2' asChild>
                <a href={centerMapUrl} target='_blank' rel='noopener noreferrer'>
                  <ExternalLink className='h-3 w-3' />
                </a>
              </Button>
            )}
          </div>
        )}

        {/* 结果列表 */}
        {data.results && data.results.length > 0 && (
          <div>
            <span className='text-xs text-muted-foreground'>活动列表:</span>
            <ScrollArea className='mt-2 h-48'>
              <div className='space-y-2 pr-4'>
                {data.results.map((result) => {
                  const TypeIcon = typeIcons[result.type] || CircleDot
                  const mapUrl = `https://map.qq.com/?type=marker&isopeninfowin=1&markertype=1&pointx=${result.lng}&pointy=${result.lat}&name=${encodeURIComponent(result.title)}`
                  
                  return (
                    <div
                      key={result.id}
                      className='flex items-start gap-2 rounded-md border p-2'
                    >
                      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted'>
                        <TypeIcon className='h-4 w-4' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium'>{result.title}</p>
                        <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                          <span className='flex items-center gap-1'>
                            <MapPin className='h-3 w-3' />
                            {result.distance}m
                          </span>
                          <span className='flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            {format(new Date(result.startAt), 'MM-dd HH:mm', { locale: zhCN })}
                          </span>
                          <span className='flex items-center gap-1'>
                            <Users className='h-3 w-3' />
                            {result.currentParticipants}/{result.maxParticipants}
                          </span>
                        </div>
                      </div>
                      <Button variant='ghost' size='sm' className='h-6 w-6 p-0' asChild>
                        <a href={mapUrl} target='_blank' rel='noopener noreferrer'>
                          <ExternalLink className='h-3 w-3' />
                        </a>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 空状态 */}
        {(!data.results || data.results.length === 0) && (
          <div className='flex h-20 items-center justify-center text-sm text-muted-foreground'>
            暂无搜索结果
          </div>
        )}
      </CardContent>
    </Card>
  )
}
