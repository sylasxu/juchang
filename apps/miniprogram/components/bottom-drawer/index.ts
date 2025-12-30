/**
 * 底部抽屉组件
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

interface ComponentData {
  expanded: boolean;
  currentHeight: number;
  minHeightPx: number;
  maxHeightPx: number;
  startY: number;
  startHeight: number;
  isDragging: boolean;
  tabBarHeight: number;
  isAnimating: boolean;
}

interface ComponentProperties {
  minHeight: number;
  maxHeightPercent: number;
  filterCount: number;
  activityCount: number;
  loading: boolean;
}

Component({
  options: {
    addGlobalClass: true,
    multipleSlots: true,
  },

  properties: {
    minHeight: {
      type: Number,
      value: 200,
    },
    maxHeightPercent: {
      type: Number,
      value: 70,
    },
    filterCount: {
      type: Number,
      value: 0,
    },
    activityCount: {
      type: Number,
      value: 0,
    },
    loading: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    expanded: false,
    currentHeight: 0,
    minHeightPx: 0,
    maxHeightPx: 0,
    startY: 0,
    startHeight: 0,
    isDragging: false,
    tabBarHeight: 0,
    isAnimating: false,
  } as ComponentData,

  lifetimes: {
    attached() {
      this.initHeights();
    },
  },

  methods: {
    initHeights() {
      const systemInfo = wx.getSystemInfoSync();
      const screenHeight = systemInfo.windowHeight;
      const rpxRatio = systemInfo.windowWidth / 750;

      const tabBarHeight = 112 * rpxRatio;
      const minHeightPx = this.properties.minHeight * rpxRatio;
      const maxHeightPx = screenHeight * (this.properties.maxHeightPercent / 100);

      this.setData({
        minHeightPx,
        maxHeightPx,
        currentHeight: minHeightPx,
        tabBarHeight,
      });
    },

    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      if (this.data.isAnimating) return;

      this.setData({
        startY: e.touches[0].clientY,
        startHeight: this.data.currentHeight,
        isDragging: true,
      });
    },

    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      if (!this.data.isDragging || this.data.isAnimating) return;

      const currentY = e.touches[0].clientY;
      const deltaY = this.data.startY - currentY;
      let newHeight = this.data.startHeight + deltaY;

      newHeight = Math.max(this.data.minHeightPx, Math.min(this.data.maxHeightPx, newHeight));

      this.setData({ currentHeight: newHeight });
    },

    onTouchEnd() {
      if (!this.data.isDragging) return;

      const { currentHeight, minHeightPx, maxHeightPx } = this.data;
      const midPoint = (minHeightPx + maxHeightPx) / 2;

      this.setData({ isDragging: false, isAnimating: true });

      if (currentHeight > midPoint) {
        this.expand();
      } else {
        this.collapse();
      }

      setTimeout(() => {
        this.setData({ isAnimating: false });
      }, 300);
    },

    expand() {
      this.setData({
        expanded: true,
        currentHeight: this.data.maxHeightPx,
      });
      this.triggerEvent('expand');
    },

    collapse() {
      this.setData({
        expanded: false,
        currentHeight: this.data.minHeightPx,
      });
      this.triggerEvent('collapse');
    },

    toggle() {
      if (this.data.isAnimating) return;

      this.setData({ isAnimating: true });

      if (this.data.expanded) {
        this.collapse();
      } else {
        this.expand();
      }

      setTimeout(() => {
        this.setData({ isAnimating: false });
      }, 300);
    },

    onHandleTap() {
      this.toggle();
    },

    onFilterTap() {
      this.triggerEvent('filtertap');
    },

    onCreateTap() {
      this.triggerEvent('createtap');
    },

    preventTouchMove(): boolean {
      return false;
    },
  },
});
