/**
 * AI Tools Index
 * 
 * 导出所有 AI 工具函数
 */

export { createActivityDraftTool } from './create-draft';
export { refineDraftTool } from './refine-draft';
export { exploreNearbyTool } from './explore-nearby';
export { publishActivityTool } from './publish-activity';
export { askPreferenceTool } from './ask-preference';

import { createActivityDraftTool } from './create-draft';
import { refineDraftTool } from './refine-draft';
import { exploreNearbyTool } from './explore-nearby';
import { publishActivityTool } from './publish-activity';
import { askPreferenceTool } from './ask-preference';

/**
 * 获取所有 AI Tools
 * 
 * @param userId - 用户 ID
 */
export function getAIToolsV34(userId: string | null) {
  return {
    createActivityDraft: createActivityDraftTool(userId),
    refineDraft: refineDraftTool(userId),
    exploreNearby: exploreNearbyTool(userId),
    publishActivity: publishActivityTool(userId),
    askPreference: askPreferenceTool(userId),
  };
}
