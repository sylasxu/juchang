/**
 * 自定义TabBar组件
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

interface TabItem {
  icon: string;
  value: string;
  label: string;
}

interface ComponentData {
  value: string;
  unreadNum: number;
  list: TabItem[];
}

interface AppInstance {
  globalData?: {
    unreadNum?: number;
  };
  eventBus?: {
    on: (event: string, callback: (data: number) => void) => void;
    off: (event: string, callback: (data: number) => void) => void;
  };
}

const app = getApp<AppInstance>();

Component<ComponentData, WechatMiniprogram.Component.PropertyOption, WechatMiniprogram.Component.MethodOption>({
  data: {
    value: '',
    unreadNum: 0,
    list: [
      {
        icon: 'home',
        value: 'home',
        label: '首页',
      },
      {
        icon: 'chat',
        value: 'message',
        label: '消息',
      },
      {
        icon: 'user',
        value: 'my',
        label: '我的',
      },
    ],
  },

  lifetimes: {
    ready() {
      const pages = getCurrentPages();
      const curPage = pages[pages.length - 1];
      if (curPage) {
        const nameRe = /pages\/(\w+)\/index/.exec(curPage.route || '');
        if (nameRe?.[1]) {
          this.setData({ value: nameRe[1] });
        }
      }

      // 初始化未读消息数 - Requirements: 1.4
      if (app.globalData?.unreadNum !== undefined) {
        this.setUnreadNum(app.globalData.unreadNum);
      }

      // 监听未读消息变化
      if (app.eventBus) {
        app.eventBus.on('unread-num-change', (unreadNum: number) => {
          this.setUnreadNum(unreadNum);
        });
      }
    },
  },

  methods: {
    handleChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const { value } = e.detail;
      wx.switchTab({ url: `/pages/${value}/index` });
    },

    setUnreadNum(unreadNum: number) {
      this.setData({ unreadNum });
    },
  },
});
