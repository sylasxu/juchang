/**
 * 首页（地图 + AI输入栏）
 * Requirements: 1.1, 1.2, 2.1-2.6, 3.1-3.7, 4.1-4.7, 5.1-5.4, 19.1, 19.2
 */
import { getActivitiesNearby } from '../../src/api/index';
import {
  checkAISearchQuota,
  consumeAISearchQuota,
  showAIQuotaExhaustedTip,
} from '../../src/services/quota';

// 类型定义
interface PinSize {
  width: number;
  height: number;
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

interface NearbyItem {
  id: string;
  type: 'activity' | 'cluster' | 'ghost';
  lat: number;
  lng: number;
  title?: string;
  isBoosted?: boolean;
  isPinPlus?: boolean;
  locationHint?: string;
  activityType?: string;
  startAt?: string;
  feeType?: string;
  status?: string;
  genderRequirement?: string;
  creatorReliabilityRate?: number;
  count?: number;
  ghostType?: string;
  displayText?: string; // 幽灵锚点引导文案
}

interface ActivityListItem {
  id: string;
  title?: string;
  latitude: number;
  longitude: number;
  isBoosted?: boolean;
  isPinPlus?: boolean;
  locationHint?: string;
  activityType?: string;
  startAt?: string;
  feeType?: string;
  status?: string;
}

interface MapMarker {
  id: number;
  latitude: number;
  longitude: number;
  iconPath: string;
  width: number;
  height: number;
  activityId?: string;
  itemType?: string;
  callout?: {
    content: string;
    display: string;
    fontSize: number;
    borderRadius: number;
    padding: number;
    bgColor: string;
    color: string;
  };
  customCallout?: {
    display: string;
    anchorX: number;
    anchorY: number;
  };
  _data?: NearbyItem;
}

interface SelectedActivity {
  id: string;
  title?: string;
  latitude: number;
  longitude: number;
  isBoosted?: boolean;
  isPinPlus?: boolean;
  locationHint?: string;
}

interface PageData {
  latitude: number;
  longitude: number;
  scale: number;
  markers: MapMarker[];
  locationAuthorized: boolean;
  isLoading: boolean;
  filterCount: number;
  activityCount: number;
  activitiesLoading: boolean;
  nearbyActivities: ActivityListItem[];
  rawActivities: NearbyItem[];
  showActivityCard: boolean;
  selectedActivity: SelectedActivity | null;
  showFilterPanel: boolean;
  filters: FilterOptions;
  // AI 输入栏相关
  aiPrefillText: string;
  aiPrefillType: string;
  aiPrefillLocation: number[] | null;
  // CUI 副驾面板相关
  showCUIPanel: boolean;
}

// Pin图标路径配置 - Requirements: 4.3, 4.4, 4.7
const PIN_ICONS: Record<string, string> = {
  activity: '/static/pins/activity.png',
  activity_pinplus: '/static/pins/activity_gold.png',
  activity_boosted: '/static/pins/activity_fire.png',
  ghost: '/static/pins/ghost.png',
  cluster: '/static/pins/cluster.png',
};

// Pin尺寸配置
const PIN_SIZES: Record<string, PinSize> = {
  normal: { width: 30, height: 36 },
  pinplus: { width: 45, height: 54 },
  boosted: { width: 36, height: 43 },
  ghost: { width: 28, height: 34 },
  cluster: { width: 40, height: 40 },
};

// 默认筛选条件
const DEFAULT_FILTERS: FilterOptions = {
  time: 'all',
  type: 'all',
  gender: 'all',
  minReliability: 0,
  distance: 5,
  status: 'all',
  feeType: 'all',
};

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    latitude: 29.563009,
    longitude: 106.551556,
    scale: 14,
    markers: [],
    locationAuthorized: false,
    isLoading: true,
    filterCount: 0,
    activityCount: 0,
    activitiesLoading: false,
    nearbyActivities: [],
    rawActivities: [],
    showActivityCard: false,
    selectedActivity: null,
    showFilterPanel: false,
    filters: { ...DEFAULT_FILTERS },
    // AI 输入栏相关
    aiPrefillText: '',
    aiPrefillType: '',
    aiPrefillLocation: null,
    // CUI 副驾面板相关
    showCUIPanel: false,
  },

  mapCtx: null as WechatMiniprogram.MapContext | null,

  onLoad() {
    this.requestLocationPermission();
  },

  onReady() {
    this.mapCtx = wx.createMapContext('map');
  },

  onShow() {
    // 更新TabBar选中状态 - Requirements: 1.3
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'home' });
    }
  },

  async requestLocationPermission() {
    try {
      const setting = await wx.getSetting();
      if (setting.authSetting['scope.userLocation']) {
        this.setData({ locationAuthorized: true });
        this.getCurrentLocation();
        return;
      }

      await wx.authorize({ scope: 'scope.userLocation' });
      this.setData({ locationAuthorized: true });
      this.getCurrentLocation();
    } catch (error) {
      console.log('位置权限被拒绝', error);
      this.setData({ isLoading: false });
      this.showLocationPermissionModal();
    }
  },

  getCurrentLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          isLoading: false,
        });
        wx.setStorageSync('lastLocation', {
          latitude: res.latitude,
          longitude: res.longitude,
          timestamp: Date.now(),
        });
        this.loadNearbyActivities();
      },
      fail: (err) => {
        console.log('获取位置失败', err);
        this.setData({ isLoading: false });
        wx.showToast({ title: '获取位置失败', icon: 'none' });
      },
    });
  },

  showLocationPermissionModal() {
    wx.showModal({
      title: '需要位置权限',
      content: '聚场需要获取您的位置来显示附近活动',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting({
            success: (settingRes) => {
              if (settingRes.authSetting['scope.userLocation']) {
                this.setData({ locationAuthorized: true });
                this.getCurrentLocation();
              }
            },
          });
        }
      },
    });
  },

  async loadNearbyActivities() {
    this.setData({ activitiesLoading: true });

    try {
      const response = await getActivitiesNearby({
        lat: this.data.latitude,
        lng: this.data.longitude,
        radius: this.data.filters.distance,
        zoom_level: this.data.scale,
        include_ghosts: true,
      });

      if (response.status === 200) {
        const data = response.data as { items: NearbyItem[]; total: number };
        const { items } = data;

        this.setData({ rawActivities: items });
        this.applyFilters(items);
        this.setData({ activitiesLoading: false });
      } else {
        throw new Error('获取活动失败');
      }
    } catch (error) {
      console.error('加载附近活动失败', error);
      this.setData({ activitiesLoading: false, rawActivities: [] });
      this.renderMarkers([]);
    }
  },

  applyFilters(items: NearbyItem[]) {
    const { filters } = this.data;

    const filteredItems = items.filter((item) => {
      if (item.type !== 'activity') return true;

      if (filters.time !== 'all' && !this.matchTimeFilter(item, filters.time)) {
        return false;
      }

      if (filters.type !== 'all' && item.activityType !== filters.type) {
        return false;
      }

      if (filters.gender !== 'all' && item.genderRequirement !== filters.gender) {
        return false;
      }

      if (filters.minReliability > 0) {
        const creatorReliability = item.creatorReliabilityRate || 0;
        if (creatorReliability < filters.minReliability) {
          return false;
        }
      }

      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      if (filters.feeType !== 'all' && item.feeType !== filters.feeType) {
        return false;
      }

      return true;
    });

    const activities: ActivityListItem[] = filteredItems
      .filter((item) => item.type === 'activity')
      .map((item) => ({
        id: item.id,
        title: item.title,
        latitude: item.lat,
        longitude: item.lng,
        isBoosted: item.isBoosted,
        isPinPlus: item.isPinPlus,
        locationHint: item.locationHint,
        activityType: item.activityType,
        startAt: item.startAt,
        feeType: item.feeType,
        status: item.status,
      }));

    this.setData({
      nearbyActivities: activities,
      activityCount: activities.length,
    });

    this.renderMarkers(filteredItems);
  },

  matchTimeFilter(item: NearbyItem, timeFilter: string): boolean {
    if (!item.startAt) return true;

    const now = new Date();
    const startAt = new Date(item.startAt);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (timeFilter) {
      case 'today':
        return startAt >= today && startAt < tomorrow;
      case 'tomorrow':
        return startAt >= tomorrow && startAt < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
      case 'week':
        return startAt >= today && startAt < weekEnd;
      default:
        return true;
    }
  },

  renderMarkers(items: NearbyItem[]) {
    const markers: MapMarker[] = items.map((item, index) => {
      const markerConfig = this.getMarkerConfig(item);
      return {
        id: index,
        latitude: item.lat,
        longitude: item.lng,
        iconPath: markerConfig.iconPath,
        width: markerConfig.width,
        height: markerConfig.height,
        activityId: item.id,
        itemType: item.type,
        // 幽灵锚点显示引导文案 - Requirements: 5.3
        callout:
          item.type === 'ghost'
            ? {
                content: item.displayText || '这里缺一个活动',
                display: 'ALWAYS',
                fontSize: 12,
                borderRadius: 8,
                padding: 6,
                bgColor: '#4CAF50',
                color: '#FFFFFF',
              }
            : item.type === 'cluster'
              ? {
                  content: `${item.count}个活动`,
                  display: 'ALWAYS',
                  fontSize: 12,
                  borderRadius: 8,
                  padding: 6,
                  bgColor: '#FF6B35',
                  color: '#FFFFFF',
                }
              : undefined,
        customCallout: item.isPinPlus
          ? {
              display: 'ALWAYS',
              anchorX: 0,
              anchorY: -markerConfig.height / 2,
            }
          : undefined,
        _data: item,
      };
    });

    this.setData({ markers });
  },

  getMarkerConfig(item: NearbyItem): { iconPath: string; width: number; height: number } {
    if (item.type === 'cluster') {
      return { iconPath: PIN_ICONS.cluster, ...PIN_SIZES.cluster };
    }

    // 幽灵锚点 - 绿色虚线Pin - Requirements: 4.7, 5.1
    if (item.type === 'ghost') {
      return { iconPath: PIN_ICONS.ghost, ...PIN_SIZES.ghost };
    }

    // Pin+ - 金色1.5倍大小 - Requirements: 4.3
    if (item.isPinPlus) {
      return { iconPath: PIN_ICONS.activity_pinplus, ...PIN_SIZES.pinplus };
    }

    // Boost - 橙色闪烁 - Requirements: 4.4
    if (item.isBoosted) {
      return { iconPath: PIN_ICONS.activity_boosted, ...PIN_SIZES.boosted };
    }

    return { iconPath: PIN_ICONS.activity, ...PIN_SIZES.normal };
  },

  onMarkerTap(e: WechatMiniprogram.CustomEvent<{ markerId: number }>) {
    const markerId = e.detail.markerId;
    const marker = this.data.markers.find((m) => m.id === markerId);

    if (!marker) return;

    if (marker.itemType === 'cluster') {
      this.setData({
        scale: Math.min(this.data.scale + 2, 18),
        latitude: marker.latitude,
        longitude: marker.longitude,
      });
      setTimeout(() => this.loadNearbyActivities(), 300);
      return;
    }

    // 幽灵锚点点击 - 唤起AI输入栏并预填数据 - Requirements: 5.2
    if (marker.itemType === 'ghost') {
      const token = wx.getStorageSync('token');
      if (!token) {
        wx.navigateTo({ url: '/pages/login/login' });
        return;
      }
      
      // 唤起 AI 输入栏并预填锚点数据
      this.openAIInputWithPrefill({
        text: marker._data?.displayText || '',
        type: marker._data?.activityType || '',
        location: [marker.longitude, marker.latitude],
      });
      return;
    }

    if (marker.activityId) {
      this.setData({
        showActivityCard: true,
        selectedActivity: {
          id: marker.activityId,
          title: marker._data?.title,
          latitude: marker.latitude,
          longitude: marker.longitude,
          isBoosted: marker._data?.isBoosted,
          isPinPlus: marker._data?.isPinPlus,
          locationHint: marker._data?.locationHint,
        },
      });
    }
  },

  onCloseActivityCard() {
    this.setData({
      showActivityCard: false,
      selectedActivity: null,
    });
  },

  onActivityCardTap() {
    const { selectedActivity } = this.data;
    if (selectedActivity?.id) {
      this.setData({ showActivityCard: false });
      wx.navigateTo({
        url: `/subpackages/activity/detail/index?id=${selectedActivity.id}`,
      });
    }
  },

  onLocationTap() {
    if (!this.data.locationAuthorized) {
      this.requestLocationPermission();
      return;
    }

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        if (this.mapCtx) {
          this.mapCtx.moveToLocation({
            latitude: res.latitude,
            longitude: res.longitude,
            success: () => {
              this.setData({
                latitude: res.latitude,
                longitude: res.longitude,
              });
            },
          });
        } else {
          this.setData({
            latitude: res.latitude,
            longitude: res.longitude,
          });
        }
      },
      fail: (err) => {
        console.log('获取位置失败', err);
        wx.showToast({ title: '获取位置失败', icon: 'none' });
      },
    });
  },

  onSafetyTap() {
    wx.navigateTo({ url: '/subpackages/safety/index' });
  },

  onCreateActivity() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({ url: '/subpackages/activity/create/index' });
  },

  onFilterTap() {
    this.setData({ showFilterPanel: true });
  },

  onFilterPanelClose() {
    this.setData({ showFilterPanel: false });
  },

  onFilterApply(e: WechatMiniprogram.CustomEvent<{ filters: FilterOptions; activeCount: number }>) {
    const { filters, activeCount } = e.detail;
    const distanceChanged = filters.distance !== this.data.filters.distance;

    this.setData({
      filters,
      filterCount: activeCount,
      showFilterPanel: false,
    });

    if (distanceChanged) {
      this.loadNearbyActivities();
    } else {
      this.applyFilters(this.data.rawActivities);
    }
  },

  resetFilters() {
    this.setData({
      filters: { ...DEFAULT_FILTERS },
      filterCount: 0,
    });
    this.applyFilters(this.data.rawActivities);
  },

  onActivityListItemTap(e: WechatMiniprogram.TouchEvent) {
    const activity = e.currentTarget.dataset.activity as ActivityListItem;
    if (activity?.id) {
      wx.navigateTo({
        url: `/subpackages/activity/detail/index?id=${activity.id}`,
      });
    }
  },

  onDrawerExpand() {
    if (this.data.nearbyActivities.length === 0) {
      this.loadNearbyActivities();
    }
  },

  onDrawerCollapse() {
    // 抽屉收起时的处理
  },

  onRegionChange(e: WechatMiniprogram.RegionChange) {
    if (e.type === 'end' && e.causedBy === 'drag') {
      // 可以在这里加载新区域的活动
    }
  },

  // 地图飞向指定位置 - Requirements: 3.2
  flyToLocation(lat: number, lng: number) {
    if (this.mapCtx) {
      this.mapCtx.moveToLocation({
        latitude: lat,
        longitude: lng,
      });
      this.setData({
        latitude: lat,
        longitude: lng,
      });
    }
  },

  // ==================== AI 输入栏相关 ====================

  /**
   * AI 输入栏展开 - Requirements: 2.2
   */
  onAIInputExpand() {
    console.log('AI 输入栏展开');
  },

  /**
   * AI 输入栏收起
   */
  onAIInputCollapse() {
    console.log('AI 输入栏收起');
    // 清空预填数据
    this.setData({
      aiPrefillText: '',
      aiPrefillType: '',
      aiPrefillLocation: null,
    });
  },

  /**
   * AI 解析请求 - Requirements: 2.3, 2.6, 19.1, 19.2
   */
  onAIParse(e: WechatMiniprogram.CustomEvent<{ text: string; prefillType?: string; prefillLocation?: number[] }>) {
    const { text, prefillType, prefillLocation } = e.detail;
    console.log('AI 解析请求:', text, prefillType, prefillLocation);

    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    // 检查 AI 额度 - Requirements: 19.1, 19.2
    if (!checkAISearchQuota()) {
      showAIQuotaExhaustedTip();
      return;
    }

    // 消耗 AI 额度
    consumeAISearchQuota();

    // 显示 CUI 副驾面板
    this.setData({ showCUIPanel: true });

    // 获取 CUI 面板组件实例并开始解析
    const cuiPanel = this.selectComponent('#cuiPanel');
    if (cuiPanel) {
      // 使用模拟方法进行开发调试
      // TODO: 替换为真实 AI API 调用
      cuiPanel.simulateAIResponse(text);
    }
  },

  // ==================== CUI 副驾面板相关 ====================

  /**
   * CUI 面板关闭
   */
  onCUIPanelClose() {
    this.setData({ showCUIPanel: false });
  },

  /**
   * CUI 面板位置联动 - Requirements: 3.2
   * AI 定位到地点时，地图同步飞向目标位置
   */
  onCUILocation(e: WechatMiniprogram.CustomEvent<{ name: string; lat: number; lng: number }>) {
    const { lat, lng } = e.detail;
    this.flyToLocation(lat, lng);
  },

  /**
   * CUI 面板选择活动 - Requirements: 3.4
   * 用户点击"发现X个局"卡片
   */
  onCUISelectActivities(e: WechatMiniprogram.CustomEvent<{ activities: Array<{ id: string }> }>) {
    const { activities } = e.detail;
    
    // 关闭 CUI 面板
    this.setData({ showCUIPanel: false });
    
    // 如果只有一个活动，直接跳转详情页
    if (activities.length === 1) {
      wx.navigateTo({
        url: `/subpackages/activity/detail/index?id=${activities[0].id}`,
      });
      return;
    }
    
    // 多个活动时，可以展示列表或在地图上高亮
    // TODO: 实现多活动展示逻辑
    wx.showToast({ title: `发现 ${activities.length} 个活动`, icon: 'none' });
  },

  /**
   * CUI 面板创建草稿 - Requirements: 3.7
   * 用户点击"立即发布"按钮
   */
  onCUICreateDraft(e: WechatMiniprogram.CustomEvent<{ draft: { title: string; type: string; startAt: string; location: { name: string; coords: [number, number] }; maxParticipants: number; description?: string } }>) {
    const { draft } = e.detail;
    
    // 关闭 CUI 面板
    this.setData({ showCUIPanel: false });
    
    // 跳转到创建页并预填数据
    const params = new URLSearchParams();
    if (draft.title) params.append('title', draft.title);
    if (draft.type) params.append('type', draft.type);
    if (draft.startAt) params.append('startAt', draft.startAt);
    if (draft.maxParticipants) params.append('maxParticipants', String(draft.maxParticipants));
    if (draft.location?.name) params.append('locationName', draft.location.name);
    if (draft.location?.coords) {
      params.append('lng', String(draft.location.coords[0]));
      params.append('lat', String(draft.location.coords[1]));
    }
    if (draft.description) params.append('description', draft.description);

    wx.navigateTo({
      url: `/subpackages/activity/create/index?${params.toString()}`,
    });
  },

  /**
   * 唤起 AI 输入栏并预填数据 - Requirements: 5.2
   * 供幽灵锚点等场景调用
   */
  openAIInputWithPrefill(data: { text?: string; type?: string; location?: number[] }) {
    this.setData({
      aiPrefillText: data.text || '',
      aiPrefillType: data.type || '',
      aiPrefillLocation: data.location || null,
    });

    // 获取 AI 输入栏组件实例并调用方法
    const aiInputBar = this.selectComponent('#aiInputBar');
    if (aiInputBar) {
      aiInputBar.setPrefillData(data);
    }
  },
});
