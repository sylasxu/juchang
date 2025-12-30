/**
 * Activity Mini Card 组件
 * Requirements: 4.7, 4.8, 15.6
 * 
 * 活动迷你卡片
 * - 显示活动标题、类型图标、开始时间、地点
 * - 使用同色系淡色图标底色
 */

import { ACTIVITY_TYPE_CONFIG } from '../../src/constants/activity-types';

interface Activity {
  id: string;
  title: string;
  type: string;
  startAt: string;
  locationName?: string;
  locationHint?: string;
  currentParticipants?: number;
  maxParticipants?: number;
}

interface ComponentData {
  typeIcon: string;
  typeLabel: string;
  colorClass: string;
  formattedTime: string;
  locationText: string;
  participantsText: string;
}

interface ComponentProperties {
  activity: WechatMiniprogram.Component.PropertyOption;
  showParticipants: WechatMiniprogram.Component.PropertyOption;
}

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 活动数据
    activity: {
      type: Object,
      value: {} as Activity,
    },
    // 是否显示参与人数
    showParticipants: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    typeIcon: 'ellipsis',
    typeLabel: '活动',
    colorClass: 'blue',
    formattedTime: '',
    locationText: '',
    participantsText: '',
  } as ComponentData,

  observers: {
    'activity': function(activity: Activity) {
      if (!activity) return;
      
      // 更新类型信息
      const typeConfig = ACTIVITY_TYPE_CONFIG[activity.type] || ACTIVITY_TYPE_CONFIG.other;
      
      // 格式化时间
      const formattedTime = this.formatTime(activity.startAt);
      
      // 格式化地点
      const locationText = activity.locationName || activity.locationHint || '位置待定';
      
      // 格式化参与人数
      const participantsText = activity.maxParticipants 
        ? `${activity.currentParticipants || 0}/${activity.maxParticipants}人`
        : '';
      
      this.setData({
        typeIcon: typeConfig.icon,
        typeLabel: typeConfig.label,
        colorClass: typeConfig.colorClass,
        formattedTime,
        locationText,
        participantsText,
      });
    },
  },

  methods: {
    /**
     * 格式化时间
     * Requirements: 4.7
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
     * 点击卡片
     * Requirements: 4.8
     */
    onTap() {
      const activity = this.properties.activity as Activity;
      if (!activity) return;
      
      this.triggerEvent('tap', { activity });
    },
  },
});
