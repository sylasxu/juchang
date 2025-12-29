/**
 * 草稿编辑页面
 * Requirements: 6.8, 15.4, CP-19
 * - 允许修改时间和标题
 * - 校验时间不能是过去
 * - 发布草稿活动
 */
import { getActivitiesById, putActivitiesById } from '../../../src/api/index';
import { chooseLocation } from '../../../src/config/index';

interface DraftData {
  id: string;
  title: string;
  type: string;
  startAt: string;
  location: [number, number];
  locationName: string;
  address?: string;
  locationHint: string;
  maxParticipants: number;
  description?: string;
}

interface PageData {
  activityId: string;
  draft: DraftData | null;
  loading: boolean;
  submitting: boolean;
  showTimePicker: boolean;
  formattedTime: string;
  isExpired: boolean;
}

interface PageOptions {
  id?: string;
  // 从 widget-draft 传递的数据
  title?: string;
  type?: string;
  startAt?: string;
  locationName?: string;
  locationHint?: string;
  lat?: string;
  lng?: string;
  maxParticipants?: string;
}

// 活动类型映射
const TYPE_LABELS: Record<string, string> = {
  food: '美食',
  entertainment: '娱乐',
  sports: '运动',
  boardgame: '桌游',
  mahjong: '麻将',
  hotpot: '火锅',
  ktv: 'KTV',
  movie: '电影',
  game: '游戏',
  drink: '喝酒',
  coffee: '咖啡',
  hiking: '徒步',
  other: '其他',
};

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    activityId: '',
    draft: null,
    loading: true,
    submitting: false,
    showTimePicker: false,
    formattedTime: '',
    isExpired: false,
  },

  onLoad(options: PageOptions) {
    const { id } = options;
    
    if (id) {
      // 从已有活动加载
      this.setData({ activityId: id });
      this.loadActivity(id);
    } else {
      // 从 URL 参数构建草稿数据
      this.buildDraftFromOptions(options);
    }
  },

  /** 从 URL 参数构建草稿数据 */
  buildDraftFromOptions(options: PageOptions) {
    const draft: DraftData = {
      id: '',
      title: options.title ? decodeURIComponent(options.title) : '',
      type: options.type || 'other',
      startAt: options.startAt ? decodeURIComponent(options.startAt) : '',
      location: [
        options.lng ? parseFloat(options.lng) : 0,
        options.lat ? parseFloat(options.lat) : 0,
      ],
      locationName: options.locationName ? decodeURIComponent(options.locationName) : '',
      locationHint: options.locationHint ? decodeURIComponent(options.locationHint) : '',
      maxParticipants: options.maxParticipants ? parseInt(options.maxParticipants, 10) : 10,
    };

    const formattedTime = this.formatTime(draft.startAt);
    const isExpired = this.checkExpired(draft.startAt);

    this.setData({
      draft,
      loading: false,
      formattedTime,
      isExpired,
    });
  },

  /** 加载已有活动 */
  async loadActivity(id: string) {
    this.setData({ loading: true });

    try {
      const response = await getActivitiesById(id);
      if (response.status === 200) {
        const data = response.data as any;
        const draft: DraftData = {
          id: data.id,
          title: data.title,
          type: data.type,
          startAt: data.startAt,
          location: data.location || [0, 0],
          locationName: data.locationName,
          address: data.address,
          locationHint: data.locationHint,
          maxParticipants: data.maxParticipants,
          description: data.description,
        };

        const formattedTime = this.formatTime(draft.startAt);
        const isExpired = this.checkExpired(draft.startAt);

        this.setData({
          draft,
          loading: false,
          formattedTime,
          isExpired,
        });
      } else {
        throw new Error('加载失败');
      }
    } catch (error) {
      console.error('加载活动失败', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  /** 格式化时间 */
  formatTime(dateStr: string): string {
    if (!dateStr) return '请选择时间';

    const date = new Date(dateStr);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (isToday) return `今天 ${timeStr}`;
    if (isTomorrow) return `明天 ${timeStr}`;

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${month}月${day}日 ${weekDays[date.getDay()]} ${timeStr}`;
  },

  /** 检查是否过期 - CP-19 */
  checkExpired(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr).getTime() < Date.now();
  },

  /** 标题输入 */
  onTitleInput(e: WechatMiniprogram.Input) {
    this.setData({ 'draft.title': e.detail.value });
  },

  /** 显示时间选择器 */
  showTimePicker() {
    this.setData({ showTimePicker: true });
  },

  /** 时间选择确认 */
  onTimeChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const { value } = e.detail;
    const isExpired = this.checkExpired(value);
    const formattedTime = this.formatTime(value);

    this.setData({
      'draft.startAt': value,
      showTimePicker: false,
      formattedTime,
      isExpired,
    });
  },

  /** 时间选择取消 */
  onTimePickerCancel() {
    this.setData({ showTimePicker: false });
  },

  /** 调整位置 */
  async onAdjustLocation() {
    try {
      const result = await chooseLocation();
      if (result) {
        this.setData({
          'draft.location': [result.longitude, result.latitude],
          'draft.locationName': result.name,
          'draft.address': result.address,
        });
      }
    } catch (err: any) {
      if (!err.message?.includes('取消')) {
        wx.showToast({ title: err.message || '选择位置失败', icon: 'none' });
      }
    }
  },

  /** 位置备注输入 */
  onLocationHintInput(e: WechatMiniprogram.Input) {
    this.setData({ 'draft.locationHint': e.detail.value });
  },

  /** 确认发布 */
  async onConfirmPublish() {
    const { draft, submitting, isExpired, activityId } = this.data;

    if (submitting || !draft) return;

    // CP-19: 校验时间不能是过去
    if (isExpired) {
      wx.showToast({ title: '活动时间已过期，请重新选择', icon: 'none' });
      return;
    }

    // 校验必填字段
    if (!draft.title?.trim()) {
      wx.showToast({ title: '请输入活动标题', icon: 'none' });
      return;
    }

    if (!draft.startAt) {
      wx.showToast({ title: '请选择活动时间', icon: 'none' });
      return;
    }

    if (!draft.locationName) {
      wx.showToast({ title: '请选择活动地点', icon: 'none' });
      return;
    }

    if (!draft.locationHint?.trim()) {
      wx.showToast({ title: '请填写位置备注', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      // 更新活动并发布
      const response = await putActivitiesById(activityId || draft.id, {
        title: draft.title.trim(),
        startAt: new Date(draft.startAt).toISOString(),
        locationName: draft.locationName,
        address: draft.address,
        locationHint: draft.locationHint.trim(),
        location: draft.location,
        status: 'active', // 发布活动
      });

      if (response.status === 200) {
        wx.showToast({ title: '发布成功！', icon: 'success' });

        // 跳转到活动详情页
        setTimeout(() => {
          const id = activityId || draft.id || (response.data as any)?.id;
          wx.redirectTo({
            url: `/subpackages/activity/detail/index?id=${id}&share=1`,
          });
        }, 1500);
      } else {
        throw new Error((response.data as any)?.msg || '发布失败');
      }
    } catch (error) {
      console.error('发布失败', error);
      wx.showToast({ title: (error as Error).message || '发布失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /** 获取类型标签 */
  getTypeLabel(type: string): string {
    return TYPE_LABELS[type] || '其他';
  },
});
