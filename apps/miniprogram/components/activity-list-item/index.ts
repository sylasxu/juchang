/**
 * Activity List Item 组件
 * Requirements: 17.5, 18.6
 * 
 * 活动列表项
 * - 显示活动标题、类型图标、距离、时间、地点
 * - 用于 Widget_Explore 和沉浸式地图页
 */

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

// 活动数据类型
interface Activity {
  id: string;
  title: string;
  type: string;
  startAt: string;
  locationName?: string;
  locationHint?: string;
  distance?: number; // 米
  currentParticipants?: number;
  maxParticipants?: number;
}

interface ComponentData {
  typeIcon: string;
  typeLabel: string;
  colorClass: string;
  formattedTime: string;
  formattedDistance: string;
  locationText: string;
}

interface ComponentProperties {
  activity: WechatMiniprogram.Component.PropertyOption;
  showDistance: WechatMiniprogram.Component.PropertyOption;
}

Component<ComponentData, ComponentProperties>({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 活动数据
    activity: {
      type: Object,
      value: null as Activity | null,
    },
    // 是否显示距离
    showDistance: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    typeIcon: 'ellipsis',
    typeLabel: '活动',
    colorClass: 'blue',
    formattedTime: '',
    formattedDistance: '',
    locationText: '',
  },

  observers: {
    'activity': function(activity: Activity) {
      if (!activity) return;
      
      // 更新类型信息
      const typeConfig = TYPE_CONFIG[activity.type] || TYPE_CONFIG.other;
      
      // 格式化时间
      const formattedTime = this.formatTime(activity.startAt);
      
      // 格式化距离
      const formattedDistance = this.formatDistance(activity.distance);
      
      // 格式化地点
      const locationText = activity.locationName || activity.locationHint || '位置待定';
      
      this.setData({
        typeIcon: typeConfig.icon,
        typeLabel: typeConfig.label,
        colorClass: typeConfig.colorClass,
        formattedTime,
        formattedDistance,
        locationText,
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
     * 格式化距离
     * Requirements: 17.5
     */
    formatDistance(distance?: number): string {
      if (!distance && distance !== 0) return '';
      
      if (distance < 1000) {
        return `${Math.round(distance)}m`;
      }
      
      return `${(distance / 1000).toFixed(1)}km`;
    },

    /**
     * 点击列表项
     */
    onTap() {
      const activity = this.properties.activity as Activity;
      if (!activity) return;
      
      this.triggerEvent('tap', { activity });
    },
  },
});
