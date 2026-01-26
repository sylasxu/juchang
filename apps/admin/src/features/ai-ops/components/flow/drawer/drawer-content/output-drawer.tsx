/**
 * Output Drawer Component
 * 
 * 显示最终输出的详细信息
 */

import { memo } from 'react';
import type { OutputNodeData } from '../../../../types/flow';
import { DrawerSection, DrawerField } from './drawer-section';
import { formatDuration, formatCost } from '../../../../types/trace';

interface OutputDrawerProps {
  data: OutputNodeData;
}

export const OutputDrawer = memo(({ data }: OutputDrawerProps) => {
  return (
    <div className="space-y-6">
      <DrawerSection title="响应类型">
        <div className="space-y-2">
          <DrawerField 
            label="类型" 
            value={data.responseType === 'tool_calls' ? 'Tool 调用' : '文本响应'} 
          />
          {data.itemCount !== undefined && data.itemCount > 0 && (
            <DrawerField label="Tool 数量" value={data.itemCount} />
          )}
        </div>
      </DrawerSection>

      <DrawerSection title="统计数据">
        <div className="space-y-2">
          <DrawerField label="总耗时" value={formatDuration(data.totalDuration)} />
          {data.totalTokens !== undefined && (
            <DrawerField label="总 Token" value={`${data.totalTokens} tokens`} />
          )}
          {data.totalCost !== undefined && (
            <DrawerField label="总费用" value={`$${formatCost(data.totalCost)}`} />
          )}
          {data.toolCallCount !== undefined && (
            <DrawerField label="Tool 调用次数" value={data.toolCallCount} />
          )}
          {data.evaluationPassed !== undefined && (
            <DrawerField 
              label="评估状态" 
              value={data.evaluationPassed ? '✓ 全部通过' : '⚠ 部分未通过'} 
            />
          )}
        </div>
      </DrawerSection>
    </div>
  );
});

OutputDrawer.displayName = 'OutputDrawer';
