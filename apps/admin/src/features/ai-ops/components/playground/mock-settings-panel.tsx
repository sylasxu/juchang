/**
 * Mock Settings Panel
 * 
 * 模拟身份和位置设置面板
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { User, MapPin } from 'lucide-react'

export interface MockSettings {
  userType: 'anonymous' | 'logged_in' | 'with_phone'
  location: string
}

interface MockSettingsPanelProps {
  settings: MockSettings
  onChange: (settings: MockSettings) => void
}

const MOCK_LOCATIONS = [
  { value: 'guanyinqiao', label: '观音桥', lat: 29.5733, lng: 106.5547 },
  { value: 'jiefangbei', label: '解放碑', lat: 29.5592, lng: 106.5770 },
  { value: 'nanping', label: '南坪', lat: 29.5233, lng: 106.5614 },
  { value: 'shapingba', label: '沙坪坝', lat: 29.5411, lng: 106.4542 },
]

export function MockSettingsPanel({ settings, onChange }: MockSettingsPanelProps) {
  return (
    <Card className='border-dashed'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm font-medium flex items-center gap-2'>
          <User className='h-4 w-4' />
          模拟设置
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* 身份选择 */}
        <div className='space-y-2'>
          <Label className='text-xs text-muted-foreground'>身份</Label>
          <Select
            value={settings.userType}
            onValueChange={(value) => 
              onChange({ ...settings, userType: value as MockSettings['userType'] })
            }
          >
            <SelectTrigger className='h-8'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='anonymous'>匿名用户</SelectItem>
              <SelectItem value='logged_in'>已登录（无手机号）</SelectItem>
              <SelectItem value='with_phone'>已登录（有手机号）</SelectItem>
            </SelectContent>
          </Select>
          <p className='text-xs text-muted-foreground'>
            {settings.userType === 'anonymous' && '可浏览对话、查看详情'}
            {settings.userType === 'logged_in' && '可创建活动，但不能发布'}
            {settings.userType === 'with_phone' && '完整权限'}
          </p>
        </div>

        {/* 位置选择 */}
        <div className='space-y-2'>
          <Label className='text-xs text-muted-foreground flex items-center gap-1'>
            <MapPin className='h-3 w-3' />
            位置
          </Label>
          <Select
            value={settings.location}
            onValueChange={(value) => onChange({ ...settings, location: value })}
          >
            <SelectTrigger className='h-8'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_LOCATIONS.map((loc) => (
                <SelectItem key={loc.value} value={loc.value}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
