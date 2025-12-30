/**
 * 活动详情页
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 10.1-10.7, 16.1-16.6
 */
import { getActivitiesById, postActivitiesByIdJoin, deleteActivitiesById, patchActivitiesByIdStatus } from '../../../src/api/endpoints/activities/activities';
import { getUsersById } from '../../../src/api/endpoints/users/users';
import { useAppStore } from '../../../src/stores/app';
import type { ActivityDetailResponse } from '../../../src/api/model';

interface User {
  id: string;
  nickname?: string;
  avatarUrl?: string;
  phoneNumber?: string;
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
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  minReliabilityRate?: number;
  creatorId: string;
  creator?: User;
  participants?: Participant[];
  isPinPlus?: boolean;
  isBoosted?: boolean;
}

interface ManageAction {
  label: string;
  value: string;
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
  // 管理操作面板
  showManageSheet: boolean;
  manageActions: ManageAction[];
  // Auth sheet
  isAuthSheetVisible: boolean;
  pendingAction: 'join' | null;
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
    // 管理操作面板
    showManageSheet: false,
    manageActions: [],
    // Auth sheet
    isAuthSheetVisible: false,
    pendingAction: null,
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
    
    // 订阅 auth sheet 状态
    this.unsubscribeAppStore = useAppStore.subscribe((state) => {
      if (this.data.isAuthSheetVisible !== state.isAuthSheetVisible) {
        this.setData({ isAuthSheetVisible: state.isAuthSheetVisible });
      }
    });
  },
  
  onUnload() {
    // 取消订阅
    if (this.unsubscribeAppStore) {
      this.unsubscribeAppStore();
    }
  },
  
  // Store 订阅取消函数
  unsubscribeAppStore: null as (() => void) | null,

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

  async loadCurrentUser(): Promise<void> {
    const token = wx.getStorageSync('token');
    const cachedUserInfo = wx.getStorageSync('userInfo') as { id?: string } | null;
    if (!token || !cachedUserInfo?.id) return;

    try {
      const response = await getUsersById(cachedUserInfo.id);
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
    
    // CP-9: 未绑定手机号的用户不能报名活动
    if (!currentUser?.phoneNumber) {
      this.setData({ pendingAction: 'join' });
      useAppStore.getState().showAuthSheet({ type: 'join' });
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
  
  /** 手机号绑定成功回调 */
  onAuthSuccess() {
    useAppStore.getState().hideAuthSheet();
    // 重新加载用户信息
    this.loadCurrentUser().then(() => {
      // 如果有待执行的操作，继续执行
      if (this.data.pendingAction === 'join') {
        this.setData({ pendingAction: null, showJoinDialog: true });
      }
    });
  },
  
  /** 关闭 auth sheet */
  onAuthClose() {
    useAppStore.getState().hideAuthSheet();
    this.setData({ pendingAction: null });
  },
  
  /** 打开活动管理面板 - Requirements: 16.1-16.6 */
  onManageActivity() {
    const { activity } = this.data;
    if (!activity) return;
    
    const actions: ManageAction[] = [];
    
    // 根据活动状态显示不同操作
    if (activity.status === 'active') {
      actions.push({ label: '编辑活动', value: 'edit' });
      actions.push({ label: '查看报名列表', value: 'participants' });
      
      // 只有未开始的活动可以取消
      const startAt = activity.startAt ? new Date(activity.startAt) : null;
      if (startAt && startAt > new Date()) {
        actions.push({ label: '取消活动', value: 'cancel' });
      }
      
      // 已开始的活动可以标记完成
      if (startAt && startAt <= new Date()) {
        actions.push({ label: '标记完成', value: 'complete' });
      }
    } else if (activity.status === 'draft') {
      actions.push({ label: '编辑活动', value: 'edit' });
      actions.push({ label: '删除草稿', value: 'delete' });
    }
    
    this.setData({
      showManageSheet: true,
      manageActions: actions,
    });
  },
  
  /** 管理操作选择 */
  onManageActionSelect(e: WechatMiniprogram.CustomEvent<{ selected: ManageAction }>) {
    const { value } = e.detail.selected;
    this.setData({ showManageSheet: false });
    
    switch (value) {
      case 'edit':
        this.onEditActivity();
        break;
      case 'participants':
        this.onViewParticipants();
        break;
      case 'cancel':
        this.onCancelActivity();
        break;
      case 'complete':
        this.onCompleteActivity();
        break;
      case 'delete':
        this.onDeleteActivity();
        break;
    }
  },
  
  /** 关闭管理面板 */
  onManageSheetClose() {
    this.setData({ showManageSheet: false });
  },
  
  /** 编辑活动 */
  onEditActivity() {
    const { activityId } = this.data;
    wx.navigateTo({
      url: `/subpackages/activity/confirm/index?id=${activityId}&mode=edit`,
    });
  },
  
  /** 查看报名列表 */
  onViewParticipants() {
    const { activityId } = this.data;
    wx.navigateTo({
      url: `/subpackages/activity/participants/index?id=${activityId}`,
    });
  },
  
  /** 取消活动 - CP-5: 只有活动创建者可以更新状态 */
  onCancelActivity() {
    wx.showModal({
      title: '确认取消',
      content: '取消后活动将不再显示，已报名的用户会收到通知',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            const response = await patchActivitiesByIdStatus(this.data.activityId, {
              status: 'cancelled',
            });
            if (response.status === 200) {
              wx.showToast({ title: '活动已取消', icon: 'success' });
              this.loadActivityDetail(this.data.activityId);
            } else {
              throw new Error((response.data as { msg?: string })?.msg || '操作失败');
            }
          } catch (error) {
            wx.showToast({ title: (error as Error).message || '操作失败', icon: 'none' });
          }
        }
      },
    });
  },
  
  /** 标记活动完成 */
  onCompleteActivity() {
    wx.showModal({
      title: '确认完成',
      content: '标记完成后可以进行履约确认',
      success: async (res) => {
        if (res.confirm) {
          try {
            const response = await patchActivitiesByIdStatus(this.data.activityId, {
              status: 'completed',
            });
            if (response.status === 200) {
              wx.showToast({ title: '活动已完成', icon: 'success' });
              this.loadActivityDetail(this.data.activityId);
            } else {
              throw new Error((response.data as { msg?: string })?.msg || '操作失败');
            }
          } catch (error) {
            wx.showToast({ title: (error as Error).message || '操作失败', icon: 'none' });
          }
        }
      },
    });
  },
  
  /** 删除草稿 - CP-6: 只有 active 且未开始的活动可以删除 */
  onDeleteActivity() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            const response = await deleteActivitiesById(this.data.activityId);
            if (response.status === 200) {
              wx.showToast({ title: '已删除', icon: 'success' });
              setTimeout(() => {
                const pages = getCurrentPages();
                if (pages.length > 1) {
                  wx.navigateBack();
                } else {
                  wx.reLaunch({ url: '/pages/home/index' });
                }
              }, 1500);
            } else {
              throw new Error((response.data as { msg?: string })?.msg || '删除失败');
            }
          } catch (error) {
            wx.showToast({ title: (error as Error).message || '删除失败', icon: 'none' });
          }
        }
      },
    });
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
      const response = await postActivitiesByIdJoin(activityId);

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
   * 微信原生分享 - Requirements: 13.1, 13.2, 13.3, 13.4
   * 
   * 零成本方案：分享卡片不使用地图预览图，使用默认封面或纯文字
   * - 使用 AI 生成的骚气标题（如果有）
   * - 计算空位数显示在标题中
   */
  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { activity } = this.data;
    if (!activity) {
      return {
        title: '聚场 - 微信群组局神器',
        path: `/subpackages/activity/detail/index?id=${this.data.activityId}&share=1`,
      };
    }

    // 计算空位数
    const vacancy = (activity.maxParticipants || 0) - (activity.currentParticipants || 0);
    
    // 生成骚气标题 - Requirements: 13.2
    // 优先使用 AI 生成的标题，否则根据活动信息生成
    let shareTitle = '';
    if (vacancy > 0) {
      // 还有空位
      shareTitle = `🔥 ${activity.title}，${vacancy}缺1，速来！`;
    } else {
      // 已满员
      shareTitle = `🎉 ${activity.title}，已满员！`;
    }
    
    // 添加地点信息（如果有）
    if (activity.locationName) {
      shareTitle = `${shareTitle.replace('！', '')}@${activity.locationName}！`;
    }

    return {
      title: shareTitle,
      path: `/subpackages/activity/detail/index?id=${this.data.activityId}&share=1`,
      // 零成本方案：使用活动图片或默认封面，不使用地图预览图
      imageUrl: activity.images?.[0] || '',
    };
  },

  /**
   * 分享到朋友圈 - Requirements: 13.1
   */
  onShareTimeline(): WechatMiniprogram.Page.ICustomShareContent {
    const { activity } = this.data;
    if (!activity) {
      return {
        title: '聚场 - 微信群组局神器',
      };
    }

    // 计算空位数
    const vacancy = (activity.maxParticipants || 0) - (activity.currentParticipants || 0);
    const vacancyText = vacancy > 0 ? `${vacancy}缺1` : '已满员';

    return {
      title: `${activity.title} | ${vacancyText} | 聚场`,
      // 零成本方案：使用活动图片或默认封面
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
