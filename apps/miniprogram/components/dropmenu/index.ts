/**
 * 下拉菜单组件
 * Requirements: 2.5, 2.6, 2.7, 2.8
 * 
 * 从右上角 More 图标触发的下拉菜单
 * - [消息中心] 入口
 * - [新对话] 入口
 * - 点击外部自动关闭
 */

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  iconColor: 'blue' | 'purple' | 'mint' | 'amber';
}

interface ComponentData {
  items: MenuItem[];
}

interface ComponentProperties {
  visible: WechatMiniprogram.Component.PropertyOption;
  top: WechatMiniprogram.Component.PropertyOption;
  right: WechatMiniprogram.Component.PropertyOption;
}

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 是否显示
    visible: {
      type: Boolean,
      value: false,
    },
    // 距离顶部距离 (px)
    top: {
      type: Number,
      value: 88,
    },
    // 距离右侧距离 (px)
    right: {
      type: Number,
      value: 108,
    },
  },

  data: {
    items: [
      {
        key: 'message',
        label: '消息中心',
        icon: 'chat',
        iconColor: 'blue',
      },
      {
        key: 'newchat',
        label: '新对话',
        icon: 'add',
        iconColor: 'purple',
      },
    ] as MenuItem[],
  },

  methods: {
    /**
     * 点击菜单项
     * Requirements: 2.6, 2.7, 2.8
     */
    onItemTap(e: WechatMiniprogram.TouchEvent) {
      const { key } = e.currentTarget.dataset;
      
      // 触感反馈
      wx.vibrateShort({ type: 'light' });
      
      // 关闭菜单
      this.close();
      
      if (key === 'message') {
        // Requirements: 2.7 - 跳转消息中心
        wx.navigateTo({
          url: '/pages/message/index',
        });
      } else if (key === 'newchat') {
        // Requirements: 2.8 - 新对话
        this.triggerEvent('newchat');
      }
      
      this.triggerEvent('itemtap', { key });
    },

    /**
     * 点击遮罩层关闭
     */
    onOverlayTap() {
      this.close();
    },

    /**
     * 关闭菜单
     */
    close() {
      this.triggerEvent('close');
    },
  },
});
