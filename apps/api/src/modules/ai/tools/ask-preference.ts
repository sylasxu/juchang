/**
 * askPreference Tool
 * 
 * 多轮对话信息收集工具。当用户表达探索意图但信息不完整时使用：
 * - "有什么好玩的活动" → 询问位置偏好
 * - "观音桥有什么活动" → 询问类型偏好
 * 
 * 返回 widget_ask_preference 卡片供前端渲染选项按钮。
 */

import { t } from 'elysia';
import { tool, jsonSchema } from 'ai';
import { toJsonSchema } from '@juchang/utils';
import { db, conversations } from '@juchang/db';

/**
 * 选项结构
 */
const optionSchema = t.Object({
  label: t.String({ description: '选项显示文本，如"观音桥"或"🍜 美食"' }),
  value: t.String({ description: '选项值，用于后续处理' }),
});

/**
 * 已收集信息结构
 */
const collectedInfoSchema = t.Object({
  location: t.Optional(t.String({ description: '已收集的位置信息' })),
  type: t.Optional(t.String({ description: '已收集的活动类型' })),
}, { description: '已收集的信息，用于多轮对话上下文传递' });

/**
 * Tool Schema - 使用 TypeBox 语法
 * 每个字段包含 description 属性供 AI 理解参数含义
 */
const askPreferenceSchema = t.Object({
  questionType: t.Union([
    t.Literal('location'),
    t.Literal('type'),
  ], { description: '询问的偏好类型：location=位置偏好，type=活动类型偏好' }),
  
  question: t.String({ 
    description: '询问用户的问题文本，需符合小聚人设（热情、不聒噪、包含 Emoji）' 
  }),
  
  options: t.Array(optionSchema, { 
    description: '推荐选项列表（至少3个），用户可点击快速选择',
    minItems: 3,
  }),
  
  allowSkip: t.Boolean({ 
    description: '是否允许跳过（显示"随便/都可以"按钮）',
    default: true,
  }),
  
  collectedInfo: t.Optional(collectedInfoSchema),
});

/** 类型自动推导 */
export type AskPreferenceParams = typeof askPreferenceSchema.static;

/** Tool 返回类型 */
export interface AskPreferenceResult {
  success: boolean;
  widgetType: 'widget_ask_preference';
  questionType: 'location' | 'type';
  question: string;
  options: Array<{ label: string; value: string }>;
  allowSkip: boolean;
  collectedInfo?: {
    location?: string;
    type?: string;
  };
  error?: string;
}

/**
 * 创建 askPreference Tool
 * 
 * @param userId - 用户 ID，null 时为测试模式（不写数据库）
 */
export function askPreferenceTool(userId: string | null) {
  return tool<AskPreferenceParams, AskPreferenceResult>({
    description: `多轮对话信息收集工具。当用户表达探索意图但信息不完整时使用。

使用场景：
- 用户说"有什么好玩的活动"但未提供位置 → 调用此工具询问位置偏好
- 用户说"观音桥有什么活动"但未提供类型 → 调用此工具询问类型偏好

规则：
- 优先询问位置（因为 LBS 是核心）
- 最多调用 2 次，避免过度打扰用户
- 如果用户说"随便"、"都可以"等快捷路径关键词，不要调用此工具，直接调用 exploreNearby

返回的数据会渲染为 widget_ask_preference 卡片，用户可以点击选项按钮或"随便"按钮。`,
    
    inputSchema: jsonSchema<AskPreferenceParams>(toJsonSchema(askPreferenceSchema)),
    
    execute: async (params): Promise<AskPreferenceResult> => {
      const { questionType, question, options, allowSkip = true, collectedInfo } = params;
      
      const result: AskPreferenceResult = {
        success: true,
        widgetType: 'widget_ask_preference',
        questionType,
        question,
        options,
        allowSkip,
        collectedInfo,
      };
      
      // 测试模式（无用户）：不写数据库
      if (!userId) {
        return result;
      }
      
      try {
        // 记录对话
        await db
          .insert(conversations)
          .values({
            userId,
            role: 'assistant',
            messageType: 'widget_ask_preference',
            content: result,
          });
        
        return result;
      } catch (error) {
        console.error('[askPreference] Error:', error);
        return {
          success: false,
          widgetType: 'widget_ask_preference',
          questionType,
          question,
          options,
          allowSkip,
          collectedInfo,
          error: '保存对话失败，请再试一次',
        };
      }
    },
  });
}
