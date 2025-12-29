/**
 * Widget Explore 组件 (Generative UI)
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 * 
 * 探索卡片 (v3.5 零成本地图方案)
 * - 显示标题（"为你找到观音桥附近的 5 个热门活动"）
 * - 使用位置文字卡片替代静态地图（零成本）
 * - 显示活动列表（最多 3 个）
 * - 实现 [🗺️ 展开地图查看更多] 按钮
 */

// 探索结果类型
interface ExploreResult {
  id: string;
  title: string;
  type: string;
  lat: number;
  lng: number;
  locationName: string;
  locationHint?: string;
  distance: number; // 米
  startAt: string;
  currentParticipants?: number;
  maxParticipants?: number;
}

// 中心点类型
interface CenterPoint {
  lat: number;
  lng: number;
  name: string;
}

interface ComponentData {
  displayResults: ExploreResult[];
  headerTitle: string;
}

interface ComponentProperties {
  results: WechatMiniprogram.Component.PropertyOption;
  center: WechatMiniprogram.Component.PropertyOption;
  title: WechatMiniprogram.Component.PropertyOption;
}

Component<ComponentData, ComponentProperties>({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 搜索结果
    results: {
      type: Array,
      value: [] as ExploreResult[],
    },
    // 搜索中心点
    center: {
      type: Object,
      value: { lat: 29.5647, lng: 106.5507, name: '观音桥' } as CenterPoint,
    },
    // 自定义标题
    title: {
      type: String,
      value: '',
    },
  },

  data: {
    displayResults: [] as ExploreResult[],
    headerTitle: '',
  },

  observers: {
    'results, center, title': function(results: ExploreResult[], center: CenterPoint, title: string) {
      // 最多显示 3 个活动
      const displayResults = (results || []).slice(0, 3);
      
      // 生成标题
      const headerTitle = title || this.generateTitle(center, results?.length || 0);
      
      this.setData({
        displayResults,
        headerTitle,
      });
    },
  },

  methods: {
    /**
     * 生成标题
     * Requirements: 17.2
     */
    generateTitle(center: CenterPoint, count: number): string {
      if (!center?.name) {
        return `为你找到附近的 ${count} 个热门活动`;
      }
      return `为你找到${center.name}附近的 ${count} 个热门活动`;
    },

    /**
     * 点击展开地图
     * Requirements: 17.4, 18.8
     */
    onExpandMap() {
      const results = this.properties.results as ExploreResult[];
      const center = this.properties.center as CenterPoint;
      
      // 触发事件
      this.triggerEvent('expandmap', { results, center });
      
      // 跳转到沉浸式地图页，使用放大动画效果
      wx.navigateTo({
        url: `/subpackages/activity/explore/index?lat=${center.lat}&lng=${center.lng}&results=${encodeURIComponent(JSON.stringify(results))}&animate=expand`,
        // 使用自定义动画类型
        routeType: 'none' as any, // 禁用默认动画，使用页面内动画
      });
    },

    /**
     * 点击活动项
     * Requirements: 17.5
     */
    onActivityTap(e: WechatMiniprogram.TouchEvent) {
      const { id } = e.currentTarget.dataset;
      if (!id) return;
      
      // 触发事件
      this.triggerEvent('activitytap', { id });
      
      // 跳转到活动详情页
      wx.navigateTo({
        url: `/subpackages/activity/detail/index?id=${id}`,
      });
    },

    /**
     * 点击位置卡片 - 展开地图
     */
    onLocationTap() {
      this.onExpandMap();
    },
  },
});
