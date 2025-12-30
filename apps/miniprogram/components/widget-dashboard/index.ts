/**
 * Widget Dashboard 组件
 * Requirements: 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 * 
 * 进场欢迎卡片
 * - 动态问候语（根据时间变化）
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
  displayActivities: Activity[];
  hotPrompts: string[];
  hasActivities: boolean;
}

interface ComponentProperties {
  nickname: WechatMiniprogram.Component.PropertyOption;
  activities: WechatMiniprogram.Component.PropertyOption;
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
  },

  data: {
    greeting: '',
    subGreeting: '',
    displayActivities: [] as Activity[],
    hotPrompts: HOT_PROMPTS,
    hasActivities: false,
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
    'nickname': function() {
      this.updateGreeting();
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
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
     */
    updateGreeting() {
      const hour = new Date().getHours();
      const day = new Date().getDay();
      const nickname = this.properties.nickname || '搭子';
      
      let greeting = '';
      let subGreeting = '';
      
      // 周五晚上特殊问候
      // Requirements: 4.4
      if (day === 5 && hour >= 18) {
        greeting = `Hi ${nickname}`;
        subGreeting = '周五晚上了，不组个局吗？';
      }
      // 周末特殊问候
      // Requirements: 4.5
      else if (day === 0 || day === 6) {
        greeting = `周末愉快，${nickname}`;
        subGreeting = '今天想玩什么？';
      }
      // 早上问候
      // Requirements: 4.1
      else if (hour >= 6 && hour < 12) {
        greeting = `早上好，${nickname}`;
        subGreeting = '新的一天，有什么计划？';
      }
      // 下午问候
      // Requirements: 4.2
      else if (hour >= 12 && hour < 18) {
        greeting = `下午好，${nickname}`;
        subGreeting = '下午茶时间，约个局？';
      }
      // 晚上问候
      // Requirements: 4.3
      else {
        greeting = `晚上好，${nickname}`;
        subGreeting = '今晚有什么安排？';
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
