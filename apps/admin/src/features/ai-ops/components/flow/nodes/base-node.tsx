/**
 * Base Node Component
 * 
 * 所有自定义节点的基础组件，提供统一的样式和布局
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { FlowNodeStatus } from '../../../types/flow';

interface BaseNodeProps {
  data: {
    status: FlowNodeStatus;
    label: string;
    duration?: number;
  };
  selected?: boolean;
  children: React.ReactNode;
}

export const BaseNode = memo(({ data, selected, children }: BaseNodeProps) => {
  const statusColor = {
    pending: 'bg-muted-foreground',
    running: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-destructive',
    skipped: 'bg-muted-foreground/30',
  }[data.status];

  return (
    <div
      className={cn(
        'rounded-lg border bg-background p-3 shadow-sm transition-all',
        selected && 'ring-2 ring-ring ring-offset-2',
        data.status === 'skipped' && 'opacity-50'
      )}
      style={{ width: 240 }}
    >
      <Handle type="target" position={Position.Left} className="!bg-border" />
      
      <div className="flex items-start gap-2">
        <div className={cn('mt-1 h-2 w-2 rounded-full flex-shrink-0', statusColor)} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{data.label}</div>
          {children}
          {data.duration !== undefined && (
            <div className="mt-1 text-xs text-muted-foreground">
              {formatDuration(data.duration)}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  );
});

BaseNode.displayName = 'BaseNode';

/**
 * 格式化耗时显示
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
