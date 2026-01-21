/**
 * Processors Module - 处理器模块
 * 
 * 导出所有 Processor 纯函数
 * 
 * v4.6 重构：
 * - Processor 作为纯函数，不使用抽象接口
 * - 每个 Processor 可独立调用和测试
 * - 流程透明，便于调试
 */

// ============ Input Processors ============

export {
    sanitizeAndGuard,
    type InputGuardResult,
} from './input-guard';

export {
    injectUserProfile,
} from './user-profile';

export {
    injectSemanticRecall,
    type SemanticRecallOptions,
} from './semantic-recall';

export {
    truncateByTokenLimit,
    estimateTokens,
} from './token-limit';

// ============ Output Processors ============

export {
    saveConversationHistory,
    type ToolCallTrace,
} from './save-history';

export {
    extractAndUpdatePreferences,
} from './extract-preferences';
