/**
 * Widget Dashboard 组件
 * Requirements: 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 * v3.10 重构: 分组结构 (sections)
 * 
 * 进场欢迎卡片
 * - 动态问候语（API 返回）
 * - 分组快捷操作（draft/suggestions/explore）
 * - 待参加活动列表（最多 3 个）
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

// 快捷项类型 (v3.10)
type QuickItemType = 'draft' | 'suggestion' | 'explore';

// 快捷项
interface QuickItem {
  type: QuickItemType;
  icon?: string;
  label: string;
  prompt: string;
  context?: Record<string, unknown>;
}

// 分组
interface WelcomeSection {
  id: string;
  icon: string;
  title: string;
  items: QuickItem[];
}

interface ComponentData {
  greeting: string;
  subGreeting: string;
  sections: WelcomeSection[];
  displayActivities: Activity[];
  hasActivities: boolean;
  hasSections: boolean;
}

interface ComponentProperties {
  nickname: WechatMiniprogram.Component.PropertyOption;
  activities: WechatMiniprogram.Component.PropertyOption;
  greeting: WechatMiniprogram.Component.PropertyOption;
  subGreeting: WechatMiniprogram.Component.PropertyOption;
  sections: WechatMiniprogram.Component.PropertyOption;
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
      value: [] as WelcomeSection[],
    },
  },

  data: {
    greeting: '',
    subGreeting: '',
    sections: [] as WelcomeSection[],
    displayActivities: [] as Activity[],
    hasActivities: false,
    hasSections: false,
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
    'greeting, subGreeting': function() {
      this.updateGreeting();
    },
    'sections': function(sections: WelcomeSection[]) {
      this.setData({
        sections: sections || [],
        hasSections: (sections || []).length > 0,
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
     * v3.10: 优先使用 API 返回的问候语
     */
    updateGreeting() {
      const apiGreeting = this.properties.greeting as string;
      const apiSubGreeting = this.properties.subGreeting as string;
      
      if (apiGreeting) {
        this.setData({ 
          greeting: apiGreeting,
          subGreeting: apiSubGreeting || '',
        });
        return;
      }

      // 降级：本地生成问候语
      const hour = new Date().getHours();
      const nickname = this.properties.nickname || '搭子';
      
      let greeting = '';
      let subGreeting = '想玩点什么？';
      
      if (hour >= 0 && hour < 6) {
        greeting = '这么晚还没睡？';
      } else if (hour >= 6 && hour < 12) {
        greeting = `早上好，${nickname}！`;
      } else if (hour >= 12 && hour < 18) {
        greeting = `下午好，${nickname}！`;
      } else {
        greeting = `晚上好，${nickname}`;
      }
      
      this.setData({ greeting, subGreeting });
    },

    /**
     * 点击活动卡片
     */
    onActivityTap(e: WechatMiniprogram.TouchEvent) {
      const { id } = e.currentTarget.dataset;
      if (!id) return;
      
      this.triggerEvent('activitytap', { id });
      wx.navigateTo({
        url: `/subpackages/activity/detail/index?id=${id}`,
      });
    },

    /**
     * 点击快捷项
     * v3.10: 统一处理所有类型的快捷项
     */
    onQuickItemTap(e: WechatMiniprogram.TouchEvent) {
      const item = e.currentTarget.dataset.item as QuickItem;
      if (!item) return;

      // 触发通用事件
      this.triggerEvent('quickitemtap', { item });

      // 根据类型执行不同操作
      switch (item.type) {
        case 'draft': {
          // 继续草稿 → 发送 prompt 或跳转
          const activityId = item.context?.activityId as string;
          if (activityId) {
            wx.navigateTo({
              url: `/subpackages/activity/confirm/index?activityId=${activityId}`,
            });
          } else {
            this.triggerEvent('prompttap', { prompt: item.prompt });
          }
          break;
        }
        case 'suggestion': {
          // 快速组局建议 → 发送 prompt
          this.triggerEvent('prompttap', { prompt: item.prompt });
          break;
        }
        case 'explore': {
          // 探索附近 → 发送 prompt
          this.triggerEvent('prompttap', { prompt: item.prompt });
          break;
        }
      }
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
