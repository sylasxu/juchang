/**
 * Workflow Module - 工作流模块
 * 
 * HITL (Human-in-the-Loop) 工作流系统
 * 保留：broker, draft-flow, match-flow, workflow
 * 删除：preference-flow（与 broker 重叠）
 */

// Types
export type {
  WorkflowStatus,
  WorkflowType,
  WorkflowState,
  WorkflowStep,
  WorkflowStepResult,
  WorkflowDefinition,
  WorkflowEvent,
} from './types';

// Core Workflow
export {
  createWorkflow,
  getWorkflow,
  getUserActiveWorkflows,
  executeStep,
  cancelWorkflow,
  completeWorkflow,
  updateWorkflowData,
  cleanupExpiredWorkflows,
  canContinue,
} from './workflow';

// Draft Flow
export type { DraftFlowData, DraftModifyInput, DraftConfirmInput } from './draft-flow';
export {
  draftFlowDefinition,
  createDraftFlow,
  handleDraftInput,
  getDraftFlow,
  isDraftPublished,
} from './draft-flow';

// Match Flow
export type { MatchFlowData, MatchConfirmInput } from './match-flow';
export {
  matchFlowDefinition,
  createMatchFlow,
  handleMatchInput,
  getMatchFlow,
  isMatchConfirmed,
  isMatchExpired,
} from './match-flow';

// Broker Mode - 找搭子追问流程
export type {
  BrokerState,
  BrokerQuestion,
} from './broker';
export {
  shouldEnterBrokerMode,
  createBrokerState,
  updateBrokerState,
  pauseBrokerState,
  completeBrokerState,
  getNextQuestion,
  buildAskPrompt,
  parseUserAnswer,
  isTopicSwitch,
  persistBrokerState,
  recoverBrokerState,
  clearBrokerState,
} from './broker';
