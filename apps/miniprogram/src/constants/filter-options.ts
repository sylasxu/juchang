/**
 * 筛选选项配置
 * 共享常量，避免重复声明
 */

export interface FilterBarOption {
  key: string;
  label: string;
  icon: string;
}

export const FILTER_BAR_OPTIONS: FilterBarOption[] = [
  { key: 'all', label: '全部', icon: '' },
  { key: 'food', label: '美食', icon: 'shop' },
  { key: 'sports', label: '运动', icon: 'heart' },
  { key: 'boardgame', label: '桌游', icon: 'app' },
  { key: 'entertainment', label: '娱乐', icon: 'film' },
];

export interface FilterPanelOption {
  value: string | number;
  label: string;
}

export const FILTER_PANEL_OPTIONS = {
  time: [
    { value: 'all', label: '全部' },
    { value: 'today', label: '今天' },
    { value: 'tomorrow', label: '明天' },
    { value: 'week', label: '本周' },
  ] as FilterPanelOption[],
  type: [
    { value: 'all', label: '全部' },
    { value: 'sports', label: '运动' },
    { value: 'food', label: '美食' },
    { value: 'game', label: '游戏' },
    { value: 'travel', label: '出行' },
    { value: 'study', label: '学习' },
    { value: 'social', label: '社交' },
    { value: 'other', label: '其他' },
  ] as FilterPanelOption[],
  gender: [
    { value: 'all', label: '不限' },
    { value: 'female_only', label: '仅限女生' },
    { value: 'male_only', label: '仅限男生' },
  ] as FilterPanelOption[],
  distance: [
    { value: 1, label: '1km' },
    { value: 3, label: '3km' },
    { value: 5, label: '5km' },
    { value: 10, label: '10km' },
  ] as FilterPanelOption[],
  status: [
    { value: 'all', label: '全部' },
    { value: 'recruiting', label: '招募中' },
    { value: 'full', label: '已满员' },
    { value: 'ongoing', label: '进行中' },
  ] as FilterPanelOption[],
  feeType: [
    { value: 'all', label: '全部' },
    { value: 'free', label: '免费' },
    { value: 'aa', label: 'AA制' },
    { value: 'fixed', label: '固定费用' },
  ] as FilterPanelOption[],
};
