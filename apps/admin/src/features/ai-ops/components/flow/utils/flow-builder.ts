/**
 * Flow Graph Builder
 * 
 * 从 ExecutionTrace 构建流程图数据
 */

import type { ExecutionTrace, TraceStep, ExtendedStepType } from '../../../types/trace';
import type { 
  FlowGraphData, 
  FlowNode, 
  FlowEdge,
  InputNodeData,
  P0MatchNodeData,
  P1IntentNodeData,
  ProcessorNodeData,
  LLMNodeData,
  ToolNodeData,
  OutputNodeData,
  ProcessorType,
  FlowNodeStatus,
} from '../../../types/flow';
import { getLayoutedElements } from './layout';

/**
 * 从 ExecutionTrace 构建流程图
 */
export function buildFlowGraph(trace: ExecutionTrace | null): FlowGraphData {
  if (!trace) {
    return { nodes: [], edges: [] };
  }

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let nodeIndex = 0;
  let prevNodeId: string | null = null;

  // 1. Input 节点
  const inputStep = trace.steps.find(s => s.type === 'input');
  if (inputStep) {
    nodes.push(createInputNode(nodeIndex++, inputStep));
    prevNodeId = nodes[nodes.length - 1].id;
  }

  // 2. Input Guard 节点
  const inputGuardStep = trace.steps.find(
    s => (s.type as ExtendedStepType) === 'processor' && 
         (s.data as any).processorType === 'input-guard'
  );
  if (inputGuardStep) {
    nodes.push(createProcessorNode(nodeIndex++, inputGuardStep, 'input-guard'));
    if (prevNodeId) {
      edges.push(createEdge(prevNodeId, nodes[nodes.length - 1].id));
    }
    prevNodeId = nodes[nodes.length - 1].id;
  }

  // 3. P0 Match 节点
  const p0Step = trace.steps.find(s => (s.type as ExtendedStepType) === 'p0-match');
  if (p0Step) {
    nodes.push(createP0MatchNode(nodeIndex++, p0Step));
    if (prevNodeId) {
      edges.push(createEdge(prevNodeId, nodes[nodes.length - 1].id));
    }
    prevNodeId = nodes[nodes.length - 1].id;

    // 如果 P0 命中，直接连接到 Output
    const p0Data = p0Step.data as any;
    if (p0Data.matched) {
      // 创建 Output 节点
      const outputStep = trace.steps.find(s => s.type === 'output');
      if (outputStep) {
        nodes.push(createOutputNode(nodeIndex++, outputStep, trace));
        if (prevNodeId) {
          edges.push(createEdge(prevNodeId, nodes[nodes.length - 1].id, true));
        }
      }
      // 计算 downstreamNodes 并应用布局
      return applyLayout(addDownstreamNodes({ nodes, edges }));
    }
  }

  // 4. P1 Intent 节点
  const p1Step = trace.steps.find(s => (s.type as ExtendedStepType) === 'p1-intent');
  if (p1Step) {
    nodes.push(createP1IntentNode(nodeIndex++, p1Step));
    if (prevNodeId) {
      edges.push(createEdge(prevNodeId, nodes[nodes.length - 1].id));
    }
    prevNodeId = nodes[nodes.length - 1].id;
  }

  // 5. Processor 节点（User Profile, Working Memory, Semantic Recall, Token Limit）
  const processorTypes: ProcessorType[] = [
    'user-profile',
    'working-memory',
    'semantic-recall',
    'token-limit',
  ];

  for (const processorType of processorTypes) {
    const processorStep = trace.steps.find(
      s => (s.type as ExtendedStepType) === 'processor' && 
           (s.data as any).processorType === processorType
    );
    if (processorStep) {
      nodes.push(createProcessorNode(nodeIndex++, processorStep, processorType));
      if (prevNodeId) {
        edges.push(createEdge(prevNodeId, nodes[nodes.length - 1].id));
      }
      prevNodeId = nodes[nodes.length - 1].id;
    }
  }

  // 6. LLM 节点
  const llmStep = trace.steps.find(s => s.type === 'llm');
  if (llmStep) {
    nodes.push(createLLMNode(nodeIndex++, llmStep));
    if (prevNodeId) {
      edges.push(createEdge(prevNodeId, nodes[nodes.length - 1].id));
    }
    prevNodeId = nodes[nodes.length - 1].id;
  }

  // 7. Tool 节点
  const toolSteps = trace.steps.filter(s => s.type === 'tool');
  for (const toolStep of toolSteps) {
    nodes.push(createToolNode(nodeIndex++, toolStep));
    if (prevNodeId) {
      edges.push(createEdge(prevNodeId, nodes[nodes.length - 1].id));
    }
    prevNodeId = nodes[nodes.length - 1].id;
  }

  // 8. 后处理 Processor 节点
  const postProcessorTypes: ProcessorType[] = ['save-history', 'extract-preferences'];
  for (const processorType of postProcessorTypes) {
    const processorStep = trace.steps.find(
      s => (s.type as ExtendedStepType) === 'processor' && 
           (s.data as any).processorType === processorType
    );
    if (processorStep) {
      nodes.push(createProcessorNode(nodeIndex++, processorStep, processorType));
      if (prevNodeId) {
        edges.push(createEdge(prevNodeId, nodes[nodes.length - 1].id));
      }
      prevNodeId = nodes[nodes.length - 1].id;
    }
  }

  // 9. Output 节点
  const outputStep = trace.steps.find(s => s.type === 'output');
  if (outputStep) {
    nodes.push(createOutputNode(nodeIndex++, outputStep, trace));
    if (prevNodeId) {
      edges.push(createEdge(prevNodeId, nodes[nodes.length - 1].id));
    }
  }

  // 计算 downstreamNodes 并应用布局
  return applyLayout(addDownstreamNodes({ nodes, edges }));
}

