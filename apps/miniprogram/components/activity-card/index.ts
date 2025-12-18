/**
 * 活动卡片组件
 * Requirements: 2.5, 2.6 - 点击Pin显示活动简要信息，点击卡片跳转详情页
 */
import { getActivitiesById } from '../../src/api/index';

interface Activity {
  id: string;
  title?: string;
  latitude?: number;
  longitude?: number;
  isBoosted?: boolean;
  isPinPlus?: boolean;
  locationHint?: string;
  activityType?: string;
  startAt?: string;
  feeType?: string;
  status?: string;
}

interface ActivityDetail {
  id: string;
  title: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  locationName?: string;
  address?: string;
  locationHint?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  feeType?: string;
  estimatedCost?: number;
  type?: string;
  creator?: {
    id: string;
    nickname?: string;
    avatarUrl?: string;
    participationCount?: number;
    fulfillmentCount?: number;
  };
}

interface ComponentData {
  activityDetail: ActivityDetail | null;
  loading: boolean;
  error: boolean;
}

interface ComponentProperties {
  activity: Activity | null;
  mode: string;
  showDistance: boolean;
}

const FEE_TYPE_MAP: Record<string, string> = {
  free: '免费',
  aa: 'AA制',
  fixed: '固定费用',
  treat: '请客',
};

const ACTIVITY_TYPE_MAP: Record<string, string> = {
  food: '美食',
  entertainment: '娱乐',
  sports: '运动',
  study: '学习',
  travel: '旅行',
  other: '其他',
};

Component<ComponentData, ComponentProperties, WechatMiniprogram.Component.MethodOption>({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    activity: {
      type: Object,
      value: null,
    },
    mode: {
      type: String,
      value: 'popup',
    },
    showDistance: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    activityDetail: null,
    loading: false,
    error: false,
  },

  observers: {
    'activity.id': function (activityId: string) {
      if (activityId && this.properties.mode === 'popup') {
        this.loadActivityDetail(activityId);
      }
    },
  },

  lifetimes: {
    attached() {
      const { activity, mode } = this.properties;
      if (activity?.id && mode === 'popup') {
        this.loadActivityDetail(activity.id);
      }
    },
  },

  methods: {
    async loadActivityDetail(activityId: string) {
      if (!activityId) return;

      this.setData({ loading: true, error: false });

      try {
        const response = await getActivitiesById(activityId);

        if (response.status === 200) {
          this.setData({
            activityDetail: response.data as ActivityDetail,
            loading: false,
          });
        } else {
          throw new Error('获取活动详情失败');
        }
      } catch (error) {
        console.error('加载活动详情失败', error);
        this.setData({
          loading: false,
          error: true,
        });
      }
    },

    onCardTap() {
      this.triggerEvent('tap', {
        activity: this.properties.activity,
        activityDetail: this.data.activityDetail,
      });
    },

    onCreatorTap(e: WechatMiniprogram.TouchEvent) {
      e.stopPropagation();
      const { activityDetail } = this.data;
      if (activityDetail?.creator) {
        this.triggerEvent('creatortap', {
          creator: activityDetail.creator,
        });
      }
    },

    formatTime(dateStr: string): string {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = date.toDateString() === tomorrow.toDateString();

      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      if (isToday) return `今天 ${timeStr}`;
      if (isTomorrow) return `明天 ${timeStr}`;

      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日 ${timeStr}`;
    },

    calculateReliability(creator: ActivityDetail['creator']): number {
      if (!creator || !creator.participationCount) return -1;
      return Math.round(((creator.fulfillmentCount || 0) / creator.participationCount) * 100);
    },

    getReliabilityLabel(rate: number): string {
      if (rate === -1) return '🆕 新用户';
      if (rate === 100) return '⭐⭐⭐ 非常靠谱';
      if (rate >= 80) return '⭐⭐ 靠谱';
      if (rate >= 60) return '⭐ 一般';
      return '待提升';
    },

    getFeeTypeText(feeType: string): string {
      return FEE_TYPE_MAP[feeType] || feeType;
    },

    getActivityTypeText(type: string): string {
      return ACTIVITY_TYPE_MAP[type] || type;
    },
  },
});
