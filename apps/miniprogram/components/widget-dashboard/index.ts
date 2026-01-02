/**
 * Widget Dashboard 组件
 * Requirements: 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 * v3.4 新增: 7.1, 7.2, 7.3, 7.4, 7.5 - 智能欢迎卡片
 * 
 * 进场欢迎卡片
 * - 动态问候语（根据时间变化）
 * - 快捷操作按钮（上下文感知）
 * - 兜底询问文案
 * - 待参加活动列表（最多 3 个）
 * - 空状态引导文案和热门 Prompt
 */

// 活动类型
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

// 快捷按钮类型 (v3.4 新增)
type QuickActionType = 'explore_nearby' | 'continue_draft' | 'find_partner';

// 探索附近按钮上下文
interface ExploreNearbyContext {
  locationName: string;
  lat: number;
  lng: number;
  activityCount: number;
}

// 继续草稿按钮上下文
interface ContinueDraftContext {
  activityId: string;
  activityTitle: string;
}

// 找搭子按钮上下文
interface FindPartnerContext {
  activityType: string;
  activityTypeLabel: string;
  suggestedPrompt: string;
}

// 快捷按钮 (v3.4 新增)
interface QuickAction {
  type: QuickActionType;
  label: string;
  context: ExploreNearbyContext | ContinueDraftContext | FindPartnerContext;
}

// 热门 Prompt 示例
const HOT_PROMPTS = [
  '今晚观音桥打麻将，3缺1',
  '周末解放碑吃火锅',
  '明天下午踢球，差2人',
  '周六晚上 KTV，有人吗',
];

interface ComponentData {
  greeting: string;
  subGreeting: string;
  fallbackPrompt: string;
  quickActions: QuickAction[];
  displayActivities: Activity[];
  hotPrompts: string[];
  hasActivities: boolean;
  hasQuickActions: boolean;
}

