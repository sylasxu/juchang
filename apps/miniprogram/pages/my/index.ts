import { getUserInfo } from '../../src/api/user'
import type { User } from '../../src/api/user'

interface MyPageData {
  isLoad: boolean
  userInfo: User | null
  gridList: Array<{
    name: string
    icon: string
    type: string
    url: string
  }>
  settingList: Array<{
    name: string
    icon: string
    type: string
    url: string
  }>
}

Page<MyPageData>({
  data: {
    isLoad: false,
    userInfo: null,
    gridList: [
      {
        name: '我发布的',
        icon: 'root-list',
        type: 'published',
        url: '',
      },
      {
        name: '我参与的',
        icon: 'user-group',
        type: 'joined',
        url: '',
      },
      {
        name: '我收藏的',
        icon: 'heart',
        type: 'favorites',
        url: '',
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
      { name: '设置', icon: 'setting', type: 'setting', url: '/pages/setting/index' },
    ],
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    // 更新 tabbar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        value: 'my'
      })
    }
    
    // 每次显示时检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  async checkLoginStatus() {
    const token = wx.getStorageSync('token') as string;
    
    if (!token) {
      this.setData({
        isLoad: false,
        userInfo: null
      });
      return;
    }

    try {
      // 获取最新用户信息
      const userInfo = await getUserInfo();
      
      this.setData({
        isLoad: true,
        userInfo: userInfo
      });

      // 更新本地存储
      wx.setStorageSync('userInfo', userInfo);
      
    } catch (error: any) {
      console.error('获取用户信息失败:', error);
      
      // Token 可能已过期，清除登录状态
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');
      
      this.setData({
        isLoad: false,
        userInfo: null
      });
    }
  },

  // 计算靠谱度
  getReliabilityRate(): string {
    const { userInfo } = this.data;
    if (!userInfo || userInfo.participationCount === 0) {
      return '新用户';
    }
    
    const rate = Math.round((userInfo.fulfillmentCount / userInfo.participationCount) * 100);
    
    if (rate === 100) return '⭐⭐⭐ 非常靠谱';
    if (rate >= 80) return '⭐⭐ 靠谱';
    if (rate >= 60) return '⭐ 一般';
    return '待提升';
  },

  // 跳转登录
  onLogin() {
    wx.navigateTo({
      url: '/pages/login/login',
    });
  },

  // 跳转个人资料编辑
  onNavigateTo() {
    if (!this.data.isLoad) {
      this.onLogin();
      return;
    }
    
    wx.navigateTo({ 
      url: '/pages/my/info-edit/index' 
    });
  },

  // 点击功能项
  onEleClick(e: WechatMiniprogram.TouchEvent) {
    const { data } = e.currentTarget.dataset;
    
    if (!this.data.isLoad) {
      this.onLogin();
      return;
    }
    
    if (data.url) {
      wx.navigateTo({
        url: data.url
      });
    } else {
      wx.showToast({
        title: `${data.name}功能开发中`,
        icon: 'none'
      });
    }
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          
          this.setData({
            isLoad: false,
            userInfo: null
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },
});