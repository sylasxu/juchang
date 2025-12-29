/**
 * Widget Draft 组件
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 * 
 * 意图解析卡片 (v3.5 零成本地图方案)
 * - 显示 AI 预填的标题、时间、地点、类型
 * - 使用位置文字卡片替代静态地图（零成本）
 * - 点击位置卡片打开原生地图导航
 * - 实现 [📍 调整位置] 按钮（使用 wx.chooseLocation）
 * - 实现 [✅ 确认发布] 按钮
 */

import { openMapNavigation, chooseLocation } from '../../src/config/index';

// 活动类型映射
const TYPE_CONFIG: Record<string, { icon: string; label: string; colorClass: string }> = {
  food: { icon: 'shop', label: '美食', colorClass: 'amber' },
  entertainment: { icon: 'film', label: '娱乐', colorClass: 'purple' },
  sports: { icon: 'heart', label: '运动', colorClass: 'mint' },
  boardgame: { icon: 'app', label: '桌游', colorClass: 'blue' },
  mahjong: { icon: 'app', label: '麻将', colorClass: 'amber' },
  hotpot: { icon: 'shop', label: '火锅', colorClass: 'amber' },
  ktv: { icon: 'sound', label: 'KTV', colorClass: 'purple' },
  movie: { icon: 'film', label: '电影', colorClass: 'purple' },
  game: { icon: 'app', label: '游戏', colorClass: 'purple' },
  drink: { icon: 'shop', label: '喝酒', colorClass: 'amber' },
  coffee: { icon: 'shop', label: '咖啡', colorClass: 'amber' },
  hiking: { icon: 'location', label: '徒步', colorClass: 'mint' },
  other: { icon: 'ellipsis', label: '其他', colorClass: 'blue' },
};

// 草稿数据类型
interface DraftData {
  activityId: string;
  title: string;
  description?: string;
  type: string;
  startAt: string;
  location: [number, number]; // [lng, lat]
  locationName: string;
  address?: string;
  locationHint: string;
  maxParticipants: number;
}

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 草稿数据
    draft: {
      type: Object,
      value: {} as DraftData,
    },
    // 是否正在加载
    loading: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    typeIcon: 'ellipsis',
    typeLabel: '活动',
    colorClass: 'blue',
    formattedTime: '',
    isExpired: false,
  },

  observers: {
    'draft': function(draft: DraftData) {
      if (!draft) return;
      
      // 更新类型信息
      const typeConfig = TYPE_CONFIG[draft.type] || TYPE_CONFIG.other;
      
      // 格式化时间
      const formattedTime = this.formatTime(draft.startAt);
      
      // 检查是否过期
      const isExpired = this.checkExpired(draft.startAt);
      
      this.setData({
        typeIcon: typeConfig.icon,
        typeLabel: typeConfig.label,
        colorClass: typeConfig.colorClass,
        formattedTime,
        isExpired,
      });
    },
  },

  methods: {
    /**
     * 格式化时间
     * Requirements: 6.2
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
      
      // 判断是否是本周
      const dayOfWeek = date.getDay();
      const daysUntil = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil > 0 && daysUntil < 7) {
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${weekDays[dayOfWeek]} ${timeStr}`;
      }
      
      // 其他日期
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日 ${timeStr}`;
    },

    /**
     * 检查是否过期
     * Requirements: 6.8
     */
    checkExpired(dateStr: string): boolean {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date.getTime() < Date.now();
    },

    /**
     * 点击位置卡片 - 打开原生地图导航
     * Requirements: 6.4 (零成本方案)
     */
    onLocationTap() {
      const draft = this.properties.draft as DraftData;
      if (!draft?.location) return;
      
      const [lng, lat] = draft.location;
      
      // 使用微信原生 API 打开地图
      openMapNavigation({
        latitude: lat,
        longitude: lng,
        name: draft.locationName,
        address: draft.address || draft.locationHint,
      });
    },

    /**
     * 点击调整位置 - 使用 wx.chooseLocation
     * Requirements: 6.5 (零成本方案)
     */
    async onAdjustLocation() {
      const draft = this.properties.draft as DraftData;
      if (!draft) return;
      
      try {
        // 使用微信原生选点 API，无需 Key
        const result = await chooseLocation();
        
        // 触发位置更新事件
        this.triggerEvent('locationchange', {
          draft,
          newLocation: {
            latitude: result.latitude,
            longitude: result.longitude,
            locationName: result.name,
            address: result.address,
          },
        });
      } catch (err: any) {
        // 用户取消不提示
        if (!err.message?.includes('取消')) {
          wx.showToast({
            title: err.message || '选择位置失败',
            icon: 'none',
          });
        }
      }
    },

    /**
     * 点击确认发布
     * Requirements: 6.7, 6.8
     */
    onConfirm() {
      const draft = this.properties.draft as DraftData;
      if (!draft) return;
      
      // 检查是否过期
      if (this.data.isExpired) {
        wx.showToast({
          title: '活动时间已过期，请修改时间',
          icon: 'none',
        });
        return;
      }
      
      // 跳转到草稿编辑页，允许用户修改时间和标题后发布
      const params = new URLSearchParams({
        id: draft.activityId || '',
        title: encodeURIComponent(draft.title || ''),
        type: draft.type || 'other',
        startAt: encodeURIComponent(draft.startAt || ''),
        locationName: encodeURIComponent(draft.locationName || ''),
        locationHint: encodeURIComponent(draft.locationHint || ''),
        lat: String(draft.location?.[1] || 0),
        lng: String(draft.location?.[0] || 0),
        maxParticipants: String(draft.maxParticipants || 10),
      });
      
      wx.navigateTo({
        url: `/subpackages/activity/draft-edit/index?${params.toString()}`,
        fail: () => {
          // 如果跳转失败，触发事件让父组件处理
          this.triggerEvent('confirm', { draft });
        },
      });
    },
  },
});
