/**
 * LLM Node Component
 * 
 * 显示 LLM 推理节点
 */

import { memo } from 'react';
import { BaseNode } from './base-node';
import type { LLMNodeData } from '../../../types/flow';

interface LLMNodeProps {
  data: LLMNodeData;
  selected?: boolean;
}

export const LLMNode = memo(({ data, selected }: LLMNodeProps) => {
  return (
    <BaseNode data={data} selected={selected}>
      <div className="mt-1 space-y-0.5">
        <div className="text-xs text-muted-foreground">
          {data.model}
        </div>
        <div className="text-xs text-muted-foreground">
          {data.inputTokens} → {data.outputTokens} tokens
        </div>
      </div>
    </BaseNode>
  );
});

LLMNode.displayName = 'LLMNode';
