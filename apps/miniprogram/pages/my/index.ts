/**
 * 个人中心页面
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 * - 显示用户头像、昵称、靠谱度等级
 * - 统计数据展示（组织场次、参与场次、收到差评次数）
 * - 我发布的/我参与的活动列表入口
 * - 未登录显示登录入口
 */
import { getUsersById } from '../../src/api/endpoints/users/users';
import type { GetUsersById200 } from '../../src/api/model';

// ==================== 类型定义 ====================

interface UserInfo {
  id: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
  phoneNumber?: string;
  membershipType?: string;
  reliabilityRate?: number;
  participationCount: number;
  fulfillmentCount: number;
  activitiesCreatedCount: number;
  negativeFeedbackCount?: number;
}

interface GridItem {
  name: string;
  icon: string;
  type: string;
  url: string;
  badge?: number;
}

interface SettingItem {
  name: string;
  icon: string;
  type: string;
  url: string;
}

interface PageData {
  /** 是否已登录 */
  isLoad: boolean;
  /** 用户信息 */
  userInfo: UserInfo | null;
  /** 功能网格 */
  gridList: GridItem[];
  /** 设置列表 */
  settingList: SettingItem[];
  /** 靠谱度等级文本 */
  reliabilityLabel: string;
  /** 靠谱度百分比 */
  reliabilityRate: number;
}

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    isLoad: false,
    userInfo: null,
    gridList: [
      {
        name: '我发布的',
        icon: 'root-list',
        type: 'published',
        url: '/subpackages/activity/list/index?type=published',
      },
      {
        name: '我参与的',
        icon: 'user-group',
        type: 'joined',
        url: '/subpackages/activity/list/index?type=joined',
      },
      {
        name: '我收藏的',
        icon: 'heart',
        type: 'favorites',
        url: '/subpackages/activity/list/index?type=favorites',
      },
      {
        name: '我的数据',
        icon: 'chart-bar',
        type: 'data',
        url: '/pages/dataCenter/index',
      },
    ],
    settingList: [
      { name: '个人资料', icon: 'user', type: 'profile', url: '/pages/my/info-edit/index' },
      { name: '安全中心', icon: 'secured', type: 'safety', url: '/pages/safety/index' },
      { name: '设置', icon: 'setting', type: 'setting', url: '/pages/setting/index' },
    ],
    reliabilityLabel: '新用户',
    reliabilityRate: 0,
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    // 更新 TabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'my' });
    }

    // 每次显示时检查登录状态
    this.checkLoginStatus();
  },

  // ==================== 登录状态检查 ====================

  async checkLoginStatus() {
    const token = wx.getStorageSync('token') || '';
    const cachedUserInfo = wx.getStorageSync('userInfo') as UserInfo | null;

    if (!token || !cachedUserInfo?.id) {
      this.setData({
        isLoad: false,
        userInfo: null,
        reliabilityLabel: '新用户',
        reliabilityRate: 0,
      });
      return;
    }

    try {
      const response = await getUsersById(cachedUserInfo.id);

      if (response.status === 200) {
        const apiUser = response.data as GetUsersById200;
        const userInfo: UserInfo = {
          id: apiUser.id,
          nickname: apiUser.nickname || '',
          avatarUrl: apiUser.avatarUrl || undefined,
          phoneNumber: apiUser.phoneNumber || undefined,
          participationCount: apiUser.participationCount,
          fulfillmentCount: apiUser.participationCount, // TODO: 后端需要添加 fulfillmentCount 字段
          activitiesCreatedCount: apiUser.activitiesCreatedCount,
        };

        // 计算靠谱度 (Requirements: 12.1)
        const { reliabilityLabel, reliabilityRate } = this.calculateReliability(userInfo);

        this.setData({
          isLoad: true,
          userInfo,
          reliabilityLabel,
          reliabilityRate,
        });

        // 更新本地存储
        wx.setStorageSync('userInfo', userInfo);
      } else {
        throw new Error('获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);

      // Token 可能已过期，清除登录状态
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');

      this.setData({
        isLoad: false,
        userInfo: null,
        reliabilityLabel: '新用户',
        reliabilityRate: 0,
      });
    }
  },

  // ==================== 靠谱度计算 (Requirements: 12.1, 12.2) ====================

  calculateReliability(userInfo: UserInfo): { reliabilityLabel: string; reliabilityRate: number } {
    if (!userInfo || userInfo.participationCount === 0) {
      return { reliabilityLabel: '🆕 新用户', reliabilityRate: 0 };
    }

    const rate = Math.round((userInfo.fulfillmentCount / userInfo.participationCount) * 100);

    let label: string;
    if (rate === 100) {
      label = '⭐⭐⭐ 非常靠谱';
    } else if (rate >= 80) {
      label = '⭐⭐ 靠谱';
    } else if (rate >= 60) {
      label = '⭐ 一般';
    } else {
      label = '待提升';
    }

    return { reliabilityLabel: label, reliabilityRate: rate };
  },

  // ==================== 事件处理 ====================

  /** 跳转登录 (Requirements: 12.5) */
  onLogin() {
    wx.navigateTo({
      url: '/pages/login/login',
    });
  },

  /** 跳转个人资料编辑 */
  onNavigateTo() {
    if (!this.data.isLoad) {
      this.onLogin();
      return;
    }

    wx.navigateTo({
      url: '/pages/my/info-edit/index',
    });
  },

  /** 点击功能项 (Requirements: 12.3, 12.4) */
  onEleClick(e: WechatMiniprogram.TouchEvent) {
    const { data } = e.currentTarget.dataset as { data: GridItem | SettingItem };

    // 未登录时跳转登录 (Requirements: 12.5)
    if (!this.data.isLoad) {
      this.onLogin();
      return;
    }

    if (data.url) {
      wx.navigateTo({
        url: data.url,
        fail: () => {
          wx.showToast({
            title: `${data.name}功能开发中`,
            icon: 'none',
          });
        },
      });
    } else {
      wx.showToast({
        title: `${data.name}功能开发中`,
        icon: 'none',
      });
    }
  },

  /** 退出登录 */
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmColor: '#FF6B35',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');

          this.setData({
            isLoad: false,
            userInfo: null,
            reliabilityLabel: '新用户',
            reliabilityRate: 0,
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success',
          });
        }
      },
    });
  },
});
