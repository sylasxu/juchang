// InspectorRenderer - 根据消息类型渲染不同的 Inspector
import { TextInspector } from './text-inspector'
import { DraftInspector } from './draft-inspector'
import { ExploreInspector } from './explore-inspector'
import { RawJsonInspector } from './raw-json-inspector'

// 消息类型定义
type MessageType = 
  | 'text'
  | 'widget_dashboard'
  | 'widget_launcher'
  | 'widget_action'
  | 'widget_draft'
  | 'widget_share'
  | 'widget_explore'
  | 'widget_error'

interface InspectorRendererProps {
  type: MessageType | string
  content: any
  showRawJson?: boolean
  className?: string
}

export function InspectorRenderer({ 
  type, 
  content, 
  showRawJson = true,
  className 
}: InspectorRendererProps) {
  // 根据类型渲染对应的 Inspector
  const renderInspector = () => {
    switch (type) {
      case 'text':
        return (
          <TextInspector 
            content={typeof content === 'string' ? content : content?.text || JSON.stringify(content)} 
            className={className}
          />
        )

      case 'widget_draft':
        return (
          <DraftInspector 
            data={content} 
            className={className}
          />
        )

      case 'widget_explore':
        return (
          <ExploreInspector 
            data={content} 
            className={className}
          />
        )

      case 'widget_dashboard':
        return (
          <div className={className}>
            <div className='mb-2 text-sm font-medium'>进场欢迎卡片 (Widget_Dashboard)</div>
            <RawJsonInspector data={content} defaultOpen />
          </div>
        )

      case 'widget_launcher':
        return (
          <div className={className}>
            <div className='mb-2 text-sm font-medium'>组局发射台 (Widget_Launcher)</div>
            <RawJsonInspector data={content} defaultOpen />
          </div>
        )

      case 'widget_action':
        return (
          <div className={className}>
            <div className='mb-2 text-sm font-medium'>快捷操作 (Widget_Action)</div>
            <RawJsonInspector data={content} defaultOpen />
          </div>
        )

      case 'widget_share':
        return (
          <div className={className}>
            <div className='mb-2 text-sm font-medium'>分享卡片 (Widget_Share)</div>
            <RawJsonInspector data={content} defaultOpen />
          </div>
        )

      case 'widget_error':
        return (
          <div className={className}>
            <div className='mb-2 text-sm font-medium text-destructive'>
              错误卡片 (Widget_Error)
            </div>
            <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
              {typeof content === 'string' ? content : content?.message || JSON.stringify(content)}
            </div>
          </div>
        )

      default:
        return (
          <div className={className}>
            <div className='mb-2 text-sm font-medium text-muted-foreground'>
              未知类型: {type}
            </div>
            <RawJsonInspector data={content} defaultOpen />
          </div>
        )
    }
  }

  return (
    <div className='space-y-3'>
      {renderInspector()}
      
      {/* 始终显示原始 JSON（可折叠） */}
      {showRawJson && type !== 'text' && (
        <RawJsonInspector 
          data={content} 
          title='原始数据' 
          defaultOpen={false}
        />
      )}
    </div>
  )
}
