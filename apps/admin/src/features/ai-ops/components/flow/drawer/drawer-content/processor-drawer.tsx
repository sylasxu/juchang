/**
 * Processor Drawer Component
 * 
 * 通用 Processor 详情显示
 */

import { memo } from 'react';
import type { ProcessorNodeData } from '../../../../types/flow';
import { DrawerSection, DrawerField } from './drawer-section';

interface ProcessorDrawerProps {
  data: ProcessorNodeData;
}

export const ProcessorDrawer = memo(({ data }: ProcessorDrawerProps) => {
  const renderContent = () => {
    switch (data.processorType) {
      case 'input-guard':
        return (
          <DrawerSection title="验证结果">
            <div className="text-sm text-muted-foreground">
              所有验证检查通过
            </div>
          </DrawerSection>
        );
      
      case 'user-profile':
        return (
          <DrawerSection title="用户画像">
            <div className="space-y-2">
              {data.fieldCount !== undefined && (
                <DrawerField label="字段数" value={data.fieldCount} />
              )}
            </div>
          </DrawerSection>
        );
      
      case 'working-memory':
        return (
          <DrawerSection title="工作记忆">
            {data.summary && (
              <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
                {data.summary}
              </div>
            )}
          </DrawerSection>
        );
      
      case 'semantic-recall':
        return (
          <DrawerSection title="语义检索">
            <div className="space-y-2">
              {data.resultCount !== undefined && (
                <DrawerField label="结果数" value={data.resultCount} />
              )}
            </div>
          </DrawerSection>
        );
      
      case 'token-limit':
        return (
          <DrawerSection title="Token 限制">
            <div className="space-y-2">
              {data.currentTokens !== undefined && (
                <DrawerField label="当前 Token" value={data.currentTokens} />
              )}
              {data.maxTokens !== undefined && (
                <DrawerField label="最大 Token" value={data.maxTokens} />
              )}
              {data.currentTokens !== undefined && data.maxTokens !== undefined && (
                <DrawerField 
                  label="使用率" 
                  value={`${Math.round((data.currentTokens / data.maxTokens) * 100)}%`} 
                />
              )}
            </div>
          </DrawerSection>
        );
      
      case 'save-history':
        return (
          <DrawerSection title="保存历史">
            <div className="text-sm text-muted-foreground">
              对话历史已保存
            </div>
          </DrawerSection>
        );
      
      case 'extract-preferences':
        return (
          <DrawerSection title="偏好提取">
            <div className="space-y-2">
              {data.fieldCount !== undefined && (
                <DrawerField label="提取数量" value={data.fieldCount} />
              )}
            </div>
          </DrawerSection>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
});

ProcessorDrawer.displayName = 'ProcessorDrawer';
