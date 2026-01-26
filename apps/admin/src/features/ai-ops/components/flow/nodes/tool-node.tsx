/**
 * Tool Node Component
 * 
 * 显示 Tool 调用节点（包含 Evaluation）
 */

import { memo } from 'react';
import { BaseNode } from './base-node';
import type { ToolNodeData } from '../../../types/flow';

interface ToolNodeProps {
  data: ToolNodeData;
  selected?: boolean;
}

export const ToolNode = memo(({ data, selected }: ToolNodeProps) => {
  const hasEvaluation = data.evaluation !== undefined;
  const evaluationPassed = data.evaluation?.passed;
  const evaluationScore = data.evaluation?.score;

  return (
    <BaseNode data={data} selected={selected}>
      <div className="mt-1 space-y-0.5">
        <div className="text-xs text-muted-foreground">
          {data.status === 'success' ? '✓ 成功' : '✗ 失败'}
        </div>
        {hasEvaluation && (
          <div className={`text-xs ${evaluationPassed ? 'text-green-600' : 'text-amber-600'}`}>
            {evaluationPassed ? '✓' : '⚠'} {evaluationScore}/10
          </div>
        )}
      </div>
    </BaseNode>
  );
});

ToolNode.displayName = 'ToolNode';