interface ComponentProperties {
  nickname: WechatMiniprogram.Component.PropertyOption;
  activities: WechatMiniprogram.Component.PropertyOption;
  greeting: WechatMiniprogram.Component.PropertyOption;
  quickActions: WechatMiniprogram.Component.PropertyOption;
  fallbackPrompt: WechatMiniprogram.Component.PropertyOption;
}

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
      value: [] as Activity[],
    },
    // v3.4 新增：API 返回的问候语（优先使用）
    greeting: {
      type: String,
      value: '',
    },
    // v3.4 新增：快捷操作按钮数组
    quickActions: {
      type: Array,
      value: [] as QuickAction[],
    },
    // v3.4 新增：兜底询问文案
    fallbackPrompt: {
      type: String,
      value: '或者还有什么想法，今天想玩点什么，告诉我！～',
    },
  },

  data: {
    greeting: '',
    subGreeting: '',
    fallbackPrompt: '或者还有什么想法，今天想玩点什么，告诉我！～',
    quickActions: [] as QuickAction[],
    displayActivities: [] as Activity[],
    hotPrompts: HOT_PROMPTS,
    hasActivities: false,
    hasQuickActions: false,
  } as ComponentData,

  observers: {
    'activities': function(activities: Activity[]) {
      // 最多显示 3 个活动
      const displayActivities = (activities || []).slice(0, 3);
      this.setData({
        displayActivities,
        hasActivities: displayActivities.length > 0,
      });
    },
    'nickname, greeting': function() {
      this.updateGreeting();
    },
    'quickActions': function(quickActions: QuickAction[]) {
      this.setData({
        quickActions: quickActions || [],
        hasQuickActions: (quickActions || []).length > 0,
      });
    },
    'fallbackPrompt': function(fallbackPrompt: string) {
      if (fallbackPrompt) {
        this.setData({ fallbackPrompt });
      }
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
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1-5.4
     * v3.4 优化：优先使用 API 返回的问候语，强调 AI 执行力，引导用户输入
     */
    updateGreeting() {
      // v3.4: 如果 API 返回了问候语，优先使用
      const apiGreeting = this.properties.greeting as string;
      if (apiGreeting) {
        this.setData({ 
          greeting: apiGreeting,
          subGreeting: '', // API 模式下不显示 subGreeting
        });
        return;
      }

      // 降级：本地生成问候语
      const hour = new Date().getHours();
      const day = new Date().getDay();
      const nickname = this.properties.nickname || '搭子';
      
      let greeting = '';
      let subGreeting = '';
      
      // 深夜问候 (0:00-6:00)
      if (hour >= 0 && hour < 6) {
        greeting = '这么晚还没睡？';
        subGreeting = '想约宵夜还是想找人聊天？跟小聚说说。';
      }
      // 周五晚上特殊问候
      // Requirements: 4.4
      else if (day === 5 && hour >= 18) {
        greeting = `Hi，我是小聚`;
        subGreeting = '周末到了，想怎么玩？跟我说说，我来安排。';
      }
      // 周末特殊问候
      // Requirements: 4.5
      else if (day === 0 || day === 6) {
        greeting = `周末愉快，${nickname}！`;
        subGreeting = '想怎么玩？跟小聚说说，我来安排。';
      }
      // 早上问候 (6:00-12:00)
      // Requirements: 4.1
      else if (hour >= 6 && hour < 12) {
        greeting = `早上好，${nickname}！`;
        subGreeting = '新的一天，有什么计划？跟小聚说说。';
      }
      // 下午问候 (12:00-18:00)
      // Requirements: 4.2
      else if (hour >= 12 && hour < 18) {
        greeting = `下午好，${nickname}！`;
        subGreeting = '下午茶时间，想约个局？跟我说说。';
      }
      // 晚上问候 (18:00-24:00)
      // Requirements: 4.3
      else {
        greeting = `晚上好${nickname}。`;
        subGreeting = '今晚有什么安排？直接告诉我，我帮你发群里。';
      }
      
      this.setData({ greeting, subGreeting });
    },

    /**
     * 点击活动卡片
     * Requirements: 4.8
     */
    onActivityTap(e: WechatMiniprogram.TouchEvent) {
      const { id } = e.currentTarget.dataset;
      if (!id) return;
      
      this.triggerEvent('activitytap', { id });
      
      // 跳转到活动详情页
      wx.navigateTo({
        url: `/subpackages/activity/detail/index?id=${id}`,
      });
    },

    /**
     * 点击快捷操作按钮
     * Requirements: 7.4
     * - explore_nearby → 触发 AI 搜索或跳转探索页
     * - continue_draft → 跳转活动确认页
     * - find_partner → 预填输入框并聚焦
     */
    onQuickActionTap(e: WechatMiniprogram.TouchEvent) {
      const action = e.currentTarget.dataset.action as QuickAction;
      if (!action) return;

      // 触发事件，让父组件处理
      this.triggerEvent('quickactiontap', { action });

      // 根据类型执行不同操作
      switch (action.type) {
        case 'explore_nearby': {
          // 探索附近 → 触发 AI 搜索或跳转探索页
          const context = action.context as ExploreNearbyContext;
          // 触发 AI 搜索，让父组件处理
          this.triggerEvent('explorenearby', { 
            locationName: context.locationName,
            lat: context.lat,
            lng: context.lng,
            activityCount: context.activityCount,
          });
          break;
        }
        case 'continue_draft': {
          // 继续草稿 → 跳转活动确认页
          const context = action.context as ContinueDraftContext;
          wx.navigateTo({
            url: `/subpackages/activity/confirm/index?activityId=${context.activityId}`,
          });
          break;
        }
        case 'find_partner': {
          // 找搭子 → 预填输入框并聚焦
          const context = action.context as FindPartnerContext;
          this.triggerEvent('findpartner', { 
            activityType: context.activityType,
            activityTypeLabel: context.activityTypeLabel,
            suggestedPrompt: context.suggestedPrompt,
          });
          break;
        }
      }
    },

    /**
     * 点击热门 Prompt
     * Requirements: 3.5
     */
    onPromptTap(e: WechatMiniprogram.TouchEvent) {
      const { prompt } = e.currentTarget.dataset;
      if (!prompt) return;
      
      this.triggerEvent('prompttap', { prompt });
    },

    /**
     * 点击查看全部活动
     */
    onViewAllTap() {
      this.triggerEvent('viewall');
      
      wx.navigateTo({
        url: '/subpackages/activity/list/index?type=joined',
      });
    },
  },
});
