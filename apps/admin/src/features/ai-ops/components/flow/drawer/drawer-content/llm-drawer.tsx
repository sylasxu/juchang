/**
 * LLM Drawer Component
 * 
 * 显示 LLM 推理的详细信息
 */

import { memo } from 'react';
import type { LLMNodeData } from '../../../../types/flow';
import { DrawerSection, DrawerField, DrawerCode } from './drawer-section';
import { formatCost } from '../../../../types/trace';

interface LLMDrawerProps {
  data: LLMNodeData;
}

export const LLMDrawer = memo(({ data }: LLMDrawerProps) => {
  return (
    <div className="space-y-6">
      <DrawerSection title="模型配置">
        <div className="space-y-2">
          <DrawerField label="模型" value={data.model} />
          {data.temperature !== undefined && (
            <DrawerField label="Temperature" value={data.temperature} />
          )}
          {data.maxTokens !== undefined && (
            <DrawerField label="Max Tokens" value={data.maxTokens} />
          )}
        </div>
      </DrawerSection>

      <DrawerSection title="Token 统计">
        <div className="space-y-2">
          <DrawerField label="输入" value={`${data.inputTokens} tokens`} />
          <DrawerField label="输出" value={`${data.outputTokens} tokens`} />
          <DrawerField label="总计" value={`${data.totalTokens} tokens`} />
          {data.cost !== undefined && (
            <DrawerField label="费用" value={`$${formatCost(data.cost)}`} />
          )}
        </div>
      </DrawerSection>

      {data.timeToFirstToken !== undefined && (
        <DrawerSection title="性能指标">
          <div className="space-y-2">
            <DrawerField label="首 Token 延迟" value={`${data.timeToFirstToken}ms`} />
            {data.tokensPerSecond !== undefined && (
              <DrawerField label="生成速度" value={`${data.tokensPerSecond.toFixed(1)} tokens/s`} />
            )}
          </div>
        </DrawerSection>
      )}

      {data.output && (
        <DrawerSection title="输出">
          {data.output.text && (
            <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap mb-3">
              {data.output.text}
            </div>
          )}
          {data.output.toolCalls && data.output.toolCalls.length > 0 && (
            <DrawerCode code={data.output.toolCalls} />
          )}
        </DrawerSection>
      )}
    </div>
  );
});

LLMDrawer.displayName = 'LLMDrawer';
