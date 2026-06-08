/**
 * Widget Dashboard 组件
 * Requirements: 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 7.0
 * v4.4 重构: 增加快捷入口
 * 
 * 进场欢迎卡片
 * - 动态问候语（API 返回）
 * - 快捷入口（预设 Prompt）
 * - 分组快捷操作（draft/suggestions/explore）
 * - 待参加活动列表（最多 3 个）
 */

import type {
  QuickItem,
  QuickPrompt,
  WelcomePendingActivity,
  WelcomeResponse,
  WelcomeSection,
} from '../../src/services/welcome';

type Activity = WelcomePendingActivity;
type WelcomeUi = WelcomeResponse['ui'];

interface RecommendationActivity {
  id: string;
  title: string;
  type: string;
  startAt: string;
  locationName: string;
  locationHint: string;
  currentParticipants: number;
  maxParticipants: number;
  imageUrl?: string;
  distance?: number;
  creatorNickname?: string;
}

interface WidgetDashboardData {
  displayGreeting: string;
  displaySubGreeting: string;
  displaySections: WelcomeSection[];
  displayActivities: Activity[];
  hasActivities: boolean;
  hasSections: boolean;
  displayQuickPrompts: QuickPrompt[];
  hasQuickPrompts: boolean;
  displayUi: WelcomeUi | null;
  displayRecommendations: RecommendationActivity[];
  hasRecommendations: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readQuickPrompt(value: unknown): QuickPrompt | null {
  if (!isRecord(value)) {
    return null;
  }

  const icon = readString(value.icon);
  const text = readString(value.text);
  const prompt = readString(value.prompt);

  if (!icon || !text || !prompt) {
    return null;
  }

  return { icon, text, prompt };
}

function readQuickPrompts(value: unknown): QuickPrompt[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => readQuickPrompt(item))
    .filter((item): item is QuickPrompt => item !== null);
}

function readQuickItem(value: unknown): QuickItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const label = readString(value.label);
  const prompt = readString(value.prompt);
  const icon = readString(value.icon) ?? undefined;
  const context = value.context;

  switch (value.type) {
    case 'draft':
    case 'suggestion':
    case 'explore':
      if (!label || !prompt) {
        return null;
      }
      return {
        type: value.type,
        icon,
        label,
        prompt,
        context,
      };
    default:
      return null;
  }
}

function readActivityIdFromContext(context: unknown): string | null {
  if (!isRecord(context)) {
    return null;
  }

  return readString(context.activityId);
}

function readWelcomeUi(value: unknown): WelcomeUi | null {
  if (!isRecord(value)) {
    return null;
  }

  const composerPlaceholder = readString(value.composerPlaceholder);
  const bottomQuickActions = Array.isArray(value.bottomQuickActions)
    ? value.bottomQuickActions.filter((item): item is string => typeof item === 'string')
    : [];

  if (!composerPlaceholder) {
    return null;
  }

  return {
    composerPlaceholder,
    bottomQuickActions,
  };
}

