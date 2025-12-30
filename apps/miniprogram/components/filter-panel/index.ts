/**
 * 筛选面板组件
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { FILTER_PANEL_OPTIONS, FilterPanelOption } from '../../src/constants/filter-options';

interface FilterOptions {
  time: string;
  type: string;
  gender: string;
  minReliability: number;
  distance: number;
  status: string;
  feeType: string;
}

interface ComponentData {
  timeOptions: FilterPanelOption[];
  typeOptions: FilterPanelOption[];
  genderOptions: FilterPanelOption[];
  distanceOptions: FilterPanelOption[];
  statusOptions: FilterPanelOption[];
  feeTypeOptions: FilterPanelOption[];
  localFilters: FilterOptions;
  reliabilityMarks: Record<number, string>;
}

const DEFAULT_FILTERS: FilterOptions = {
  time: 'all',
  type: 'all',
  gender: 'all',
  minReliability: 0,
  distance: 5,
  status: 'all',
  feeType: 'all',
};

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    filters: {
      type: Object,
      value: { ...DEFAULT_FILTERS },
    },
  },

  data: {
    timeOptions: FILTER_PANEL_OPTIONS.time,
    typeOptions: FILTER_PANEL_OPTIONS.type,
    genderOptions: FILTER_PANEL_OPTIONS.gender,
    distanceOptions: FILTER_PANEL_OPTIONS.distance,
    statusOptions: FILTER_PANEL_OPTIONS.status,
    feeTypeOptions: FILTER_PANEL_OPTIONS.feeType,
    localFilters: { ...DEFAULT_FILTERS },
    reliabilityMarks: {
      0: '不限',
      60: '60%',
      80: '80%',
      100: '100%',
    },
  } as ComponentData,

  observers: {
    filters: function (filters: FilterOptions) {
      this.setData({
        localFilters: { ...DEFAULT_FILTERS, ...filters },
      });
    },
    visible: function (visible: boolean) {
      if (visible) {
        this.setData({
          localFilters: { ...DEFAULT_FILTERS, ...this.properties.filters },
        });
      }
    },
  },

  methods: {
    onClose() {
      this.triggerEvent('close');
    },

    preventBubble() {
      // 阻止点击内容区域关闭面板
    },

    onTimeSelect(e: WechatMiniprogram.TouchEvent) {
      const value = e.currentTarget.dataset.value as string;
      this.setData({ 'localFilters.time': value });
    },

    onTypeSelect(e: WechatMiniprogram.TouchEvent) {
      const value = e.currentTarget.dataset.value as string;
      this.setData({ 'localFilters.type': value });
    },

    onGenderSelect(e: WechatMiniprogram.TouchEvent) {
      const value = e.currentTarget.dataset.value as string;
      this.setData({ 'localFilters.gender': value });
    },

    onReliabilityChange(e: WechatMiniprogram.CustomEvent<{ value: number }>) {
      const value = e.detail.value;
      this.setData({ 'localFilters.minReliability': value });
    },

    onDistanceSelect(e: WechatMiniprogram.TouchEvent) {
      const value = e.currentTarget.dataset.value as number;
      this.setData({ 'localFilters.distance': value });
    },

    onStatusSelect(e: WechatMiniprogram.TouchEvent) {
      const value = e.currentTarget.dataset.value as string;
      this.setData({ 'localFilters.status': value });
    },

    onFeeTypeSelect(e: WechatMiniprogram.TouchEvent) {
      const value = e.currentTarget.dataset.value as string;
      this.setData({ 'localFilters.feeType': value });
    },

    onReset() {
      this.setData({ localFilters: { ...DEFAULT_FILTERS } });
    },

    onApply() {
      const { localFilters } = this.data;
      const activeCount = this.calculateActiveCount(localFilters);

      this.triggerEvent('apply', {
        filters: { ...localFilters },
        activeCount,
      });

      this.triggerEvent('close');
    },

    calculateActiveCount(filters: FilterOptions): number {
      let count = 0;

      if (filters.time !== 'all') count++;
      if (filters.type !== 'all') count++;
      if (filters.gender !== 'all') count++;
      if (filters.minReliability > 0) count++;
      if (filters.distance !== 5) count++;
      if (filters.status !== 'all') count++;
      if (filters.feeType !== 'all') count++;

      return count;
    },

    getReliabilityText(value: number): string {
      if (value === 0) return '不限';
      return `≥${value}%`;
    },
  },
});
