/**
 * P0 Match Node Component
 * 
 * 显示 P0 关键词匹配节点
 */

import { memo } from 'react';
import { BaseNode } from './base-node';
import type { P0MatchNodeData } from '../../../types/flow';

interface P0MatchNodeProps {
  data: P0MatchNodeData;
  selected?: boolean;
}

export const P0MatchNode = memo(({ data, selected }: P0MatchNodeProps) => {
  return (
    <BaseNode data={data} selected={selected}>
      <div className="mt-1 space-y-0.5">
        {data.matched ? (
          <>
            <div className="text-xs text-green-600">✓ 命中：{data.keyword}</div>
            <div className="text-xs text-muted-foreground">
              {data.matchType} · 优先级 {data.priority}
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">✗ 未命中 → 降级到 P1</div>
        )}
      </div>
    </BaseNode>
  );
});

P0MatchNode.displayName = 'P0MatchNode';
