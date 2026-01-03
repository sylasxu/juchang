/**
 * Chat Stream 组件
 * Requirements: 1.4, 3.1, 15.16
 * 
 * Chat-First 架构的对话流容器
 * - 无限滚动容器
 * - 用户消息（右侧对齐）和 AI 消息（左侧对齐）
 * - 新消息自动滚动到底部
 * - 新消息"上浮 + 淡入"组合动画
 */

// 滚动防抖定时器（模块级变量）
let scrollTimer: number | null = null;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  messageType: 'text' | 'widget_dashboard' | 'widget_draft' | 'widget_share' | 'widget_explore' | 'widget_error' | 'widget_ask_preference';
  content: string | object;
  createdAt: string;
  isNew?: boolean; // 标记是否为新消息，用于动画
}

interface ComponentData {
  scrollToView: string;
  scrollTop: number;
  isScrolling: boolean;
}

Component({
  options: {
    styleIsolation: 'apply-shared',
    virtualHost: true,
  },

  properties: {
    // 消息列表
    messages: {
      type: Array,
      value: [] as ChatMessage[],
    },
    // 是否正在加载
    loading: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    scrollToView: '',
    scrollTop: 0,
    isScrolling: false,
  } as ComponentData,

  observers: {
    /**
     * 监听消息列表变化
     * Requirements: 1.4 - 新消息自动滚动到底部
     */
    'messages': function(messages: ChatMessage[]) {
      if (messages && messages.length > 0) {
        // 延迟滚动，等待 DOM 更新
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      }
    },
  },

  lifetimes: {
    attached() {
      // 初始滚动到底部
      this.scrollToBottom();
    },
    detached() {
      // 清理定时器
      if (scrollTimer !== null) {
        clearTimeout(scrollTimer);
        scrollTimer = null;
      }
    },
  },

  methods: {
    /**
     * 滚动到底部
     * Requirements: 1.4
     */
    scrollToBottom() {
      const messages = this.data.messages as ChatMessage[];
      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        this.setData({
          scrollToView: `msg-${lastMessage.id}`,
        });
      }
    },

    /**
     * 滚动事件处理
     */
    onScroll(e: WechatMiniprogram.ScrollViewScroll) {
      this.setData({
        scrollTop: e.detail.scrollTop,
        isScrolling: true,
      });
      
      // 防抖：滚动停止后重置状态
      if (scrollTimer !== null) {
        clearTimeout(scrollTimer);
      }
      scrollTimer = Number(setTimeout(() => {
        this.setData({ isScrolling: false });
      }, 150));
      
      this.triggerEvent('scroll', e.detail);
    },

    /**
     * 滚动到顶部事件
     */
    onScrollToUpper() {
      this.triggerEvent('loadmore');
    },

    /**
     * 点击消息
     */
    onMessageTap(e: WechatMiniprogram.TouchEvent) {
      const { id, index } = e.currentTarget.dataset;
      const messages = this.data.messages as ChatMessage[];
      const message = messages ? messages[index] : null;
      
      if (message) {
        this.triggerEvent('messagetap', { id, message, index });
      }
    },

    /**
     * Widget 操作事件
     */
    onWidgetAction(e: WechatMiniprogram.CustomEvent) {
      this.triggerEvent('widgetaction', e.detail);
    },

    /**
     * 获取消息动画类名
     * Requirements: 15.16 - 新消息"上浮 + 淡入"组合动画
     */
    getMessageAnimationClass(message: ChatMessage, index: number): string {
      const messages = this.data.messages as ChatMessage[];
      // 最后 3 条消息使用入场动画
      if (messages && index >= messages.length - 3) {
        return 'slide-up-fade-in';
      }
      return '';
    },
  },
});
