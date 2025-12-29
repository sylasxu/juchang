/**
 * Widget Share 组件
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 * 
 * 创建成功卡片 (v3.5 零成本地图方案)
 * - 显示原生分享卡片预览
 * - 使用位置文字卡片替代静态地图（零成本）
 * - 实现 [📤 分享到群] 按钮
 * - 实现 [👀 查看详情] 按钮
 */

import { openMapNavigation } from '../../src/config/index';

// 活动数据类型
interface ActivityData {
  id: string;
  title: string;
  type: string;
  startAt: string;
  location: [number, number]; // [lng, lat]
  locationName: string;
  locationHint?: string;
  maxParticipants: number;
  currentParticipants?: number;
  shareTitle?: string; // AI 生成的骚气标题
}

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 活动数据
    activity: {
      type: Object,
      value: {} as ActivityData,
    },
  },

  data: {
    formattedTime: '',
    shareTitle: '',
    participantsText: '',
  },

  observers: {
    'activity': function(activity: ActivityData) {
      if (!activity || !activity.id) return;
      
      // 格式化时间
      const formattedTime = this.formatTime(activity.startAt);
      
      // 分享标题（优先使用 AI 生成的骚气标题）
      const shareTitle = activity.shareTitle || `🔥 ${activity.title}，快来！`;
      
      // 参与人数
      const current = activity.currentParticipants || 1;
      const max = activity.maxParticipants;
      const remaining = max - current;
      const participantsText = remaining > 0 
        ? `还差 ${remaining} 人` 
        : '人数已满';
      
      this.setData({
        formattedTime,
        shareTitle,
        participantsText,
      });
    },
  },

  methods: {
    /**
     * 格式化时间
     */
    formatTime(dateStr: string): string {
      if (!dateStr) return '';
      
      const date = new Date(dateStr);
      const now = new Date();
      
      // 判断是否是今天
      const isToday = date.toDateString() === now.toDateString();
      
      // 判断是否是明天
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = date.toDateString() === tomorrow.toDateString();
      
      // 格式化时间
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      if (isToday) {
        return `今天 ${timeStr}`;
      }
      
      if (isTomorrow) {
        return `明天 ${timeStr}`;
      }
      
      // 其他日期
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日 ${timeStr}`;
    },

    /**
     * 点击位置卡片 - 打开原生地图导航
     */
    onLocationTap() {
      const activity = this.properties.activity as ActivityData;
      if (!activity?.location) return;
      
      const [lng, lat] = activity.location;
      
      // 使用微信原生 API 打开地图
      openMapNavigation({
        latitude: lat,
        longitude: lng,
        name: activity.locationName,
        address: activity.locationHint || '',
      });
    },

    /**
     * 点击分享到群
     * Requirements: 7.3, 7.4
     */
    onShareTap() {
      const activity = this.properties.activity as ActivityData;
      if (!activity || !activity.id) return;
      
      // 触发分享事件
      this.triggerEvent('share', { activity });
      
      // 触发微信分享
      // 注意：实际分享需要在页面的 onShareAppMessage 中处理
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline'],
      });
    },

    /**
     * 点击查看详情
     * Requirements: 7.5, 7.6
     */
    onViewDetail() {
      const activity = this.properties.activity as ActivityData;
      if (!activity || !activity.id) return;
      
      // 触发事件
      this.triggerEvent('viewdetail', { activity });
      
      // 跳转到活动详情页
      wx.navigateTo({
        url: `/subpackages/activity/detail/index?id=${activity.id}`,
      });
    },
  },
});
