/**
 * Processor Node Component
 * 
 * 通用 Processor 节点，根据 processorType 显示不同内容
 */

import { memo } from 'react';
import { BaseNode } from './base-node';
import type { ProcessorNodeData } from '../../../types/flow';

interface ProcessorNodeProps {
  data: ProcessorNodeData;
  selected?: boolean;
}

export const ProcessorNode = memo(({ data, selected }: ProcessorNodeProps) => {
  const renderContent = () => {
    switch (data.processorType) {
      case 'input-guard':
        return (
          <div className="text-xs text-muted-foreground">
            验证通过
          </div>
        );
      
      case 'user-profile':
        return (
          <div className="text-xs text-muted-foreground">
            {data.fieldCount ? `${data.fieldCount} 个字段` : '画像数据'}
          </div>
        );
      
      case 'working-memory':
        return (
          <div className="text-xs text-muted-foreground line-clamp-2">
            {data.summary || '历史消息'}
          </div>
        );
      
      case 'semantic-recall':
        return (
          <div className="text-xs text-muted-foreground">
            {data.resultCount !== undefined ? `${data.resultCount} 条结果` : '语义检索'}
          </div>
        );
      
      case 'token-limit':
        return (
          <div className="text-xs text-muted-foreground">
            {data.currentTokens !== undefined && data.maxTokens !== undefined
              ? `${data.currentTokens} / ${data.maxTokens}`
              : 'Token 限制'}
          </div>
        );
      
      case 'save-history':
        return (
          <div className="text-xs text-muted-foreground">
            保存成功
          </div>
        );
      
      case 'extract-preferences':
        return (
          <div className="text-xs text-muted-foreground">
            {data.fieldCount ? `提取 ${data.fieldCount} 项` : '偏好提取'}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <BaseNode data={data} selected={selected}>
      <div className="mt-1">
        {renderContent()}
      </div>
    </BaseNode>
  );
});

ProcessorNode.displayName = 'ProcessorNode';
