/**
 * 筛选面板组件
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

interface FilterOption {
  value: string | number;
  label: string;
}

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
  timeOptions: FilterOption[];
  typeOptions: FilterOption[];
  genderOptions: FilterOption[];
  distanceOptions: FilterOption[];
  statusOptions: FilterOption[];
  feeTypeOptions: FilterOption[];
  localFilters: FilterOptions;
  reliabilityMarks: Record<number, string>;
}

interface ComponentProperties {
  visible: boolean;
  filters: FilterOptions;
}

const FILTER_OPTIONS = {
  time: [
    { value: 'all', label: '全部' },
    { value: 'today', label: '今天' },
    { value: 'tomorrow', label: '明天' },
    { value: 'week', label: '本周' },
  ],
  type: [
    { value: 'all', label: '全部' },
    { value: 'sports', label: '运动' },
    { value: 'food', label: '美食' },
    { value: 'game', label: '游戏' },
    { value: 'travel', label: '出行' },
    { value: 'study', label: '学习' },
    { value: 'social', label: '社交' },
    { value: 'other', label: '其他' },
  ],
  gender: [
    { value: 'all', label: '不限' },
    { value: 'female_only', label: '仅限女生' },
    { value: 'male_only', label: '仅限男生' },
  ],
  distance: [
    { value: 1, label: '1km' },
    { value: 3, label: '3km' },
    { value: 5, label: '5km' },
    { value: 10, label: '10km' },
  ],
  status: [
    { value: 'all', label: '全部' },
    { value: 'recruiting', label: '招募中' },
    { value: 'full', label: '已满员' },
    { value: 'ongoing', label: '进行中' },
  ],
  feeType: [
    { value: 'all', label: '全部' },
    { value: 'free', label: '免费' },
    { value: 'aa', label: 'AA制' },
    { value: 'fixed', label: '固定费用' },
  ],
};

const DEFAULT_FILTERS: FilterOptions = {
  time: 'all',
  type: 'all',
  gender: 'all',
  minReliability: 0,
  distance: 5,
  status: 'all',
  feeType: 'all',
};

Component<ComponentData, ComponentProperties, WechatMiniprogram.Component.MethodOption>({
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
    timeOptions: FILTER_OPTIONS.time,
    typeOptions: FILTER_OPTIONS.type,
    genderOptions: FILTER_OPTIONS.gender,
    distanceOptions: FILTER_OPTIONS.distance,
    statusOptions: FILTER_OPTIONS.status,
    feeTypeOptions: FILTER_OPTIONS.feeType,
    localFilters: { ...DEFAULT_FILTERS },
    reliabilityMarks: {
      0: '不限',
      60: '60%',
      80: '80%',
      100: '100%',
    },
  },

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
