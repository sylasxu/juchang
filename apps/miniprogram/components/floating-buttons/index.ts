/**
 * 浮动按钮组件
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

interface ComponentData {
  navBarHeight: number;
}

interface ComponentProperties {
  showSafety: boolean;
  showLocation: boolean;
}

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {
    showSafety: {
      type: Boolean,
      value: true,
    },
    showLocation: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    navBarHeight: 0,
  },

  lifetimes: {
    attached() {
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      const navBarHeight = menuButtonInfo.bottom + 10;
      this.setData({ navBarHeight });
    },
  },

  methods: {
    onLocationTap() {
      this.triggerEvent('locationtap');
    },

    onSafetyTap() {
      this.triggerEvent('safetytap');
    },
  },
});