// ============ Node Creation Functions ============

function createInputNode(index: number, step: TraceStep): FlowNode {
  const data = step.data as any;
  return {
    id: `node-${index}`,
    type: 'input',
    position: { x: 0, y: 0 },
    data: {
      type: 'input',
      status: mapStepStatus(step.status),
      label: '用户输入',
      text: data.text || '',
      charCount: data.text?.length || 0,
      duration: step.duration,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      userId: data.userId,
      source: data.source,
      location: data.location,
    } as InputNodeData,
  };
}

function createP0MatchNode(index: number, step: TraceStep): FlowNode {
  const data = step.data as any;
  return {
    id: `node-${index}`,
    type: 'p0-match',
    position: { x: 0, y: 0 },
    data: {
      type: 'p0-match',
      status: mapStepStatus(step.status),
      label: 'P0: 关键词匹配',
      matched: data.matched || false,
      keyword: data.keyword,
      matchType: data.matchType,
      priority: data.priority,
      responseType: data.responseType,
      responseContent: data.responseContent,
      hitCount: data.statistics?.hitCount,
      conversionCount: data.statistics?.conversionCount,
      conversionRate: data.statistics?.conversionRate,
      cacheHit: data.cacheHit,
      duration: step.duration,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
    } as P0MatchNodeData,
  };
}

function createP1IntentNode(index: number, step: TraceStep): FlowNode {
  const data = step.data as any;
  return {
    id: `node-${index}`,
    type: 'p1-intent',
    position: { x: 0, y: 0 },
    data: {
      type: 'p1-intent',
      status: mapStepStatus(step.status),
      label: 'P1: 意图识别',
      intent: data.intent || 'unknown',
      method: data.method || 'regex',
      confidence: data.confidence,
      regexRules: data.regexRules,
      llmDetails: data.llmDetails,
      duration: step.duration,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
    } as P1IntentNodeData,
  };
}

function createProcessorNode(index: number, step: TraceStep, processorType: ProcessorType): FlowNode {
  const data = step.data as any;
  const metrics = data.metrics || {};
  
  return {
    id: `node-${index}`,
    type: 'processor',
    position: { x: 0, y: 0 },
    data: {
      type: 'processor',
      status: mapStepStatus(step.status),
      label: getProcessorLabel(processorType),
      processorType,
      fieldCount: metrics.fieldCount,
      summary: data.output?.workingMemorySummary || data.output?.summary,
      resultCount: data.output?.resultCount || metrics.resultCount,
      currentTokens: metrics.currentTokens || data.output?.currentTokens,
      maxTokens: metrics.maxTokens || data.config?.maxTokens,
      duration: step.duration,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
    } as ProcessorNodeData,
  };
}

