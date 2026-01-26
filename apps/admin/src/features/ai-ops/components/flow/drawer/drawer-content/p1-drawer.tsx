/**
 * P1 Drawer Component
 * 
 * 显示 P1 意图识别的详细信息
 */

import { memo } from 'react';
import type { P1IntentNodeData } from '../../../../types/flow';
import { DrawerSection, DrawerField, DrawerCode } from './drawer-section';
import { INTENT_DISPLAY_NAMES } from '../../../../types/trace';

interface P1DrawerProps {
  data: P1IntentNodeData;
}

export const P1Drawer = memo(({ data }: P1DrawerProps) => {
  const intentDisplay = INTENT_DISPLAY_NAMES[data.intent as keyof typeof INTENT_DISPLAY_NAMES] || data.intent;

  return (
    <div className="space-y-6">
      <DrawerSection title="意图详情">
        <div className="space-y-2">
          <DrawerField label="意图类型" value={intentDisplay} />
          <DrawerField label="识别方法" value={data.method === 'regex' ? 'Regex' : 'LLM'} />
          {data.confidence !== undefined && (
            <DrawerField label="置信度" value={`${Math.round(data.confidence * 100)}%`} />
          )}
        </div>
      </DrawerSection>

      {data.regexRules && data.regexRules.length > 0 && (
        <DrawerSection title="Regex 规则">
          <DrawerCode code={data.regexRules} />
        </DrawerSection>
      )}

      {data.llmDetails && (
        <DrawerSection title="LLM 分类详情">
          <div className="space-y-2">
            <DrawerField label="模型" value={data.llmDetails.model} />
            <DrawerField label="输入 Token" value={data.llmDetails.inputTokens} />
            <DrawerField label="输出 Token" value={data.llmDetails.outputTokens} />
            <DrawerField label="耗时" value={`${data.llmDetails.duration}ms`} />
          </div>
        </DrawerSection>
      )}
    </div>
  );
});

P1Drawer.displayName = 'P1Drawer';
