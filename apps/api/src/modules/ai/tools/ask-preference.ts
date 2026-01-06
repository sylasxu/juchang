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
type AskPreferenceParams = typeof askPreferenceSchema.static;

/**
 * 创建 askPreference Tool
 * 
 * @param _userId - 用户 ID（保留参数，与其他 Tool 签名一致）
 */
export function askPreferenceTool(_userId: string | null) {
  return tool({
    description: '询问偏好。探索意图但信息不完整时用，最多2次，调用后停止等待回复。',
    
    inputSchema: jsonSchema<AskPreferenceParams>(toJsonSchema(askPreferenceSchema)),
    
    execute: async (params: AskPreferenceParams) => {
      const { questionType, question, options, allowSkip = true, collectedInfo } = params;
      
      // v3.8: 对话记录由小程序端统一处理，Tool 只返回结果
      return {
        success: true as const,
        widgetType: 'widget_ask_preference' as const,
        questionType,
        question,
        options,
        allowSkip,
        collectedInfo,
      };
    },
  });
}
