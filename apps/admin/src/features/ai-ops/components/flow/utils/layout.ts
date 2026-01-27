/**
 * Flow Layout Utilities
 * 
 * 使用 Dagre 算法自动布局流程图节点
 */

import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 240;
const NODE_HEIGHT = 80;

/**
 * 使用 Dagre 算法计算节点位置
 * @param nodes 节点列表
 * @param edges 边列表
 * @param direction 布局方向 (LR: 从左到右, TB: 从上到下)
 * @returns 布局后的节点和边
 */
export function getLayoutedElements<T extends Node>(
  nodes: T[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
): { nodes: T[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // 配置布局参数
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 80,    // 节点间距
    ranksep: 120,   // 层级间距
  });

  // 添加节点
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // 添加边
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 执行布局
  dagre.layout(dagreGraph);

  // 应用布局结果
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    } as T;
  });

  return { nodes: layoutedNodes, edges };
}
