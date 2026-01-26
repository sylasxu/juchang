/**
 * Input Drawer Component
 * 
 * 显示用户输入的详细信息
 */

import { memo } from 'react';
import type { InputNodeData } from '../../../../types/flow';
import { DrawerSection, DrawerField } from './drawer-section';

interface InputDrawerProps {
  data: InputNodeData;
}

export const InputDrawer = memo(({ data }: InputDrawerProps) => {
  return (
    <div className="space-y-6">
      <DrawerSection title="输入文本">
        <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
          {data.text}
        </div>
      </DrawerSection>

      <DrawerSection title="元数据">
        <div className="space-y-2">
          <DrawerField label="用户 ID" value={data.userId || '匿名'} />
          <DrawerField 
            label="来源" 
            value={data.source === 'miniprogram' ? '小程序' : 'Admin'} 
          />
          <DrawerField label="字符数" value={data.charCount} />
          {data.location && (
            <DrawerField 
              label="位置" 
              value={data.location.name || `${data.location.lat}, ${data.location.lng}`} 
            />
          )}
          {data.startedAt && (
            <DrawerField 
              label="时间" 
              value={new Date(data.startedAt).toLocaleString()} 
            />
          )}
        </div>
      </DrawerSection>
    </div>
  );
});

InputDrawer.displayName = 'InputDrawer';
