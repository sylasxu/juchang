/**
 * 消息中心页面
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * - 显示系统通知区域和群聊列表区域
 * - 申请通知、履约通知、申诉按钮
 * - 未读消息角标
 */
import { getChatMyChats } from '../../src/api/endpoints/chat/chat';
import { postParticipantsDispute } from '../../src/api/endpoints/participants/participants';

// ==================== 类型定义 ====================

/** 系统通知类型 */
type NotificationType = 'join_request' | 'join_approved' | 'join_rejected' | 'fulfillment' | 'no_show' | 'dispute';

/** 系统通知 */
interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  activityId: string;
  activityTitle: string;
  participantId?: string;
  read: boolean;
  createdAt: string;
  /** 是否可申诉（仅 no_show 类型） */
  canDispute?: boolean;
}

/** 群聊项 */
interface ChatItem {
  activityId: string;
  activityTitle: string;
  activityImage?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isArchived: boolean;
  participantCount: number;
}

/** 页面数据 */
interface PageData {
  /** 系统通知列表 */
  notifications: SystemNotification[];
  /** 群聊列表 */
  chatList: ChatItem[];
  /** 加载状态 */
  loading: boolean;
  /** 通知区域是否展开 */
  notificationExpanded: boolean;
  /** 未读通知数量 */
  unreadNotificationCount: number;
  /** 未读消息总数 */
  totalUnreadCount: number;
  /** 是否正在申诉 */
  isDisputing: boolean;
}

/** App 实例类型 */
interface AppInstance {
  globalData: {
    socket?: WechatMiniprogram.SocketTask;
  };
  setUnreadNum?: (num: number) => void;
}

/** WebSocket 消息类型 */
interface SocketMessage {
  type: 'message' | 'notification';
  data: {
    activityId?: string;
    message?: {
      id: string;
      content: string;
      senderId: string;
      createdAt: string;
    };
    notification?: SystemNotification;
  };
}

