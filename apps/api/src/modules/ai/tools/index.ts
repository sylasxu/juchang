/**
 * AI Tools Index
 * 
 * 导出所有 AI 工具函数
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
 * 获取所有 AI Tools
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
