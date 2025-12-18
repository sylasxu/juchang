/**
 * 地图首页
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 4.1-4.5, 5.1-5.4
 */
import { getActivitiesNearby } from '../../src/api/index';

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
}

// Pin图标路径配置
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
    latitude: 39.908823,
    longitude: 116.397470,
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
  },

  mapCtx: null as WechatMiniprogram.MapContext | null,

  onLoad() {
    this.requestLocationPermission();
  },

  onReady() {
    this.mapCtx = wx.createMapContext('map');
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'map' });
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
      content: '请在设置中开启位置权限以使用地图功能',
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
        callout:
          item.type === 'cluster'
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

    if (item.type === 'ghost') {
      return { iconPath: PIN_ICONS.ghost, ...PIN_SIZES.ghost };
    }

    if (item.isPinPlus) {
      return { iconPath: PIN_ICONS.activity_pinplus, ...PIN_SIZES.pinplus };
    }

    if (item.isBoosted) {
      return { iconPath: PIN_ICONS.activity_boosted, ...PIN_SIZES.boosted };
    }

    return { iconPath: PIN_ICONS.activity, ...PIN_SIZES.normal };
  },

  onMarkerTap(e: WechatMiniprogram.MarkerTap) {
    const markerId = e.markerId;
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

    if (marker.itemType === 'ghost') {
      const token = wx.getStorageSync('token');
      if (!token) {
        wx.navigateTo({ url: '/pages/login/login' });
        return;
      }
      wx.navigateTo({
        url: `/subpackages/activity/create/index?lat=${marker.latitude}&lng=${marker.longitude}&ghostType=${marker._data?.ghostType || ''}`,
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
});
