// DraftInspector - 结构化展示活动草稿
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileEdit, 
  MapPin, 
  Clock, 
  Users, 
  Tag,
  ExternalLink,
  Utensils,
  Gamepad2,
  Dumbbell,
  Dice5,
  CircleDot,
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

// 活动类型标签映射
const typeLabels: Record<string, string> = {
  food: '美食',
  entertainment: '娱乐',
  sports: '运动',
  boardgame: '桌游',
  other: '其他',
}

interface DraftData {
  title?: string
  description?: string
  type?: string
  startAt?: string
  location?: [number, number]
  locationName?: string
  address?: string
  locationHint?: string
  maxParticipants?: number
  activityId?: string
}

interface DraftInspectorProps {
  data: DraftData
  className?: string
}

export function DraftInspector({ data, className }: DraftInspectorProps) {
  const TypeIcon = data.type ? typeIcons[data.type] || CircleDot : CircleDot
  const typeLabel = data.type ? typeLabels[data.type] || data.type : '未知'

  // 生成腾讯地图链接
  const mapUrl = data.location
    ? `https://map.qq.com/?type=marker&isopeninfowin=1&markertype=1&pointx=${data.location[0]}&pointy=${data.location[1]}&name=${encodeURIComponent(data.locationName || '')}`
    : null

  return (
    <Card className={className}>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
          <FileEdit className='h-4 w-4' />
          活动草稿 (Widget_Draft)
          {data.activityId && (
            <Badge variant='outline' className='ml-auto text-xs'>
              ID: {data.activityId.slice(0, 8)}...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {/* 标题 */}
        {data.title && (
          <div>
            <span className='text-xs text-muted-foreground'>标题</span>
            <p className='font-medium'>{data.title}</p>
          </div>
        )}

        {/* 描述 */}
        {data.description && (
          <div>
            <span className='text-xs text-muted-foreground'>描述</span>
            <p className='text-sm text-muted-foreground'>{data.description}</p>
          </div>
        )}

        {/* 类型 */}
        <div className='flex items-center gap-2'>
          <Tag className='h-4 w-4 text-muted-foreground' />
          <span className='text-xs text-muted-foreground'>类型:</span>
          <Badge variant='secondary' className='gap-1'>
            <TypeIcon className='h-3 w-3' />
            {typeLabel}
          </Badge>
        </div>

        {/* 时间 */}
        {data.startAt && (
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4 text-muted-foreground' />
            <span className='text-xs text-muted-foreground'>时间:</span>
            <span className='text-sm'>
              {format(new Date(data.startAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
            </span>
          </div>
        )}

        {/* 地点 */}
        {(data.locationName || data.address) && (
          <div className='flex items-start gap-2'>
            <MapPin className='mt-0.5 h-4 w-4 text-muted-foreground' />
            <div className='flex-1'>
              <span className='text-xs text-muted-foreground'>地点:</span>
              <p className='text-sm'>{data.locationName}</p>
              {data.address && (
                <p className='text-xs text-muted-foreground'>{data.address}</p>
              )}
              {data.locationHint && (
                <p className='text-xs text-orange-500'>📍 {data.locationHint}</p>
              )}
            </div>
            {mapUrl && (
              <Button variant='ghost' size='sm' className='h-6 px-2' asChild>
                <a href={mapUrl} target='_blank' rel='noopener noreferrer'>
                  <ExternalLink className='h-3 w-3' />
                </a>
              </Button>
            )}
          </div>
        )}

        {/* 坐标 */}
        {data.location && (
          <div className='rounded-md bg-muted p-2 text-xs font-mono'>
            坐标: [{data.location[0].toFixed(6)}, {data.location[1].toFixed(6)}]
          </div>
        )}

        {/* 人数 */}
        {data.maxParticipants && (
          <div className='flex items-center gap-2'>
            <Users className='h-4 w-4 text-muted-foreground' />
            <span className='text-xs text-muted-foreground'>人数上限:</span>
            <span className='text-sm'>{data.maxParticipants} 人</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