const app = getApp<AppInstance>();

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    notifications: [],
    chatList: [],
    loading: true,
    notificationExpanded: true,
    unreadNotificationCount: 0,
    totalUnreadCount: 0,
    isDisputing: false,
  },

  onLoad() {
    this.loadData();
    this.setupWebSocket();
  },

  onShow() {
    // 更新 TabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'message' });
    }
    // 刷新数据
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // ==================== 数据加载 ====================

  async loadData(): Promise<void> {
    this.setData({ loading: true });

    try {
      // 并行加载通知和群聊
      const [notificationsResult, chatsResult] = await Promise.all([
        this.loadNotifications(),
        this.loadChatList(),
      ]);

      const unreadNotificationCount = notificationsResult.filter((n) => !n.read).length;
      const unreadChatCount = chatsResult.reduce((sum, chat) => sum + chat.unreadCount, 0);
      const totalUnreadCount = unreadNotificationCount + unreadChatCount;

      this.setData({
        notifications: notificationsResult,
        chatList: chatsResult,
        unreadNotificationCount,
        totalUnreadCount,
        loading: false,
      });

      // 更新 TabBar 角标 (Requirements: 8.5)
      app.setUnreadNum?.(totalUnreadCount);
    } catch (error) {
      console.error('加载消息数据失败', error);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  /** 加载系统通知 (Requirements: 8.1, 8.2, 8.3) */
  async loadNotifications(): Promise<SystemNotification[]> {
    // TODO: 替换为真实 API 调用
    // 目前使用模拟数据，等后端实现通知 API 后替换
    return [
      {
        id: '1',
        type: 'join_request',
        title: '新的报名申请',
        content: '小明 申请加入你的「周末羽毛球」活动',
        activityId: 'act_001',
        activityTitle: '周末羽毛球',
        participantId: 'user_001',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'no_show',
        title: '履约提醒',
        content: '你在「周五桌游局」被标记为未到场',
        activityId: 'act_002',
        activityTitle: '周五桌游局',
        participantId: 'part_001',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        canDispute: true,
      },
    ];
  },

  /** 加载群聊列表 (Requirements: 8.4) */
  async loadChatList(): Promise<ChatItem[]> {
    try {
      const response = await getChatMyChats();
      if (response.status === 200 && Array.isArray(response.data)) {
        return (response.data as ChatItem[]).map((chat) => ({
          activityId: chat.activityId,
          activityTitle: chat.activityTitle,
          activityImage: chat.activityImage,
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.lastMessageTime,
          unreadCount: chat.unreadCount || 0,
          isArchived: chat.isArchived || false,
          participantCount: chat.participantCount || 0,
        }));
      }
      return [];
    } catch (error) {
      console.error('加载群聊列表失败', error);
      return [];
    }
  },

  // ==================== WebSocket ====================

  setupWebSocket() {
    const socket = app.globalData?.socket;
    if (!socket) return;

    socket.onMessage((result) => {
      try {
        const data = JSON.parse(result.data as string) as SocketMessage;

        if (data.type === 'message' && data.data.activityId) {
          this.handleNewMessage(data.data.activityId, data.data.message);
        } else if (data.type === 'notification' && data.data.notification) {
          this.handleNewNotification(data.data.notification);
        }
      } catch (error) {
        console.error('解析 WebSocket 消息失败', error);
      }
    });
  },

  handleNewMessage(activityId: string, message?: { content: string; createdAt: string }) {
    if (!message) return;

    const chatList = [...this.data.chatList];
    const chatIndex = chatList.findIndex((c) => c.activityId === activityId);

    if (chatIndex >= 0) {
      const chat = chatList[chatIndex];
      chat.lastMessage = message.content;
      chat.lastMessageTime = message.createdAt;
      chat.unreadCount += 1;

      // 将有新消息的群聊移到顶部
      chatList.splice(chatIndex, 1);
      chatList.unshift(chat);

      const totalUnreadCount = this.data.unreadNotificationCount + chatList.reduce((sum, c) => sum + c.unreadCount, 0);

      this.setData({ chatList, totalUnreadCount });
      app.setUnreadNum?.(totalUnreadCount);
    }
  },

  handleNewNotification(notification: SystemNotification) {
    const notifications = [notification, ...this.data.notifications];
    const unreadNotificationCount = notifications.filter((n) => !n.read).length;
    const unreadChatCount = this.data.chatList.reduce((sum, c) => sum + c.unreadCount, 0);
    const totalUnreadCount = unreadNotificationCount + unreadChatCount;

    this.setData({
      notifications,
      unreadNotificationCount,
      totalUnreadCount,
    });
    app.setUnreadNum?.(totalUnreadCount);
  },

  // ==================== 事件处理 ====================

  /** 切换通知区域展开/收起 */
  toggleNotificationExpand() {
    this.setData({
      notificationExpanded: !this.data.notificationExpanded,
    });
  },

  /** 点击通知项 */
  onNotificationTap(e: WechatMiniprogram.TouchEvent) {
    const { id, type, activityId, participantId } = e.currentTarget.dataset as {
      id: string;
      type: NotificationType;
      activityId: string;
      participantId?: string;
    };

    // 标记为已读
    this.markNotificationRead(id);

    // 根据通知类型跳转
    switch (type) {
      case 'join_request':
        // 跳转到活动详情页的申请列表
        wx.navigateTo({
          url: `/subpackages/activity/detail/index?id=${activityId}&tab=requests`,
        });
        break;
      case 'join_approved':
      case 'join_rejected':
      case 'fulfillment':
        // 跳转到活动详情页
        wx.navigateTo({
          url: `/subpackages/activity/detail/index?id=${activityId}`,
        });
        break;
      case 'no_show':
        // 显示申诉选项
        this.showDisputeConfirm(activityId, participantId || '');
        break;
      default:
        break;
    }
  },

  markNotificationRead(notificationId: string) {
    const notifications = this.data.notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
    const unreadNotificationCount = notifications.filter((n) => !n.read).length;
    const unreadChatCount = this.data.chatList.reduce((sum, c) => sum + c.unreadCount, 0);
    const totalUnreadCount = unreadNotificationCount + unreadChatCount;

    this.setData({
      notifications,
      unreadNotificationCount,
      totalUnreadCount,
    });
    app.setUnreadNum?.(totalUnreadCount);
  },

  /** 申诉按钮点击 (Requirements: 8.3, 11.1, 11.2) */
  onDisputeTap(e: WechatMiniprogram.TouchEvent) {
    const { activityId, participantId } = e.currentTarget.dataset as {
      activityId: string;
      participantId: string;
    };

    // 阻止事件冒泡
    e.stopPropagation?.();

    this.showDisputeConfirm(activityId, participantId);
  },

  showDisputeConfirm(activityId: string, participantId: string) {
    wx.showModal({
      title: '申诉确认',
      content: '确定要申诉"未到场"标记吗？申诉后状态将变为"争议中"，系统将暂不扣除你的靠谱度。',
      confirmText: '我到场了',
      confirmColor: '#FF6B35',
      success: (res) => {
        if (res.confirm) {
          this.submitDispute(activityId, participantId);
        }
      },
    });
  },

  async submitDispute(activityId: string, participantId: string) {
    if (this.data.isDisputing) return;

    this.setData({ isDisputing: true });

    try {
      const response = await postParticipantsDispute({
        activityId,
        participantId,
      });

      if (response.status === 200) {
        wx.showToast({ title: '申诉已提交', icon: 'success' });

        // 更新通知状态
        const notifications = this.data.notifications.map((n) =>
          n.activityId === activityId && n.type === 'no_show' ? { ...n, canDispute: false, read: true } : n
        );
        this.setData({ notifications });
      } else {
        const errorData = response.data as { msg?: string };
        throw new Error(errorData?.msg || '申诉失败');
      }
    } catch (error) {
      console.error('申诉失败', error);
      wx.showToast({
        title: (error as Error).message || '申诉失败',
        icon: 'none',
      });
    } finally {
      this.setData({ isDisputing: false });
    }
  },

  /** 点击群聊项 (Requirements: 8.4) */
  onChatTap(e: WechatMiniprogram.TouchEvent) {
    const { activityId } = e.currentTarget.dataset as { activityId: string };

    // 清除该群聊的未读数
    const chatList = this.data.chatList.map((c) => (c.activityId === activityId ? { ...c, unreadCount: 0 } : c));
    const unreadChatCount = chatList.reduce((sum, c) => sum + c.unreadCount, 0);
    const totalUnreadCount = this.data.unreadNotificationCount + unreadChatCount;

    this.setData({ chatList, totalUnreadCount });
    app.setUnreadNum?.(totalUnreadCount);

    // 跳转到群聊页面
    wx.navigateTo({
      url: `/pages/chat/index?activityId=${activityId}`,
    });
  },

  // ==================== 辅助方法 ====================

  /** 格式化时间 */
  formatTime(dateStr: string): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // 1分钟内
    if (diff < 60000) {
      return '刚刚';
    }
    // 1小时内
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }
    // 今天
    if (date.toDateString() === now.toDateString()) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    // 更早
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },

  /** 获取通知图标 */
  getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      join_request: 'user-add',
      join_approved: 'check-circle',
      join_rejected: 'close-circle',
      fulfillment: 'calendar',
      no_show: 'error-circle',
      dispute: 'info-circle',
    };
    return icons[type] || 'notification';
  },
});
