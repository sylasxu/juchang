/**
 * 智能欢迎卡片服务
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 *
 * 调用 /ai/welcome API 获取个性化欢迎卡片数据
 */

import { wxRequest } from '../utils/wx-request';

// 快捷按钮类型
export type QuickActionType = 'explore_nearby' | 'continue_draft' | 'find_partner';

// 探索附近按钮上下文
export interface ExploreNearbyContext {
  locationName: string;
  lat: number;
  lng: number;
  activityCount: number;
}

// 继续草稿按钮上下文
export interface ContinueDraftContext {
  activityId: string;
  activityTitle: string;
}

// 找搭子按钮上下文
export interface FindPartnerContext {
  activityType: string;
  activityTypeLabel: string;
  suggestedPrompt: string;
}

// 快捷按钮
export interface QuickAction {
  type: QuickActionType;
  label: string;
  context: ExploreNearbyContext | ContinueDraftContext | FindPartnerContext;
}

// Welcome API 响应
export interface WelcomeResponse {
  greeting: string;
  quickActions: QuickAction[];
  fallbackPrompt: string;
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
