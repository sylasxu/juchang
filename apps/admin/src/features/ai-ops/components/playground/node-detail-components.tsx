/**
 * Node Detail Components
 * 
 * 节点详情展示的子组件
 */

import { Badge } from '@/components/ui/badge'
import type { FlowNodeData } from '../../types/flow'

/**
 * 节点输入内容展示
 */
export function NodeInputContent({ data }: { data: FlowNodeData }) {
  if (data.type === 'input') {
    return (
      <div className='space-y-2'>
        <p className='text-sm'>{data.text}</p>
        <div className='flex gap-2 text-xs text-muted-foreground'>
          <span>{data.charCount} 字符</span>
          {data.source && <span>来源: {data.source}</span>}
        </div>
      </div>
    )
  }

  if (data.type === 'llm' && data.inputMessages) {
    return (
      <div className='space-y-2'>
        {data.inputMessages.map((msg, i) => (
          <div key={i} className='space-y-1'>
            <div className='text-xs font-medium text-muted-foreground'>{msg.role}</div>
            <div className='text-sm'>{msg.content}</div>
          </div>
        ))}
      </div>
    )
  }

  if (data.type === 'tool' && data.input) {
    return (
      <pre className='overflow-x-auto text-xs'>
        {JSON.stringify(data.input, null, 2)}
      </pre>
    )
  }

  return <p className='text-sm text-muted-foreground'>无输入数据</p>
}

/**
 * 节点输出内容展示
 */
export function NodeOutputContent({ data }: { data: FlowNodeData }) {
  if (data.type === 'p0-match') {
    return (
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Badge variant={data.matched ? 'default' : 'secondary'}>
            {data.matched ? '已匹配' : '未匹配'}
          </Badge>
          {data.keyword && <span className='text-sm'>关键词: {data.keyword}</span>}
        </div>
        {data.responseContent && (
          <pre className='overflow-x-auto text-xs'>
            {JSON.stringify(data.responseContent, null, 2)}
          </pre>
        )}
      </div>
    )
  }

  if (data.type === 'p1-intent') {
    return (
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Badge>{data.intent}</Badge>
          <span className='text-xs text-muted-foreground'>方法: {data.method}</span>
        </div>
        {data.confidence && (
          <div className='text-sm'>置信度: {(data.confidence * 100).toFixed(1)}%</div>
        )}
      </div>
    )
  }

  if (data.type === 'processor') {
    return (
      <div className='space-y-2'>
        {data.summary && <p className='text-sm'>{data.summary}</p>}
        {data.resultCount !== undefined && (
          <div className='text-sm text-muted-foreground'>结果数: {data.resultCount}</div>
        )}
        {data.fieldCount !== undefined && (
          <div className='text-sm text-muted-foreground'>字段数: {data.fieldCount}</div>
        )}
      </div>
    )
  }

  if (data.type === 'llm' && data.output) {
    return (
      <div className='space-y-2'>
        {data.output.text && <p className='text-sm'>{data.output.text}</p>}
        {data.output.toolCalls && data.output.toolCalls.length > 0 && (
          <div className='space-y-1'>
            <div className='text-xs font-medium'>Tool Calls:</div>
            {data.output.toolCalls.map((call, i) => (
              <Badge key={i} variant='outline'>
                {call.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (data.type === 'tool' && data.output) {
    return (
      <div className='space-y-2'>
        {data.widgetType && (
          <Badge variant='outline'>Widget: {data.widgetType}</Badge>
        )}
        <pre className='overflow-x-auto text-xs'>
          {JSON.stringify(data.output, null, 2)}
        </pre>
      </div>
    )
  }

  if (data.type === 'output') {
    return (
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Badge>{data.responseType}</Badge>
          {data.itemCount !== undefined && (
            <span className='text-sm'>{data.itemCount} 项</span>
          )}
        </div>
        {data.evaluationPassed !== undefined && (
          <Badge variant={data.evaluationPassed ? 'default' : 'destructive'}>
            {data.evaluationPassed ? '评估通过' : '评估失败'}
          </Badge>
        )}
      </div>
    )
  }

  return <p className='text-sm text-muted-foreground'>无输出数据</p>
}

/**
 * 节点执行详情展示
 */
export function NodeMetadata({ metadata }: { metadata: FlowNodeData['metadata'] }) {
  if (!metadata) {
    return <p className='text-sm text-muted-foreground'>无执行详情</p>
  }

  return (
    <div className='space-y-2 text-sm'>
      {metadata.inputTokens !== undefined && (
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>输入 Token:</span>
          <span className='font-medium'>{metadata.inputTokens.toLocaleString()}</span>
        </div>
      )}
      {metadata.outputTokens !== undefined && (
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>输出 Token:</span>
          <span className='font-medium'>{metadata.outputTokens.toLocaleString()}</span>
        </div>
      )}
      {metadata.cost !== undefined && (
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>成本:</span>
          <span className='font-medium'>¥{metadata.cost.toFixed(4)}</span>
        </div>
      )}
      {metadata.cacheHit !== undefined && (
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>缓存命中:</span>
          <Badge variant={metadata.cacheHit ? 'default' : 'secondary'}>
            {metadata.cacheHit ? '是' : '否'}
          </Badge>
        </div>
      )}
    </div>
  )
}

/**
 * 根据节点 ID 获取节点标签（需要从 nodes 数组中查找）
 */
export function getNodeLabel(nodeId: string, nodes: Array<{ id: string; data: FlowNodeData }>): string {
  const node = nodes.find(n => n.id === nodeId)
  return node?.data.label || nodeId
}
