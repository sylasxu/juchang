/**
 * 活动详情页
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
import { getActivitiesById, postActivitiesByIdJoin, getUsersMe } from '../../../src/api/index';

interface User {
  id: string;
  nickname?: string;
  avatarUrl?: string;
  participationCount?: number;
  fulfillmentCount?: number;
  organizationCount?: number;
}

interface Participant {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  user?: User;
}

interface Activity {
  id: string;
  title: string;
  description?: string;
  images?: string[];
  startAt?: string;
  endAt?: string;
  locationName?: string;
  address?: string;
  locationHint?: string;
  isLocationBlurred?: boolean;
  maxParticipants?: number;
  currentParticipants?: number;
  feeType?: string;
  estimatedCost?: number;
  type?: string;
  minReliabilityRate?: number;
  creatorId: string;
  creator?: User;
  participants?: Participant[];
  isPinPlus?: boolean;
  isBoosted?: boolean;
}

interface PageData {
  activityId: string;
  activity: Activity | null;
  currentUser: User | null;
  loading: boolean;
  error: boolean;
  errorMsg: string;
  isJoining: boolean;
  showJoinDialog: boolean;
  joinMessage: string;
  isHotActivity: boolean;
  useFastPass: boolean;
  fastPassPrice: number;
  participantStatus: 'pending' | 'approved' | 'rejected' | null;
  isCreator: boolean;
}

interface PageOptions {
  id?: string;
  share?: string;
}

const STATUS_TEXT: Record<string, string> = {
  pending: '已申请，等待审核',
  approved: '已通过审核',
  rejected: '申请被拒绝',
};

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    activityId: '',
    activity: null,
    currentUser: null,
    loading: true,
    error: false,
    errorMsg: '',
    isJoining: false,
    showJoinDialog: false,
    joinMessage: '',
    isHotActivity: false,
    useFastPass: false,
    fastPassPrice: 2,
    participantStatus: null,
    isCreator: false,
  },

  onLoad(options: PageOptions) {
    const { id } = options;
    if (id) {
      this.setData({ activityId: id });
      this.loadActivityDetail(id);
      this.loadCurrentUser();
    } else {
      this.setData({
        loading: false,
        error: true,
        errorMsg: '活动ID不存在',
      });
    }
  },

  onShow() {
    if (this.data.activityId) {
      this.loadActivityDetail(this.data.activityId);
    }
  },

  async loadActivityDetail(id: string) {
    this.setData({ loading: true, error: false });

    try {
      const response = await getActivitiesById(id);

      if (response.status === 200) {
        const activity = response.data as Activity;

        const pendingCount = (activity.participants || []).filter((p) => p.status === 'pending').length;
        const isHotActivity = pendingCount > 5;

        const currentUserId = wx.getStorageSync('userId') as string;
        const isCreator = activity.creatorId === currentUserId;
        let participantStatus: PageData['participantStatus'] = null;

        if (currentUserId && activity.participants) {
          const participant = activity.participants.find((p) => p.userId === currentUserId);
          if (participant) {
            participantStatus = participant.status;
          }
        }

        this.setData({
          activity,
          loading: false,
          isHotActivity,
          isCreator,
          participantStatus,
        });
      } else {
        throw new Error((response.data as { msg?: string })?.msg || '获取活动详情失败');
      }
    } catch (error) {
      console.error('加载活动详情失败', error);
      this.setData({
        loading: false,
        error: true,
        errorMsg: (error as Error).message || '加载失败，请重试',
      });
    }
  },

  async loadCurrentUser() {
    const token = wx.getStorageSync('token');
    if (!token) return;

    try {
      const response = await getUsersMe();
      if (response.status === 200) {
        this.setData({ currentUser: response.data as User });
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  },

  calculateReliability(user: User | null | undefined): number {
    if (!user || !user.participationCount) return -1;
    return Math.round(((user.fulfillmentCount || 0) / user.participationCount) * 100);
  },

  getReliabilityLabel(rate: number): string {
    if (rate === -1) return '🆕 新用户';
    if (rate === 100) return '⭐⭐⭐ 非常靠谱';
    if (rate >= 80) return '⭐⭐ 靠谱';
    if (rate >= 60) return '⭐ 一般';
    return '待提升';
  },

  onCreatorTap() {
    const { activity } = this.data;
    if (activity?.creator) {
      wx.navigateTo({
        url: `/subpackages/user/profile/index?id=${activity.creatorId}`,
        fail: () => {
          this.showCreatorInfo();
        },
      });
    }
  },

  showCreatorInfo() {
    const { activity } = this.data;
    if (!activity?.creator) return;

    const creator = activity.creator;
    const reliability = this.calculateReliability(creator);
    const reliabilityLabel = this.getReliabilityLabel(reliability);

    wx.showModal({
      title: creator.nickname || '匿名用户',
      content: `靠谱度: ${reliabilityLabel}\n组织场次: ${creator.organizationCount || 0}\n参与场次: ${creator.participationCount || 0}`,
      showCancel: false,
      confirmText: '知道了',
    });
  },

  onJoinTap() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    const { activity, currentUser, participantStatus, isCreator } = this.data;

    if (isCreator) {
      wx.showToast({ title: '你是活动发起人', icon: 'none' });
      return;
    }

    if (participantStatus) {
      wx.showToast({ title: STATUS_TEXT[participantStatus] || '已报名', icon: 'none' });
      return;
    }

    if (activity?.minReliabilityRate && currentUser) {
      const userReliability = this.calculateReliability(currentUser);
      if (userReliability !== -1 && userReliability < activity.minReliabilityRate) {
        wx.showModal({
          title: '靠谱度不足',
          content: `该活动要求靠谱度不低于${activity.minReliabilityRate}%，你当前的靠谱度为${userReliability}%`,
          showCancel: false,
          confirmText: '知道了',
        });
        return;
      }
    }

    this.setData({ showJoinDialog: true });
  },

  onCloseJoinDialog() {
    this.setData({
      showJoinDialog: false,
      joinMessage: '',
      useFastPass: false,
    });
  },

  onJoinMessageInput(e: WechatMiniprogram.Input) {
    this.setData({ joinMessage: e.detail.value });
  },

  onFastPassChange(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    this.setData({ useFastPass: e.detail.value });
  },

  async onConfirmJoin() {
    const { activityId, joinMessage, useFastPass, isJoining } = this.data;

    if (isJoining) return;

    this.setData({ isJoining: true });

    try {
      const response = await postActivitiesByIdJoin(activityId, {
        applicationMsg: joinMessage || undefined,
        isFastPass: useFastPass,
      });

      if (response.status === 200) {
        wx.showToast({ title: '报名成功', icon: 'success' });
        this.setData({
          showJoinDialog: false,
          joinMessage: '',
          useFastPass: false,
          participantStatus: 'pending',
        });
        this.loadActivityDetail(activityId);
      } else {
        throw new Error((response.data as { msg?: string })?.msg || '报名失败');
      }
    } catch (error) {
      console.error('报名失败', error);
      wx.showToast({ title: (error as Error).message || '报名失败', icon: 'none' });
    } finally {
      this.setData({ isJoining: false });
    }
  },

  onEnterChat() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    const { activityId, participantStatus, isCreator } = this.data;

    if (!isCreator && participantStatus !== 'approved') {
      wx.showToast({ title: '需要通过审核才能进入群聊', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/chat/index?activityId=${activityId}`,
    });
  },

  /**
   * 微信原生分享 - Requirements: 17.1, 17.2, 17.3, 17.4
   */
  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { activity } = this.data;
    if (!activity) {
      return {
        title: '聚场活动',
        path: `/subpackages/activity/detail/index?id=${this.data.activityId}`,
      };
    }

    // 计算空位数
    const vacancy = (activity.maxParticipants || 0) - (activity.currentParticipants || 0);
    const vacancyText = vacancy > 0 ? `还缺${vacancy}人` : '已满员';

    return {
      title: `${activity.title} | ${vacancyText}`,
      path: `/subpackages/activity/detail/index?id=${this.data.activityId}`,
      imageUrl: activity.images?.[0] || '',
    };
  },

  onRefresh() {
    if (this.data.activityId) {
      this.loadActivityDetail(this.data.activityId);
    }
  },

  getDisplayAddress(): string {
    const { activity, participantStatus, isCreator } = this.data;
    if (!activity) return '';

    if (isCreator || participantStatus === 'approved') {
      return activity.address || activity.locationName || '';
    }

    if (activity.isLocationBlurred) {
      return activity.locationHint || '位置待定';
    }

    return activity.address || activity.locationName || '';
  },
});
