/**
 * 履约确认页面
 * Requirements: 10.1, 10.2, 10.3, 10.4
 * - 活动结束后发起人确认参与者到场情况
 * - 显示参与者列表（默认全选已到场）
 * - 标记未到场警告提示
 * - 调用履约确认API
 */
import { getParticipantsActivityById, postParticipantsConfirmFulfillment } from '../../../src/api/endpoints/participants/participants';
import { getActivitiesById } from '../../../src/api/endpoints/activities/activities';
import type { ParticipantFulfillmentRequestParticipantsItem } from '../../../src/api/model';

// ==================== 类型定义 ====================

/** 参与者信息 */
interface Participant {
  id: string;
  oderId: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
  reliabilityRate: number;
  status: string;
  /** 是否已到场（用于UI选择） */
  fulfilled: boolean;
  /** 是否是 Fast Pass 用户 */
  isFastPass: boolean;
}

/** 活动信息 */
interface ActivityInfo {
  id: string;
  title: string;
  startAt: string;
  endAt?: string;
  locationName: string;
  status: string;
}

/** 页面数据 */
interface PageData {
  /** 活动 ID */
  activityId: string;
  /** 活动信息 */
  activity: ActivityInfo | null;
  /** 参与者列表 */
  participants: Participant[];
  /** 加载状态 */
  loading: boolean;
  /** 提交状态 */
  submitting: boolean;
  /** 未到场人数 */
  noShowCount: number;
  /** 是否显示警告弹窗 */
  showWarningDialog: boolean;
  /** 当前操作的参与者 */
  currentParticipant: Participant | null;
}

/** 页面参数 */
interface PageOptions {
  id?: string;
}

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    activityId: '',
    activity: null,
    participants: [],
    loading: true,
    submitting: false,
    noShowCount: 0,
    showWarningDialog: false,
    currentParticipant: null,
  },

  onLoad(options: PageOptions) {
    const { id } = options;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }

    this.setData({ activityId: id });
    this.loadData();
  },

  // ==================== 数据加载 ====================

  async loadData() {
    this.setData({ loading: true });

    try {
      const [activityResult, participantsResult] = await Promise.all([
        this.loadActivityInfo(),
        this.loadParticipants(),
      ]);

      this.setData({
        activity: activityResult,
        participants: participantsResult,
        loading: false,
      });
    } catch (error) {
      console.error('加载数据失败', error);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  /** 加载活动信息 */
  async loadActivityInfo(): Promise<ActivityInfo | null> {
    try {
      const response = await getActivitiesById(this.data.activityId);
      if (response.status === 200) {
        const data = response.data as {
          id: string;
          title: string;
          startAt: string;
          endAt?: string;
          locationName: string;
          status: string;
        };
        return {
          id: data.id,
          title: data.title,
          startAt: data.startAt,
          endAt: data.endAt,
          locationName: data.locationName,
          status: data.status,
        };
      }
      return null;
    } catch (error) {
      console.error('加载活动信息失败', error);
      return null;
    }
  },

  /** 加载参与者列表 (Requirements: 10.2) */
  async loadParticipants(): Promise<Participant[]> {
    try {
      const response = await getParticipantsActivityById(this.data.activityId);
      if (response.status === 200 && Array.isArray(response.data)) {
        // 只显示已通过审批的参与者
        return (response.data as Array<{
          id: string;
          oderId?: string;
          userId: string;
          status: string;
          isFastPass: boolean;
          user: {
            id: string;
            nickname: string;
            avatarUrl?: string;
            reliabilityRate?: number;
          };
        }>)
          .filter((p) => p.status === 'approved' || p.status === 'confirmed')
          .map((p) => ({
            id: p.id,
            oderId: p.oderId || p.id,
            userId: p.userId,
            nickname: p.user?.nickname || '未知用户',
            avatarUrl: p.user?.avatarUrl || '',
            reliabilityRate: p.user?.reliabilityRate || 0,
            status: p.status,
            fulfilled: true, // 默认全选已到场 (Requirements: 10.2)
            isFastPass: p.isFastPass,
          }));
      }
      return [];
    } catch (error) {
      console.error('加载参与者列表失败', error);
      return [];
    }
  },

  // ==================== 事件处理 ====================

  /** 切换参与者到场状态 */
  onToggleFulfilled(e: WechatMiniprogram.TouchEvent) {
    const { index } = e.currentTarget.dataset as { index: number };
    const participant = this.data.participants[index];

    if (!participant) return;

    // 如果要标记为未到场，显示警告 (Requirements: 10.3)
    if (participant.fulfilled) {
      this.setData({
        showWarningDialog: true,
        currentParticipant: participant,
      });
    } else {
      // 恢复为已到场
      this.updateParticipantStatus(index, true);
    }
  },

  /** 确认标记未到场 */
  onConfirmNoShow() {
    const { currentParticipant, participants } = this.data;
    if (!currentParticipant) return;

    const index = participants.findIndex((p) => p.id === currentParticipant.id);
    if (index >= 0) {
      this.updateParticipantStatus(index, false);
    }

    this.setData({
      showWarningDialog: false,
      currentParticipant: null,
    });
  },

  /** 取消标记未到场 */
  onCancelNoShow() {
    this.setData({
      showWarningDialog: false,
      currentParticipant: null,
    });
  },

  /** 更新参与者状态 */
  updateParticipantStatus(index: number, fulfilled: boolean) {
    const participants = [...this.data.participants];
    participants[index] = { ...participants[index], fulfilled };

    const noShowCount = participants.filter((p) => !p.fulfilled).length;

    this.setData({ participants, noShowCount });
  },

  /** 全选已到场 */
  onSelectAll() {
    const participants = this.data.participants.map((p) => ({
      ...p,
      fulfilled: true,
    }));
    this.setData({ participants, noShowCount: 0 });
  },

  /** 提交履约确认 (Requirements: 10.4) */
  async onSubmit() {
    const { activityId, participants, submitting, noShowCount } = this.data;

    if (submitting) return;

    // 如果有未到场的人，再次确认
    if (noShowCount > 0) {
      wx.showModal({
        title: '确认提交',
        content: `您标记了 ${noShowCount} 人未到场，确认提交吗？\n\n注意：标记他人未到场将扣除你 1% 靠谱度`,
        confirmText: '确认提交',
        confirmColor: '#FF6B35',
        success: (res) => {
          if (res.confirm) {
            this.submitFulfillment();
          }
        },
      });
    } else {
      this.submitFulfillment();
    }
  },

  async submitFulfillment() {
    const { activityId, participants } = this.data;

    this.setData({ submitting: true });

    try {
      const fulfillmentData: ParticipantFulfillmentRequestParticipantsItem[] = participants.map((p) => ({
        userId: p.userId,
        fulfilled: p.fulfilled,
      }));

      const response = await postParticipantsConfirmFulfillment({
        activityId,
        participants: fulfillmentData,
      });

      if (response.status === 200) {
        wx.showToast({ title: '确认成功', icon: 'success' });

        // 延迟返回
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        const errorData = response.data as { msg?: string };
        throw new Error(errorData?.msg || '提交失败');
      }
    } catch (error) {
      console.error('提交履约确认失败', error);
      wx.showToast({
        title: (error as Error).message || '提交失败',
        icon: 'none',
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // ==================== 辅助方法 ====================

  /** 格式化时间 */
  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  },

  /** 格式化靠谱度 */
  formatReliability(rate: number): string {
    return `${Math.round(rate)}%`;
  },
});
