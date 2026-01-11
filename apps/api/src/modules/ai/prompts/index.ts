/**
 * Prompts Module - 提示词模块
 * 
 * 导出提示词相关类型和函数
 */

// Types
export type {
  PromptContext,
  ActivityDraftForPrompt,
  PromptTemplate,
  PromptInfo,
} from './types';

// Builder utilities
export {
  formatDateTime,
  getTomorrowStr,
  escapeXml,
  buildContextSection,
  buildRoleSection,
  buildRulesSection,
  buildExamplesSection,
  combinePromptSections,
} from './builder';

// Xiaoju Prompt (v3.9)
export {
  PROMPT_VERSION,
  PROMPT_TECHNIQUES,
  buildXmlSystemPrompt,
  getPromptInfo,
} from './xiaoju-v39';
