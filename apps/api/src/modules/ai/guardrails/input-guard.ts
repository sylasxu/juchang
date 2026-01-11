/**
 * Input Guard - 输入护栏
 * 
 * 检测和过滤恶意输入
 */

import type { GuardResult, InputGuardConfig, RiskLevel } from './types';
import { DEFAULT_INPUT_GUARD_CONFIG } from './types';

/**
 * 注入攻击模式
 */
const INJECTION_PATTERNS = [
  // Prompt 注入
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/i,
  /disregard\s+(previous|above|all)/i,
  /forget\s+(everything|all|previous)/i,
  /你是一个|你现在是|假装你是|扮演/,
  /system\s*prompt/i,
  /\[INST\]|\[\/INST\]/i,
  /<\|im_start\|>|<\|im_end\|>/i,
  
  // 越狱尝试
  /jailbreak/i,
  /DAN\s*mode/i,
  /developer\s*mode/i,
];

/**
 * 敏感词列表（基础）
 */
const SENSITIVE_WORDS = [
  // 政治敏感
  '习近平', '共产党', '六四', '天安门', '法轮功',
  // 暴力相关
  '杀人', '自杀', '炸弹', '枪支',
  // 色情相关
  '色情', '裸体', '性交',
  // 诈骗相关
  '刷单', '兼职赚钱', '高额回报',
];

/**
 * 检查输入
 */
export function checkInput(
  input: string,
  config: Partial<InputGuardConfig> = {}
): GuardResult {
  const cfg = { ...DEFAULT_INPUT_GUARD_CONFIG, ...config };
  const triggeredRules: string[] = [];
  let riskLevel: RiskLevel = 'low';
  
  // 1. 长度检查
  if (input.length > cfg.maxInputLength) {
    return {
      passed: false,
      blocked: true,
      reason: '输入内容过长',
      riskLevel: 'medium',
      triggeredRules: ['max_length'],
      suggestedResponse: '消息太长了，请精简一下再发送～',
    };
  }
  
  // 2. 注入检测
  if (cfg.enableInjectionDetection) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        triggeredRules.push('injection_detected');
        riskLevel = 'high';
        break;
      }
    }
  }
  
  // 3. 敏感词检测
  if (cfg.enableSensitiveWordDetection) {
    const allSensitiveWords = [
      ...SENSITIVE_WORDS,
      ...(cfg.customSensitiveWords || []),
    ];
    
    for (const word of allSensitiveWords) {
      if (input.includes(word)) {
        triggeredRules.push('sensitive_word');
        riskLevel = riskLevel === 'high' ? 'critical' : 'high';
        break;
      }
    }
  }
  
  // 判断是否阻止
  const blocked = riskLevel === 'high' || riskLevel === 'critical';
  
  return {
    passed: !blocked,
    blocked,
    reason: blocked ? '检测到不当内容' : undefined,
    riskLevel,
    triggeredRules: triggeredRules.length > 0 ? triggeredRules : undefined,
    suggestedResponse: blocked ? '这个话题我帮不了你 😅' : undefined,
  };
}

/**
 * 清理输入（移除潜在危险内容）
 */
export function sanitizeInput(input: string): string {
  let sanitized = input;
  
  // 移除控制字符
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // 移除过多的空白
  sanitized = sanitized.replace(/\s{10,}/g, ' ');
  
  // 移除潜在的 prompt 注入标记
  sanitized = sanitized.replace(/<\|[^|]+\|>/g, '');
  sanitized = sanitized.replace(/\[INST\]|\[\/INST\]/gi, '');
  
  return sanitized.trim();
}

/**
 * 快速检查（仅检查是否应该阻止）
 */
export function shouldBlock(input: string): boolean {
  const result = checkInput(input);
  return result.blocked;
}

