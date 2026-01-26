/**
 * P0 Drawer Component
 * 
 * 显示 P0 关键词匹配的详细信息
 */

import { memo } from 'react';
import type { P0MatchNodeData } from '../../../../types/flow';
import { DrawerSection, DrawerField, DrawerCode } from './drawer-section';

interface P0DrawerProps {
  data: P0MatchNodeData;
}

export const P0Drawer = memo(({ data }: P0DrawerProps) => {
  return (
    <div className="space-y-6">
      <DrawerSection title="匹配详情">
        <div className="space-y-2">
          <DrawerField 
            label="匹配状态" 
            value={data.matched ? '✓ 命中' : '✗ 未命中'} 
          />
          {data.keyword && (
            <DrawerField label="关键词" value={data.keyword} />
          )}
          {data.matchType && (
            <DrawerField label="匹配方式" value={data.matchType} />
          )}
          {data.priority !== undefined && (
            <DrawerField label="优先级" value={data.priority} />
          )}
          {data.responseType && (
            <DrawerField label="响应类型" value={data.responseType} />
          )}
          {data.cacheHit !== undefined && (
            <DrawerField label="缓存" value={data.cacheHit ? '命中' : '未命中'} />
          )}
        </div>
      </DrawerSection>

      {data.responseContent && (
        <DrawerSection title="预设响应">
          <DrawerCode code={data.responseContent} />
        </DrawerSection>
      )}

      {(data.hitCount !== undefined || data.conversionCount !== undefined) && (
        <DrawerSection title="统计数据">
          <div className="space-y-2">
            {data.hitCount !== undefined && (
              <DrawerField label="命中次数" value={data.hitCount} />
            )}
            {data.conversionCount !== undefined && (
              <DrawerField label="转化次数" value={data.conversionCount} />
            )}
            {data.conversionRate !== undefined && (
              <DrawerField label="转化率" value={`${data.conversionRate}%`} />
            )}
          </div>
        </DrawerSection>
      )}
    </div>
  );
});

P0Drawer.displayName = 'P0Drawer';
