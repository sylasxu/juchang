/**
 * Flow Trace Panel Component
 * 
 * 流程图追踪面板，使用流程图可视化替代文本日志
 */

import { useState, useMemo, useEffect } from 'react';
import { FlowGraph } from './flow-graph';
import { NodeDrawer } from './drawer/node-drawer';
import { buildFlowGraph } from './utils/flow-builder';
import type { ExecutionTrace } from '../../types/trace';
import type { FlowNode } from '../../types/flow';

interface FlowTracePanelProps {
  traces: ExecutionTrace[];
  isStreaming: boolean;
}

export function FlowTracePanel({ traces, isStreaming }: FlowTracePanelProps) {
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 使用最新的 trace 构建流程图
  const flowData = useMemo(() => {
    const latestTrace = traces[traces.length - 1];
    return buildFlowGraph(latestTrace || null);
  }, [traces]);

  // trace 开始时调用 fitView（通过重新渲染触发）
  useEffect(() => {
    if (traces.length > 0 && isStreaming) {
      // fitView 会在 FlowGraph 的 useEffect 中自动触发
    }
  }, [traces.length, isStreaming]);

  const handleNodeClick = (node: FlowNode) => {
    setSelectedNode(node);
    setDrawerOpen(true);
  };

  if (traces.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">发送消息后查看执行流程</p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <FlowGraph data={flowData} onNodeClick={handleNodeClick} />
      <NodeDrawer node={selectedNode} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
