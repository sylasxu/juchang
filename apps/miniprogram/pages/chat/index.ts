/**
 * 群聊页面
 * Requirements: 9.1, 9.2, 9.3, 9.4
 * - 显示活动信息头部和消息列表
 * - 发送文本消息
 * - WebSocket 实时接收消息
 * - 活动结束后标记为"已归档"
 */
import { getChatMessages, postChatMessages } from '../../src/api/endpoints/chat/chat';
import { getActivitiesById } from '../../src/api/endpoints/activities/activities';
import type { GetChatMessagesParams } from '../../src/api/model';

// ==================== 类型定义 ====================

/** 消息类型 */
interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  createdAt: string;
  /** 是否是自己发送的 */
  isSelf: boolean;
}

/** 活动信息 */
interface ActivityInfo {
  id: string;
  title: string;
  image?: string;
  startAt: string;
  endAt?: string;
  locationName: string;
  status: string;
  isArchived: boolean;
  participantCount: number;
}

/** 页面数据 */
interface PageData {
  /** 活动 ID */
  activityId: string;
  /** 活动信息 */
  activity: ActivityInfo | null;
  /** 消息列表 */
  messages: ChatMessage[];
  /** 输入框内容 */
  inputValue: string;
  /** 滚动锚点 */
  scrollToMessage: string;
  /** 键盘高度 */
  keyboardHeight: number;
  /** 加载状态 */
  loading: boolean;
  /** 是否正在发送 */
  sending: boolean;
  /** 当前用户 ID */
  currentUserId: string;
  /** 是否有更多历史消息 */
  hasMore: boolean;
  /** 分页游标 */
  cursor: string;
}

/** App 实例类型 */
interface AppInstance {
  globalData: {
    socket?: WechatMiniprogram.SocketTask;
    userInfo?: {
      id: string;
      nickname: string;
      avatarUrl: string;
    };
  };
}

/** WebSocket 消息类型 */
interface SocketMessage {
  type: 'message' | 'typing' | 'read';
  data: {
    activityId: string;
    message?: {
      id: string;
      content: string;
      senderId: string;
      senderName: string;
      senderAvatar: string;
      createdAt: string;
    };
  };
}

/** 页面参数 */
interface PageOptions {
  activityId?: string;
}

