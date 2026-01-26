/**
 * Node Drawer Component
 * 
 * 主 Drawer 组件，根据节点类型渲染对应的详情内容
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { FlowNode } from '../../../types/flow';
import { InputDrawer } from './drawer-content/input-drawer';
import { P0Drawer } from './drawer-content/p0-drawer';
import { P1Drawer } from './drawer-content/p1-drawer';
import { ProcessorDrawer } from './drawer-content/processor-drawer';
import { LLMDrawer } from './drawer-content/llm-drawer';
import { ToolDrawer } from './drawer-content/tool-drawer';
import { OutputDrawer } from './drawer-content/output-drawer';

interface NodeDrawerProps {
  node: FlowNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NodeDrawer({ node, open, onOpenChange }: NodeDrawerProps) {
  if (!node) return null;

  const renderContent = () => {
    switch (node.data.type) {
      case 'input':
        return <InputDrawer data={node.data} />;
      case 'p0-match':
        return <P0Drawer data={node.data} />;
      case 'p1-intent':
        return <P1Drawer data={node.data} />;
      case 'processor':
        return <ProcessorDrawer data={node.data} />;
      case 'llm':
        return <LLMDrawer data={node.data} />;
      case 'tool':
        return <ToolDrawer data={node.data} />;
      case 'output':
        return <OutputDrawer data={node.data} />;
      default:
        return <div className="text-sm text-muted-foreground">暂无详情</div>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{node.data.label}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">{renderContent()}</div>
      </SheetContent>
    </Sheet>
  );
}
