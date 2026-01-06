/**
 * 智能欢迎卡片服务
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 * v3.10 重构: 分组结构 (sections)
 *
 * 调用 /ai/welcome API 获取个性化欢迎卡片数据
 */

import { wxRequest } from '../utils/wx-request';

// 快捷项类型
export type QuickItemType = 'draft' | 'suggestion' | 'explore';

// 快捷项
export interface QuickItem {
  type: QuickItemType;
  icon?: string;
  label: string;
  prompt: string;
  context?: Record<string, unknown>;
}

// 分组
export interface WelcomeSection {
  id: string;
  icon: string;
  title: string;
  items: QuickItem[];
}

// Welcome API 响应 (v3.10)
export interface WelcomeResponse {
  greeting: string;
  subGreeting?: string;
  sections: WelcomeSection[];
}

// Welcome API 查询参数
export interface WelcomeQuery {
  lat?: number;
  lng?: number;
}

/**
 * 获取欢迎卡片数据
 * Requirements: 1.1, 1.4, 1.5
 * 
 * @param params 可选的位置参数
 * @returns 欢迎卡片数据
 */
export async function getWelcomeCard(params?: WelcomeQuery): Promise<WelcomeResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.lat !== undefined) {
    queryParams.append('lat', params.lat.toString());
  }
  if (params?.lng !== undefined) {
    queryParams.append('lng', params.lng.toString());
  }
  
  const queryString = queryParams.toString();
  const url = queryString ? `/ai/welcome?${queryString}` : '/ai/welcome';
  
  const response = await wxRequest<WelcomeResponse>(url, {
    method: 'GET',
  });
  
  return response;
}

/**
 * 获取用户当前位置
 * @returns 位置信息或 null
 */
export function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        resolve({
          lat: res.latitude,
          lng: res.longitude,
        });
      },
      fail: () => {
        // 位置获取失败，返回 null
        resolve(null);
      },
    });
  });
}

/**
 * 从 sections 中提取指定类型的 items
 */
export function getSectionItems(sections: WelcomeSection[], sectionId: string): QuickItem[] {
  const section = sections.find(s => s.id === sectionId);
  return section?.items || [];
}

/**
 * 从 sections 中提取草稿项（如果有）
 */
export function getDraftItem(sections: WelcomeSection[]): QuickItem | null {
  const draftSection = sections.find(s => s.id === 'draft');
  return draftSection?.items[0] || null;
}
