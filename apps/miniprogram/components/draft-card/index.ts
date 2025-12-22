/**
 * 创建草稿卡片组件
 * Requirements: 3.5, 3.7
 *
 * 显示 AI 解析的活动草稿预览
 * 点击"立即发布"跳转创建页并预填数据
 */

// 活动草稿类型
interface ActivityDraft {
  title: string;
  type: string;
  startAt: string;
  location: {
    name: string;
    coords: [number, number];
  };
  maxParticipants: number;
  description?: string;
}

// 活动类型映射
const TYPE_MAP: Record<string, { icon: string; label: string }> = {
  mahjong: { icon: '🀄️', label: '麻将' },
  hotpot: { icon: '🍲', label: '火锅' },
  ktv: { icon: '🎤', label: 'KTV' },
  movie: { icon: '🎬', label: '电影' },
  sports: { icon: '⚽', label: '运动' },
  game: { icon: '🎮', label: '游戏' },
  drink: { icon: '🍻', label: '喝酒' },
  coffee: { icon: '☕', label: '咖啡' },
  hiking: { icon: '🥾', label: '徒步' },
  other: { icon: '🎯', label: '其他' },
};

interface ComponentData {
  typeIcon: string;
  typeLabel: string;
}

interface ComponentProperties {
  draft: WechatMiniprogram.Component.PropertyOption;
}

Component<ComponentData, ComponentProperties>({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    draft: {
      type: Object,
      value: null,
    },
  },

  data: {
    typeIcon: '🎯',
    typeLabel: '活动',
  },

  observers: {
    'draft.type'(type: string) {
      const typeInfo = TYPE_MAP[type] || TYPE_MAP.other;
      this.setData({
        typeIcon: typeInfo.icon,
        typeLabel: typeInfo.label,
      });
    },
  },

  methods: {
    /**
     * 点击卡片
     */
    onCardTap() {
      // 整个卡片点击也触发发布
      this.onPublishTap();
    },

    /**
     * 点击发布按钮 - Requirements: 3.7
     */
    onPublishTap() {
      const draft = this.properties.draft as ActivityDraft;
      if (!draft) return;

      // 触发发布事件
      this.triggerEvent('publish', { draft });

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
  },
});
