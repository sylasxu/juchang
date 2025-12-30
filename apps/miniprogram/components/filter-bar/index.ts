/**
 * Filter Bar 组件
 * Requirements: 18.3
 * 
 * 横向滚动筛选栏
 * - 筛选项：全部、美食、运动、桌游、娱乐
 */

import { FILTER_BAR_OPTIONS, FilterBarOption } from '../../src/constants/filter-options';

interface ComponentData {
  filters: FilterBarOption[];
}

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 当前选中的筛选项
    value: {
      type: String,
      value: 'all',
    },
    // 自定义筛选项（可选）
    options: {
      type: Array,
      value: [] as FilterBarOption[],
    },
  },

  data: {
    filters: FILTER_BAR_OPTIONS,
  } as ComponentData,

  observers: {
    'options': function(options: FilterBarOption[] | null) {
      // 如果传入了自定义选项，使用自定义选项
      if (options && options.length > 0) {
        this.setData({ filters: options });
      } else {
        this.setData({ filters: FILTER_BAR_OPTIONS });
      }
    },
  },

  methods: {
    /**
     * 点击筛选项
     * Requirements: 18.3
     */
    onFilterTap(e: WechatMiniprogram.TouchEvent) {
      const { key } = e.currentTarget.dataset;
      if (!key) return;
      
      // 如果点击的是当前选中项，不触发事件
      if (key === this.properties.value) return;
      
      // 触发变更事件
      this.triggerEvent('change', { value: key });
      
      // 触感反馈
      wx.vibrateShort({ type: 'light' });
    },
  },
});
