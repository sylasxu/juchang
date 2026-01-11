/**
 * Prompt Builder - 动态 Prompt 构建
 * 
 * 提供 Prompt 构建的工具函数
 */

import type { PromptContext } from './types';

/**
 * 格式化日期时间（中文友好格式）
 */
export function formatDateTime(date: Date): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = weekdays[date.getDay()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${weekday} ${hours}:${minutes}`;
}

/**
 * 获取明天的日期字符串
 */
export function getTomorrowStr(currentTime: Date): string {
  const tomorrow = new Date(currentTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
}

/**
 * XML 转义
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 构建上下文 XML 片段
 */
export function buildContextSection(context: PromptContext): string {
  const { currentTime, userLocation, userNickname, draftContext } = context;
  
  const timeStr = formatDateTime(currentTime);
  
  // 位置信息
  const locationStr = userLocation
    ? `${userLocation.lat.toFixed(4)},${userLocation.lng.toFixed(4)} (${escapeXml(userLocation.name || '当前位置')})`
    : '未提供';
  
  // 草稿上下文（JSON 格式更紧凑）
  const draftJson = draftContext 
    ? JSON.stringify({
        id: draftContext.activityId,
        title: draftContext.currentDraft.title,
        type: draftContext.currentDraft.type,
        location: draftContext.currentDraft.locationName,
        time: draftContext.currentDraft.startAt,
      })
    : '';

  const lines = [
    `时间: ${timeStr}`,
    `位置: ${locationStr}`,
  ];

  if (userNickname) {
    lines.push(`用户: ${escapeXml(userNickname)}`);
  }

  if (draftJson) {
    lines.push(`草稿: ${draftJson}`);
  }

  return `<context>\n${lines.join('\n')}\n</context>`;
}

/**
 * 构建角色定义
 */
export function buildRoleSection(
  name: string,
  description: string,
  personality: string,
  principle: string
): string {
  return `<role>
你是${name}，${description}
性格：${personality}
原则：${principle}
</role>`;
}

/**
 * 构建规则列表
 */
export function buildRulesSection(rules: string[]): string {
  const numbered = rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n');
  return `<rules>\n${numbered}\n</rules>`;
}

/**
 * 构建示例部分
 */
export function buildExamplesSection(examples: Array<{ user: string; assistant: string; context?: string }>): string {
  const formatted = examples.map(ex => {
    const lines = [`U: ${ex.user}`];
    if (ex.context) {
      lines.push(`CTX: ${ex.context}`);
    }
    lines.push(`A: ${ex.assistant}`);
    return lines.join('\n');
  }).join('\n\n');

  return `<examples>\n${formatted}\n</examples>`;
}

/**
 * 组合多个 Prompt 片段
 */
export function combinePromptSections(...sections: string[]): string {
  return sections.filter(Boolean).join('\n\n');
}
