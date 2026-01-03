/**
 * AI Tools Index
 * 
 * 导出所有 AI 工具函数
 */

export { createActivityDraftTool, type CreateActivityDraftParams } from './create-draft';
export { refineDraftTool, type RefineDraftParams } from './refine-draft';
export { exploreNearbyTool, type ExploreNearbyParams } from './explore-nearby';
export { publishActivityTool, type PublishActivityParams } from './publish-activity';
export { askPreferenceTool, type AskPreferenceParams } from './ask-preference';

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
