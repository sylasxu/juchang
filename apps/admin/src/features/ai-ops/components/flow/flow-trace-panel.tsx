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
  onNodeClick?: (node: FlowNode) => void; // 新增：节点点击回调
}

export function FlowTracePanel({ traces, isStreaming, onNodeClick }: FlowTracePanelProps) {
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
    if (onNodeClick) {
      // 如果父组件提供了回调，使用父组件的处理逻辑
      onNodeClick(node);
    } else {
      // 否则使用内部的 drawer
      setSelectedNode(node);
      setDrawerOpen(true);
    }
  };

  if (traces.length === 0) {
    // 显示初始的"发送消息" node
    const initialNode: FlowNode = {
      id: 'initial-input',
      type: 'input',
      position: { x: 0, y: 0 },
      data: {
        type: 'input',
        status: 'pending',
        label: '发送消息',
        text: '',
        charCount: 0,
      },
    };

    return (
      <div className="relative h-full">
        <FlowGraph 
          data={{ nodes: [initialNode], edges: [] }} 
          onNodeClick={() => handleNodeClick(initialNode)} 
        />
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <FlowGraph data={flowData} onNodeClick={handleNodeClick} />
      {!onNodeClick && (
        <NodeDrawer node={selectedNode} open={drawerOpen} onOpenChange={setDrawerOpen} />
      )}
    </div>
  );
}
