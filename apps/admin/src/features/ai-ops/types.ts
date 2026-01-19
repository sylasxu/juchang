/**
 * AI Ops Advanced 类型定义
 * 所有类型从 Eden Treaty 推导，禁止导入 @juchang/db
 */

// ============================================
// RAG 相关类型
// ============================================

export interface RAGStats {
  totalActivities: number
  indexedActivities: number
  coverageRate: number
  embeddingModel: string
  embeddingDimension: number
  lastIndexedAt: string | null
}

export interface UnindexedActivity {
  id: string
  title: string
  createdAt: string
}

export interface SearchTestParams {
  semanticQuery: string
  lat: number
  lng: number
  radiusInKm: number
  type?: string
  userId?: string
}

export interface SearchTestResult {
  activity: {
    id: string
    title: string
    type: string
    locationName: string
    startAt: string
  }
  score: number
  finalScore: number
  distance: number
  maxSimBoost?: number
}

export interface SearchTestResponse {
  results: SearchTestResult[]
  embeddingTimeMs: number
  searchTimeMs: number
  totalTimeMs: number
}

export interface BackfillProgress {
  status: 'idle' | 'running' | 'completed' | 'failed'
  processed: number
  total: number
  success: number
  failed: number
  errors: Array<{ id: string; error: string }>
  startedAt?: string
  completedAt?: string
}

// ============================================
// Memory 相关类型
// ============================================

export interface EnhancedPreference {
  category: 'activity_type' | 'time' | 'location' | 'social' | 'food'
  sentiment: 'like' | 'dislike' | 'neutral'
  value: string
  confidence: number
  updatedAt: string
}

export interface EnhancedUserProfile {
  version: number
  preferences: EnhancedPreference[]
  frequentLocations: string[]
  lastUpdated: string
}

export interface InterestVector {
  activityId: string
  activityTitle: string
  participatedAt: string
  feedback?: 'positive' | 'neutral' | 'negative'
}

export interface UserMemoryProfile {
  userId: string
  nickname: string
  workingMemory: EnhancedUserProfile | null
  interestVectors: InterestVector[]
}

export interface MaxSimTestResult {
  query: string
  maxSim: number
  boostPercentage: number
}

// ============================================
// Security 相关类型
// ============================================

export interface SecurityOverviewStats {
  todayInputBlocks: number
  todayOutputBlocks: number
  todayRateLimits: number
  pendingCount: number
  sensitiveWordsCount: number
  guardrailsEnabled: boolean
  trend: Array<{
    date: string
    inputBlocks: number
    outputBlocks: number
    violations: number
  }>
}

export interface GuardrailsStats {
  todayInputBlocks: number
  todayOutputBlocks: number
  todayRateLimits: number
  byReason: Array<{
    reason: 'sensitive_word' | 'injection' | 'length' | 'rate_limit'
    count: number
  }>
  trend: Array<{
    date: string
    inputBlocks: number
    outputBlocks: number
  }>
  topPatterns: Array<{
    pattern: string
    count: number
  }>
}

export interface SensitiveWordsState {
  words: string[]
  totalCount: number
}

export interface ModerationItem {
  id: string
  contentType: 'activity' | 'message' | 'profile'
  contentId: string
  contentPreview: string
  userId: string
  userNickname: string
  flagReason: 'sensitive_word' | 'user_report' | 'auto_detect'
  flaggedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface ModerationQueueState {
  items: ModerationItem[]
  total: number
  pendingCount: number
}

export interface ViolationStats {
  totalViolations: number
  byCategory: Array<{
    category: 'sensitive_word' | 'spam' | 'harassment' | 'other'
    count: number
    percentage: number
  }>
  trend: Array<{
    date: string
    count: number
  }>
  topUsers: Array<{
    userId: string
    nickname: string
    violationCount: number
  }>
  avgReviewTimeMinutes: number
}

// ============================================
// 通用类型
// ============================================

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