function readRecommendations(value: unknown): RecommendationActivity[] {
  if (!isRecord(value) || !Array.isArray(value.activities)) {
    return [];
  }

  return value.activities
    .map((item: unknown) => {
      if (!isRecord(item)) return null;

      const id = readString(item.id);
      const title = readString(item.title);
      const type = readString(item.type);
      const startAt = readString(item.startAt);
      const locationName = readString(item.locationName);
      const locationHint = readString(item.locationHint);

      if (!id || !title || !type || !startAt || !locationName || !locationHint) {
        return null;
      }

      const currentParticipants = typeof item.currentParticipants === 'number' ? item.currentParticipants : 0;
      const maxParticipants = typeof item.maxParticipants === 'number' ? item.maxParticipants : 0;
      const distance = typeof item.distance === 'number' ? item.distance : undefined;
      const imageUrl = readString(item.imageUrl) ?? undefined;
      const creatorNickname = readString(item.creatorNickname) ?? undefined;

      return {
        id,
        title,
        type,
        startAt,
        locationName,
        locationHint,
        currentParticipants,
        maxParticipants,
        ...(distance !== undefined ? { distance } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        ...(creatorNickname ? { creatorNickname } : {}),
      };
    })
    .filter((item): item is RecommendationActivity => item !== null);
}

const WIDGET_DASHBOARD_DATA: WidgetDashboardData = {
  displayGreeting: '',
  displaySubGreeting: '',
  displaySections: [],
  displayActivities: [],
  hasActivities: false,
  hasSections: false,
  displayQuickPrompts: [],
  hasQuickPrompts: false,
  displayUi: null,
  displayRecommendations: [],
  hasRecommendations: false,
};

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 用户昵称
    nickname: {
      type: String,
      value: '搭子',
    },
    // 待参加活动列表
    activities: {
      type: Array,
      value: [],
    },
    // v3.10: API 返回的问候语
    greeting: {
      type: String,
      value: '',
    },
    // v3.10: API 返回的副标题
    subGreeting: {
      type: String,
      value: '',
    },
    // v3.10: 分组列表
    sections: {
      type: Array,
      value: [],
    },
    // v4.4: 快捷入口
    quickPrompts: {
      type: Array,
      value: [],
    },
    // v5.4: 推荐活动
    recommendations: {
      type: Array,
      value: [],
    },
    ui: {
      type: Object,
      value: {},
    },
  },

  data: {
    ...WIDGET_DASHBOARD_DATA,
  },

  observers: {
    'activities': function(activities: Activity[]) {
      // 最多显示 3 个活动
      const displayActivities = (activities || []).slice(0, 3);
      this.setData({
        displayActivities,
        hasActivities: displayActivities.length > 0,
      });
    },
    'greeting, subGreeting': function() {
      this.updateGreeting();
    },
    'sections': function(sections: WelcomeSection[]) {
      const resolvedSections = Array.isArray(sections) ? sections : [];
      this.setData({
        displaySections: resolvedSections,
        hasSections: resolvedSections.length > 0,
      });
    },
    'quickPrompts': function(prompts: unknown) {
      const resolvedPrompts = readQuickPrompts(prompts);
      this.setData({
        displayQuickPrompts: resolvedPrompts,
        hasQuickPrompts: resolvedPrompts.length > 0,
      });
    },
    'recommendations': function(recommendations: unknown) {
      const recs = readRecommendations(recommendations);
      this.setData({
        displayRecommendations: recs,
        hasRecommendations: recs.length > 0,
      });
    },
    'ui': function(ui: unknown) {
      this.setData({
        displayUi: readWelcomeUi(ui),
      });
    },
  },

  lifetimes: {
    attached() {
      this.updateGreeting();
    },
  },

  methods: {
    /**
     * 更新问候语
     * v3.10: 使用 welcome API 返回的问候语字段
     */
    updateGreeting() {
      const apiGreeting = readString(this.properties.greeting);
      const apiSubGreeting = readString(this.properties.subGreeting);
      this.setData({
        displayGreeting: apiGreeting || '你好～',
        displaySubGreeting: apiSubGreeting || '',
      });
    },

    /**
     * 点击活动卡片
     */
    onActivityTap(e: WechatMiniprogram.TouchEvent) {
      const { id } = e.currentTarget.dataset;
      if (!id) return;
      
      this.triggerEvent('activitytap', { id });
    },

    /**
     * 点击快捷项
     * v3.10: 统一处理所有类型的快捷项
     */
    onQuickItemTap(e: WechatMiniprogram.TouchEvent) {
      const item = readQuickItem(e.currentTarget.dataset.item);
      if (!item) return;

      this.triggerEvent('quickitemtap', { item });
    },

    /**
     * v5.4: 点击推荐活动卡片
     */
    onRecommendationTap(e: WechatMiniprogram.TouchEvent) {
      const { id } = e.currentTarget.dataset;
      if (!id) return;
      this.triggerEvent('recommendationtap', { id });
    },

    /**
     * 点击查看全部活动
     */
    onViewAllTap() {
      this.triggerEvent('viewall');
    },

    /**
     * v4.4: 快捷入口点击
     */
    onQuickPromptTap(e: WechatMiniprogram.CustomEvent<{ prompt: string; text: string }>) {
      this.triggerEvent('prompttap', { prompt: e.detail.prompt });
    },
  },
});
