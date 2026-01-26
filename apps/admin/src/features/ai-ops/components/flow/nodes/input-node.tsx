/**
 * Input Node Component
 * 
 * 显示用户输入节点
 */

import { memo } from 'react';
import { BaseNode } from './base-node';
import type { InputNodeData } from '../../../types/flow';

interface InputNodeProps {
  data: InputNodeData;
  selected?: boolean;
}

export const InputNode = memo(({ data, selected }: InputNodeProps) => {
  const truncatedText = data.text.length > 40 
    ? data.text.slice(0, 40) + '...' 
    : data.text;

  return (
    <BaseNode data={data} selected={selected}>
      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
        {truncatedText}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {data.charCount} 字符
      </div>
    </BaseNode>
  );
});

InputNode.displayName = 'InputNode';
