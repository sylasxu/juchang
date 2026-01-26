/**
 * Tool Drawer Component
 * 
 * 显示 Tool 调用的详细信息（包含 Evaluation）
 */

import { memo } from 'react';
import type { ToolNodeData } from '../../../../types/flow';
import { DrawerSection, DrawerField, DrawerCode } from './drawer-section';

interface ToolDrawerProps {
  data: ToolNodeData;
}

export const ToolDrawer = memo(({ data }: ToolDrawerProps) => {
  return (
    <div className="space-y-6">
      <DrawerSection title="Tool 信息">
        <div className="space-y-2">
          <DrawerField label="名称" value={data.toolDisplayName} />
          <DrawerField label="ID" value={data.toolName} />
          {data.widgetType && (
            <DrawerField label="Widget 类型" value={data.widgetType} />
          )}
          <DrawerField 
            label="状态" 
            value={data.status === 'success' ? '✓ 成功' : '✗ 失败'} 
          />
        </div>
      </DrawerSection>

      <DrawerSection title="输入参数">
        <DrawerCode code={data.input} />
      </DrawerSection>

      {data.output && (
        <DrawerSection title="输出结果">
          <DrawerCode code={data.output} />
        </DrawerSection>
      )}

      {data.evaluation && (
        <DrawerSection title="评估结果">
          <div className="space-y-3">
            <div className="space-y-2">
              <DrawerField 
                label="是否通过" 
                value={data.evaluation.passed ? '✓ 通过' : '✗ 未通过'} 
              />
              <DrawerField label="质量评分" value={`${data.evaluation.score}/10`} />
              {data.evaluation.toneScore !== undefined && (
                <DrawerField label="语气评分" value={`${data.evaluation.toneScore}/5`} />
              )}
              {data.evaluation.relevanceScore !== undefined && (
                <DrawerField label="相关性" value={`${data.evaluation.relevanceScore}/5`} />
              )}
              {data.evaluation.contextScore !== undefined && (
                <DrawerField label="上下文利用" value={`${data.evaluation.contextScore}/5`} />
              )}
            </div>

            {data.evaluation.issues && data.evaluation.issues.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">发现的问题</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {data.evaluation.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.evaluation.suggestions && data.evaluation.suggestions.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">改进建议</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {data.evaluation.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.evaluation.thinking && (
              <div>
                <div className="text-sm font-medium mb-2">推理过程</div>
                <div className="rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                  {data.evaluation.thinking}
                </div>
              </div>
            )}
          </div>
        </DrawerSection>
      )}
    </div>
  );
});

ToolDrawer.displayName = 'ToolDrawer';