function createLLMNode(index: number, step: TraceStep): FlowNode {
  const data = step.data as any;
  return {
    id: `node-${index}`,
    type: 'llm',
    position: { x: 0, y: 0 },
    data: {
      type: 'llm',
      status: mapStepStatus(step.status),
      label: 'LLM 推理',
      model: data.model || 'unknown',
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      totalTokens: data.totalTokens || 0,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
      systemPrompt: data.systemPrompt,
      inputMessages: data.inputMessages,
      output: data.output,
      timeToFirstToken: data.timeToFirstToken,
      tokensPerSecond: data.tokensPerSecond,
      cost: data.cost,
      duration: step.duration,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
    } as LLMNodeData,
  };
}

function createToolNode(index: number, step: TraceStep): FlowNode {
  const data = step.data as any;
  return {
    id: `node-${index}`,
    type: 'tool',
    position: { x: 0, y: 0 },
    data: {
      type: 'tool',
      status: mapStepStatus(step.status),
      label: data.toolDisplayName || data.toolName || 'Tool',
      toolName: data.toolName || '',
      toolDisplayName: data.toolDisplayName || data.toolName || '',
      input: data.input || {},
      output: data.output,
      widgetType: data.widgetType,
      evaluation: data.evaluation,
      duration: step.duration,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
    } as ToolNodeData,
  };
}

function createOutputNode(index: number, step: TraceStep, trace: ExecutionTrace): FlowNode {
  // 计算统计信息
  const toolSteps = trace.steps.filter(s => s.type === 'tool');
  const llmStep = trace.steps.find(s => s.type === 'llm');
  const llmData = llmStep?.data as any;
  
  const totalDuration = trace.completedAt 
    ? new Date(trace.completedAt).getTime() - new Date(trace.startedAt).getTime()
    : 0;
  
  return {
    id: `node-${index}`,
    type: 'output',
    position: { x: 0, y: 0 },
    data: {
      type: 'output',
      status: mapStepStatus(step.status),
      label: '最终输出',
      responseType: trace.output?.toolCalls?.length ? 'tool_calls' : 'text',
      itemCount: trace.output?.toolCalls?.length || 0,
      totalDuration,
      totalTokens: llmData?.totalTokens,
      totalCost: trace.totalCost,
      toolCallCount: toolSteps.length,
      evaluationPassed: toolSteps.every(s => {
        const toolData = s.data as any;
        return !toolData.evaluation || toolData.evaluation.passed;
      }),
      duration: step.duration,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
    } as OutputNodeData,
  };
}

// ============ Helper Functions ============

/**
 * 为每个节点添加 downstreamNodes 字段
 */
function addDownstreamNodes(graph: FlowGraphData): FlowGraphData {
  const { nodes, edges } = graph;
  
  // 为每个节点计算下游节点
  nodes.forEach(node => {
    const downstreamEdges = edges.filter(edge => edge.source === node.id);
    const downstreamNodeIds = downstreamEdges.map(edge => edge.target);
    
    if (downstreamNodeIds.length > 0) {
      node.data.downstreamNodes = downstreamNodeIds;
    }
    
    // 提取 metadata
    if (node.data.type === 'llm') {
      const llmData = node.data as LLMNodeData;
      node.data.metadata = {
        inputTokens: llmData.inputTokens,
        outputTokens: llmData.outputTokens,
        cost: llmData.cost,
      };
    } else if (node.data.type === 'p0-match') {
      const p0Data = node.data as P0MatchNodeData;
      node.data.metadata = {
        cacheHit: p0Data.cacheHit,
      };
    }
  });
  
  return { nodes, edges };
}

function createEdge(source: string, target: string, animated = false): FlowEdge {
  return {
    id: `edge-${source}-${target}`,
    source,
    target,
    animated,
    type: 'smoothstep',
    style: { 
      stroke: 'hsl(var(--primary))',
      strokeWidth: 2,
    },
  };
}

function applyLayout(graph: FlowGraphData): FlowGraphData {
  return getLayoutedElements(graph.nodes, graph.edges);
}

function mapStepStatus(status: string): FlowNodeStatus {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'running':
      return 'running';
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    default:
      return 'pending';
  }
}

function getProcessorLabel(type: ProcessorType): string {
  const labels: Record<ProcessorType, string> = {
    'input-guard': 'Input Guard',
    'user-profile': 'User Profile',
    'working-memory': 'Working Memory',
    'semantic-recall': 'Semantic Recall',
    'token-limit': 'Token Limit',
    'save-history': 'Save History',
    'extract-preferences': 'Extract Preferences',
  };
  return labels[type] || type;
}
