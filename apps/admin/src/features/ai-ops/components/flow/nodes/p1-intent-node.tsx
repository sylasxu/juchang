/**
 * P1 Intent Node Component
 * 
 * 显示 P1 意图识别节点
 */

import { memo } from 'react';
import { BaseNode } from './base-node';
import type { P1IntentNodeData } from '../../../types/flow';
import { INTENT_DISPLAY_NAMES } from '../../../types/trace';

interface P1IntentNodeProps {
  data: P1IntentNodeData;
  selected?: boolean;
}

export const P1IntentNode = memo(({ data, selected }: P1IntentNodeProps) => {
  const intentDisplay = INTENT_DISPLAY_NAMES[data.intent as keyof typeof INTENT_DISPLAY_NAMES] || data.intent;
  const methodDisplay = data.method === 'regex' ? 'Regex' : 'LLM';

  return (
    <BaseNode data={data} selected={selected}>
      <div className="mt-1 space-y-0.5">
        <div className="text-xs text-muted-foreground">
          意图：{intentDisplay}
        </div>
        <div className="text-xs text-muted-foreground">
          方法：{methodDisplay}
          {data.confidence !== undefined && ` · ${Math.round(data.confidence * 100)}%`}
        </div>
      </div>
    </BaseNode>
  );
});

P1IntentNode.displayName = 'P1IntentNode';
