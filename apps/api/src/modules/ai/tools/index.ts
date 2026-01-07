/**
 * AI Tools Index
 * 
 * 导出所有 AI 工具函数
 * 
 * v3.9: 支持动态加载 Tool，根据意图只加载需要的 Tool，减少 Token 消耗
 */

export { createActivityDraftTool } from './create-draft';
export { getDraftTool } from './get-draft';
export { refineDraftTool } from './refine-draft';
export { publishActivityTool } from './publish-activity';
export { exploreNearbyTool } from './explore-nearby';
export { askPreferenceTool } from './ask-preference';
export { joinActivityTool } from './join-activity';
export { cancelActivityTool } from './cancel-activity';
export { getMyActivitiesTool } from './get-my-activities';
export { getActivityDetailTool } from './get-activity-detail';

import { createActivityDraftTool } from './create-draft';
import { getDraftTool } from './get-draft';
import { refineDraftTool } from './refine-draft';
import { publishActivityTool } from './publish-activity';
import { exploreNearbyTool } from './explore-nearby';
import { askPreferenceTool } from './ask-preference';
import { joinActivityTool } from './join-activity';
import { cancelActivityTool } from './cancel-activity';
import { getMyActivitiesTool } from './get-my-activities';
import { getActivityDetailTool } from './get-activity-detail';

/**
 * 意图类型
 */
export type IntentType = 'create' | 'explore' | 'manage' | 'idle' | 'chitchat' | 'unknown';

/**
 * 简单规则预分类意图（不需要 LLM）
 * 
 * @param message - 用户消息
 * @param hasDraftContext - 是否有草稿上下文
 */
export function classifyIntent(message: string, hasDraftContext: boolean, previousIntent?: IntentType): IntentType {
  const text = message.toLowerCase();
  
  // 管理意图（优先级最高）
  if (/我的活动|我发布的|我参与的|取消活动|不办了/.test(text)) {
    return 'manage';
  }
  
  // 修改意图（需要草稿上下文）
  if (hasDraftContext && /改|换|加|减|调|发布/.test(text)) {
    return 'create';
  }
  
  // 明确创建意图（用户明确要自己组局）
  if (/帮我组|帮我创建|自己组|我来组|我要组|我想组/.test(text)) {
    return 'create';
  }
  
  // 探索意图（想找人/想找活动/一起/有什么/推荐）
  // "想找人一起打羽毛球" = 探索，不是创建
  if (/想找|找人|一起|有什么|附近|推荐|看看|想.*打|想.*吃|想.*玩/.test(text)) {
    return 'explore';
  }
  
  // 兜底：其他"想/约"等词汇也归为探索
  if (/想|约/.test(text)) {
    return 'explore';
  }
  
  // 无法识别时，继承上一轮意图（多轮对话连贯性）
  if (previousIntent && previousIntent !== 'unknown') {
    return previousIntent;
  }
  
  return 'unknown';
}

/**
 * 获取所有 AI Tools（完整版，兼容旧代码）
 * 
 * @param userId - 用户 ID
 */
export function getAIToolsV34(userId: string | null) {
  return {
    // 创建流程
    createActivityDraft: createActivityDraftTool(userId),
    getDraft: getDraftTool(userId),
    refineDraft: refineDraftTool(userId),
    publishActivity: publishActivityTool(userId),
    // 探索流程
    exploreNearby: exploreNearbyTool(userId),
    getActivityDetail: getActivityDetailTool(userId),
    // 参与流程
    joinActivity: joinActivityTool(userId),
    cancelActivity: cancelActivityTool(userId),
    // 查询
    getMyActivities: getMyActivitiesTool(userId),
    // 交互
    askPreference: askPreferenceTool(userId),
  };
}

/**
 * 根据意图动态获取 Tools（精简版，减少 Token）
 * 
 * @param userId - 用户 ID
 * @param intent - 意图类型
 * @param hasDraftContext - 是否有草稿上下文
 */
export function getToolsByIntent(
  userId: string | null, 
  intent: IntentType,
  hasDraftContext: boolean
) {
  const tools: Record<string, ReturnType<typeof createActivityDraftTool>> = {};
  
  switch (intent) {
    case 'create':
      // 创建流程：创建、修改、发布
      tools.createActivityDraft = createActivityDraftTool(userId);
      if (hasDraftContext) {
        tools.refineDraft = refineDraftTool(userId);
        tools.publishActivity = publishActivityTool(userId);
      }
      tools.getDraft = getDraftTool(userId);
      break;
      
    case 'explore':
      // 探索流程：探索、详情、报名、询问偏好
      tools.exploreNearby = exploreNearbyTool(userId);
      tools.getActivityDetail = getActivityDetailTool(userId);
      tools.joinActivity = joinActivityTool(userId);
      tools.askPreference = askPreferenceTool(userId);
      break;
      
    case 'manage':
      // 管理流程：我的活动、取消
      tools.getMyActivities = getMyActivitiesTool(userId);
      tools.cancelActivity = cancelActivityTool(userId);
      tools.getActivityDetail = getActivityDetailTool(userId);
      break;
      
    case 'idle':
      // 空闲/暂停：不需要任何 Tool，直接让 AI 生成回复
      break;
      
    case 'chitchat':
      // 闲聊：不需要任何 Tool，用模板回复
      break;
      
    default:
      // 未知意图：加载核心 Tools
      tools.createActivityDraft = createActivityDraftTool(userId);
      tools.exploreNearby = exploreNearbyTool(userId);
      tools.askPreference = askPreferenceTool(userId);
      break;
  }
  
  return tools;
}