const app = getApp<AppInstance>();

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    activityId: '',
    activity: null,
    messages: [],
    inputValue: '',
    scrollToMessage: '',
    keyboardHeight: 0,
    loading: true,
    sending: false,
    currentUserId: '',
    hasMore: true,
    cursor: '',
  },

  onLoad(options: PageOptions) {
    const { activityId } = options;
    if (!activityId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }

    const currentUserId = app.globalData.userInfo?.id || wx.getStorageSync('userId') || '';

    this.setData({
      activityId,
      currentUserId,
    });

    this.loadActivityInfo();
    this.loadMessages();
    this.setupWebSocket();
  },

  onUnload() {
    // 清理 WebSocket 监听
  },

  // ==================== 数据加载 ====================

  /** 加载活动信息 (Requirements: 9.1) */
  async loadActivityInfo() {
    try {
      const response = await getActivitiesById(this.data.activityId);
      if (response.status === 200) {
        const data = response.data as {
          id: string;
          title: string;
          images?: string[];
          startAt: string;
          endAt?: string;
          locationName: string;
          status: string;
          participantCount?: number;
        };

        const activity: ActivityInfo = {
          id: data.id,
          title: data.title,
          image: data.images?.[0],
          startAt: data.startAt,
          endAt: data.endAt,
          locationName: data.locationName,
          status: data.status,
          isArchived: data.status === 'completed' || data.status === 'cancelled',
          participantCount: data.participantCount || 0,
        };

        this.setData({ activity });

        // 设置导航栏标题
        wx.setNavigationBarTitle({ title: activity.title });
      }
    } catch (error) {
      console.error('加载活动信息失败', error);
    }
  },

  /** 加载消息列表 (Requirements: 9.1) */
  async loadMessages(loadMore = false) {
    if (!loadMore) {
      this.setData({ loading: true });
    }

    try {
      const params: GetChatMessagesParams = {
        activityId: this.data.activityId,
        limit: 20,
      };

      // 使用 before 参数进行分页
      if (loadMore && this.data.cursor) {
        params.before = this.data.cursor;
      }

      const response = await getChatMessages(params);

      if (response.status === 200) {
        const data = response.data as {
          messages: Array<{
            id: string;
            content: string;
            senderId: string;
            senderName: string;
            senderAvatar: string;
            createdAt: string;
          }>;
          cursor?: string;
          hasMore?: boolean;
        };

        const newMessages: ChatMessage[] = (data.messages || []).map((msg) => ({
          ...msg,
          isSelf: msg.senderId === this.data.currentUserId,
        }));

        const messages = loadMore ? [...newMessages, ...this.data.messages] : newMessages;

        this.setData({
          messages,
          cursor: data.cursor || '',
          hasMore: data.hasMore ?? false,
          loading: false,
        });

        // 滚动到底部
        if (!loadMore && messages.length > 0) {
          this.scrollToBottom();
        }
      }
    } catch (error) {
      console.error('加载消息失败', error);
      this.setData({ loading: false });
    }
  },

  // ==================== WebSocket ====================

  /** 设置 WebSocket 监听 (Requirements: 9.3) */
  setupWebSocket() {
    const socket = app.globalData?.socket;
    if (!socket) return;

    socket.onMessage((result) => {
      try {
        const data = JSON.parse(result.data as string) as SocketMessage;

        if (data.type === 'message' && data.data.activityId === this.data.activityId && data.data.message) {
          this.handleNewMessage(data.data.message);
        }
      } catch (error) {
        console.error('解析 WebSocket 消息失败', error);
      }
    });
  },

  /** 处理新消息 */
  handleNewMessage(message: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    createdAt: string;
  }) {
    const newMessage: ChatMessage = {
      ...message,
      isSelf: message.senderId === this.data.currentUserId,
    };

    const messages = [...this.data.messages, newMessage];
    this.setData({ messages });
    this.scrollToBottom();
  },

  // ==================== 事件处理 ====================

  /** 输入框内容变化 */
  onInputChange(e: WechatMiniprogram.Input) {
    this.setData({ inputValue: e.detail.value });
  },

  /** 键盘高度变化 */
  onKeyboardHeightChange(e: WechatMiniprogram.CustomEvent<{ height: number }>) {
    const { height } = e.detail;
    this.setData({ keyboardHeight: height });

    if (height > 0) {
      this.scrollToBottom();
    }
  },

  /** 输入框失焦 */
  onInputBlur() {
    this.setData({ keyboardHeight: 0 });
  },

  /** 发送消息 (Requirements: 9.2) */
  async onSendMessage() {
    const { inputValue, activityId, sending, activity } = this.data;

    if (!inputValue.trim() || sending) return;

    // 检查是否已归档 (Requirements: 9.4)
    if (activity?.isArchived) {
      wx.showToast({ title: '群聊已归档', icon: 'none' });
      return;
    }

    this.setData({ sending: true });

    try {
      const response = await postChatMessages({
        activityId,
        type: 'text',
        content: inputValue.trim(),
      });

      if (response.status === 200) {
        // 清空输入框
        this.setData({ inputValue: '' });

        // 消息会通过 WebSocket 推送回来，这里不需要手动添加
        // 但为了更好的用户体验，可以先本地添加
        const userInfo = app.globalData.userInfo;
        const localMessage: ChatMessage = {
          id: `local_${Date.now()}`,
          content: inputValue.trim(),
          senderId: this.data.currentUserId,
          senderName: userInfo?.nickname || '我',
          senderAvatar: userInfo?.avatarUrl || '',
          createdAt: new Date().toISOString(),
          isSelf: true,
        };

        const messages = [...this.data.messages, localMessage];
        this.setData({ messages });
        this.scrollToBottom();
      } else {
        const errorData = response.data as { msg?: string };
        throw new Error(errorData?.msg || '发送失败');
      }
    } catch (error) {
      console.error('发送消息失败', error);
      wx.showToast({
        title: (error as Error).message || '发送失败',
        icon: 'none',
      });
    } finally {
      this.setData({ sending: false });
    }
  },

  /** 加载更多历史消息 */
  onLoadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMessages(true);
    }
  },

  /** 点击活动头部，跳转到活动详情 */
  onActivityTap() {
    wx.navigateTo({
      url: `/subpackages/activity/detail/index?id=${this.data.activityId}`,
    });
  },

  // ==================== 辅助方法 ====================

  /** 滚动到底部 */
  scrollToBottom() {
    const { messages } = this.data;
    if (messages.length > 0) {
      this.setData({
        scrollToMessage: `msg-${messages[messages.length - 1].id}`,
      });
    }
  },

  /** 格式化时间 */
  formatTime(dateStr: string): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  /** 格式化日期分隔 */
  formatDateSeparator(dateStr: string): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return '今天';
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }

    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },
});
