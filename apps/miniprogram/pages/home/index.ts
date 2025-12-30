/**
 * 首页 (Chat-First 架构)
 * Requirements: 1.1, 1.2, 1.3, 1.4, 3.2
 * 
 * 三层结构：Custom_Navbar + Chat_Stream + AI_Dock
 * - 首次进入显示 Widget_Dashboard
 * - 集成 homeStore（subscribe 模式）
 * - 实现空气感渐变背景
 */
import { useHomeStore, type ChatMessage } from '../../src/stores/home'
import { useAppStore } from '../../src/stores/app'
import { useUserStore } from '../../src/stores/user'
import { sendAIChat, type ToolCall } from '../../src/utils/sse-request'
import { getWidgetTypeFromToolCall } from '../../src/utils/data-stream-parser'
import { postActivitiesByIdPublish } from '../../src/api/endpoints/activities/activities'

// 生成唯一 ID
const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

// 页面数据类型
interface PageData {
  // 消息列表
  messages: ChatMessage[]
  // 加载状态
  isLoading: boolean
  isLoadingMore: boolean
  // AI 思考状态
  aiThinkingState: 'idle' | 'thinking' | 'rendering_widget'
  thinkingText: string
  // 当前渲染的 Widget 骨架类型
  skeletonType: 'draft' | 'explore' | 'share' | null
  // 用户信息
  userNickname: string
  // 待参加活动
  upcomingActivities: any[]
  // UI 状态
  isAuthSheetVisible: boolean
  isShareGuideVisible: boolean
  shareGuideData: { activityId?: string; title?: string; mapUrl?: string } | null
  // 当前 Widget 数据（用于渲染）
  currentDraft: any | null
  currentExplore: any | null
  currentShare: any | null
  // 滚动位置
  scrollToView: string
}

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    messages: [],
    isLoading: false,
    isLoadingMore: false,
    aiThinkingState: 'idle',
    thinkingText: '',
    skeletonType: null,
    userNickname: '搭子',
    upcomingActivities: [],
    isAuthSheetVisible: false,
    isShareGuideVisible: false,
    shareGuideData: null,
    currentDraft: null,
    currentExplore: null,
    currentShare: null,
    scrollToView: '',
  },

  // Store 订阅取消函数
  unsubscribeHome: null as (() => void) | null,
  unsubscribeApp: null as (() => void) | null,
  unsubscribeUser: null as (() => void) | null,
  
  // SSE 控制器
  sseController: null as { abort: () => void } | null,

  onLoad() {
    // 订阅 homeStore
    this.subscribeHomeStore()
    // 订阅 appStore
    this.subscribeAppStore()
    // 订阅 userStore
    this.subscribeUserStore()
    // 加载消息
    this.loadMessages()
    // 加载用户信息
    this.loadUserInfo()
  },

  onShow() {
    // 刷新用户信息
    this.loadUserInfo()
  },

  onUnload() {
    // 取消订阅
    this.unsubscribeHome?.()
    this.unsubscribeApp?.()
    this.unsubscribeUser?.()
    // 中止 SSE 请求
    this.sseController?.abort()
  },

  onHide() {
    // 页面隐藏时中止 SSE 请求
    this.sseController?.abort()
  },

  /**
   * 订阅 homeStore
   * Requirements: 3.2
   */
  subscribeHomeStore() {
    const homeStore = useHomeStore.getState()
    
    // 初始化数据
    this.setData({
      messages: homeStore.messages,
      isLoading: homeStore.isLoading,
      isLoadingMore: homeStore.isLoadingMore,
    })

    // 订阅变化
    this.unsubscribeHome = useHomeStore.subscribe((state) => {
      this.setData({
        messages: state.messages,
        isLoading: state.isLoading,
        isLoadingMore: state.isLoadingMore,
      })
      
      // 新消息时滚动到底部
      if (state.messages.length > 0) {
        const lastMsg = state.messages[state.messages.length - 1]
        this.setData({ scrollToView: `msg-${lastMsg.id}` })
      }
    })
  },

  /**
   * 订阅 appStore
   */
  subscribeAppStore() {
    const appStore = useAppStore.getState()
    
    // 初始化数据
    this.setData({
      aiThinkingState: appStore.aiThinkingState,
      isAuthSheetVisible: appStore.isAuthSheetVisible,
      isShareGuideVisible: appStore.isShareGuideVisible,
      shareGuideData: appStore.shareGuideData,
    })

    // 订阅变化
    this.unsubscribeApp = useAppStore.subscribe((state) => {
      this.setData({
        aiThinkingState: state.aiThinkingState,
        isAuthSheetVisible: state.isAuthSheetVisible,
        isShareGuideVisible: state.isShareGuideVisible,
        shareGuideData: state.shareGuideData,
      })
    })
  },

  /**
   * 订阅 userStore
   */
  subscribeUserStore() {
    const userStore = useUserStore.getState()
    
    // 初始化数据
    if (userStore.user) {
      this.setData({
        userNickname: userStore.user.nickname || '搭子',
      })
    }

    // 订阅变化
    this.unsubscribeUser = useUserStore.subscribe((state) => {
      if (state.user) {
        this.setData({
          userNickname: state.user.nickname || '搭子',
        })
      }
    })
  },

  /**
   * 加载消息
   * Requirements: 3.2
   */
  async loadMessages() {
    const homeStore = useHomeStore.getState()
    await homeStore.loadMessages()
    
    // 如果没有消息，显示 Widget_Dashboard
    const messages = useHomeStore.getState().messages
    if (messages.length === 0) {
      this.showDashboard()
    }
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    const userStore = useUserStore.getState()
    if (userStore.user) {
      this.setData({
        userNickname: userStore.user.nickname || '搭子',
      })
    }
    // TODO: 加载待参加活动
  },

  /**
   * 显示 Widget_Dashboard
   * Requirements: 3.2
   */
  showDashboard() {
    const homeStore = useHomeStore.getState()
    homeStore.addAIMessage({
      role: 'assistant',
      type: 'widget_dashboard',
      content: {
        nickname: this.data.userNickname,
        activities: this.data.upcomingActivities,
      },
      activityId: null,
    })
  },

  /**
   * 加载更多消息
   */
  async onLoadMore() {
    const homeStore = useHomeStore.getState()
    await homeStore.loadMoreMessages()
  },

  // ==================== 导航栏事件 ====================

  /**
   * 新对话
   * Requirements: 2.8
   */
  async onNewChat() {
    const homeStore = useHomeStore.getState()
    await homeStore.clearMessages()
    this.showDashboard()
  },

  // ==================== AI Dock 事件 ====================

  /**
   * 用户发送消息
   * Requirements: 3.6, 5.7
   */
  async onSend(e: WechatMiniprogram.CustomEvent<{ text: string }>) {
    const { text } = e.detail
    if (!text?.trim()) return

    // 添加用户消息
    const homeStore = useHomeStore.getState()
    await homeStore.addUserMessage(text)

    // 开始 AI 解析
    this.startAIParse(text)
  },

  /**
   * AI 解析触发（防抖后）
   * Requirements: 5.8
   */
  onParse(_e: WechatMiniprogram.CustomEvent<{ text: string }>) {
    // 防抖已在 ai-dock 组件中处理
    // 这里可以做预处理，如显示输入预览
  },

  /**
   * 粘贴事件
   * Requirements: 5.5
   */
  onPaste(_e: WechatMiniprogram.CustomEvent<{ text: string }>) {
    // 粘贴后自动触发解析
  },

  // ==================== AI 解析流程 ====================

  /**
   * 开始 AI 解析
   * Requirements: 3.6, 3.7, 17.1, 17.2, 19.1, 19.2, 19.4
   */
  startAIParse(text: string) {
    const appStore = useAppStore.getState()
    const homeStore = useHomeStore.getState()

    // 设置思考状态
    appStore.setAIThinkingState('thinking')
    this.setData({ thinkingText: '正在思考...' })

    // 中止之前的请求
    this.sseController?.abort()

    // 累积的文本
    let accumulatedText = ''
    // 当前 Tool Call
    let currentToolCall: ToolCall | null = null
    // AI 消息 ID
    const aiMessageId = generateId()

    // 发起 SSE 请求
    this.sseController = sendAIChat(text, {
      onStart: () => {
        console.log('[Home] AI parse started')
      },

      onText: (chunk) => {
        accumulatedText += chunk
        
        // 如果还没有 Tool Call，显示文本消息
        if (!currentToolCall) {
          homeStore.addAIMessage({
            id: aiMessageId,
            role: 'assistant',
            type: 'text',
            content: { text: accumulatedText },
            activityId: null,
          })
        }
      },

      onToolCall: (toolCall) => {
        console.log('[Home] Tool call:', toolCall)
        currentToolCall = toolCall

        // 根据 Tool 类型显示骨架屏
        const widgetType = getWidgetTypeFromToolCall(toolCall)
        if (widgetType) {
          appStore.setAIThinkingState('rendering_widget')
          
          if (widgetType === 'widget_draft') {
            // 创建场景：显示草稿骨架屏
            this.setData({ 
              skeletonType: 'draft',
              thinkingText: '正在生成活动草稿...',
            })
          } else if (widgetType === 'widget_explore') {
            // 探索场景：显示搜索状态 → 骨架屏
            // Requirements: 19.4 - 处理 searching 事件
            this.setData({ 
              skeletonType: 'explore',
              thinkingText: '正在搜索附近活动...',
            })
          }
        }
      },

      onToolResult: (result) => {
        console.log('[Home] Tool result:', result)
        
        if (!currentToolCall) return

        const widgetType = getWidgetTypeFromToolCall(currentToolCall)
        
        if (widgetType === 'widget_draft') {
          // 创建场景：显示 Widget_Draft
          // Requirements: 3.7
          const draftData = result.result as any
          this.setData({ 
            currentDraft: draftData,
            skeletonType: null,
          })
          
          homeStore.addAIMessage({
            id: aiMessageId,
            role: 'assistant',
            type: 'widget_draft',
            content: draftData,
            activityId: draftData?.activityId || null,
          })
        } else if (widgetType === 'widget_explore') {
          // 探索场景：显示 Widget_Explore
          // Requirements: 17.1, 17.2, 19.4
          const exploreData = result.result as any
          
          // 构建 Widget_Explore 需要的数据结构
          const exploreContent = {
            results: exploreData?.results || exploreData?.activities || [],
            center: exploreData?.center || {
              lat: exploreData?.lat || 29.5647,
              lng: exploreData?.lng || 106.5507,
              name: exploreData?.locationName || '附近',
            },
            title: exploreData?.title || '',
          }
          
          this.setData({ 
            currentExplore: exploreContent,
            skeletonType: null,
          })
          
          homeStore.addAIMessage({
            id: aiMessageId,
            role: 'assistant',
            type: 'widget_explore',
            content: exploreContent,
            activityId: null,
          })
        }
      },

      onDone: (usage) => {
        console.log('[Home] AI parse done, usage:', usage)
        appStore.setAIThinkingState('idle')
        this.setData({ 
          thinkingText: '',
          skeletonType: null,
        })
        this.sseController = null

        // 如果没有 Tool Call，说明是纯文本回复
        if (!currentToolCall && accumulatedText) {
          homeStore.addAIMessage({
            id: aiMessageId,
            role: 'assistant',
            type: 'text',
            content: { text: accumulatedText },
            activityId: null,
          })
        }
      },

      onError: (error) => {
        console.error('[Home] AI parse error:', error)
        appStore.setAIThinkingState('idle')
        this.setData({ 
          thinkingText: '',
          skeletonType: null,
        })
        this.sseController = null

        // 显示 Widget_Error 带重试按钮
        homeStore.addAIMessage({
          id: aiMessageId,
          role: 'assistant',
          type: 'widget_error',
          content: { 
            message: '抱歉，我没理解你的意思，试试换个说法？',
            showRetry: true,
            originalText: text, // 保存原始文本用于重试
          },
          activityId: null,
        })

        wx.showToast({
          title: '网络有点慢，再试一次？',
          icon: 'none',
        })
      },

      onFinish: () => {
        this.sseController = null
      },
    })
  },

  // ==================== Widget 事件 ====================

  /**
   * Widget_Dashboard 活动点击
   */
  onDashboardActivityTap(e: WechatMiniprogram.CustomEvent<{ id: string }>) {
    const { id } = e.detail
    wx.navigateTo({
      url: `/subpackages/activity/detail/index?id=${id}`,
    })
  },

  /**
   * Widget_Dashboard Prompt 点击
   * Requirements: 3.5
   */
  onDashboardPromptTap(e: WechatMiniprogram.CustomEvent<{ prompt: string }>) {
    const { prompt } = e.detail
    // 设置到 AI Dock 并发送
    const aiDock = this.selectComponent('#aiDock')
    if (aiDock) {
      aiDock.setValue(prompt)
    }
    // 触发发送
    this.onSend({ detail: { text: prompt } } as any)
  },

  /**
   * Widget_Draft 确认发布
   * Requirements: 6.7, 7.1, 12.5
   */
  async onDraftConfirm(e: WechatMiniprogram.CustomEvent<{ draft: any }>) {
    const { draft } = e.detail
    
    // 检查手机号绑定
    const userStore = useUserStore.getState()
    if (!userStore.user?.phoneNumber) {
      // 显示手机号绑定弹窗
      const appStore = useAppStore.getState()
      appStore.showAuthSheet({
        type: 'publish',
        payload: { draft },
      })
      return
    }

    // 直接发布活动
    await this.publishDraftActivity(draft)
  },

  /**
   * 发布草稿活动
   * Requirements: 6.7, 7.1, 12.5
   */
  async publishDraftActivity(draft: any) {
    if (!draft?.activityId) {
      wx.showToast({ title: '活动数据异常', icon: 'none' })
      return
    }

    wx.showLoading({ title: '发布中...' })

    try {
      const response = await postActivitiesByIdPublish(draft.activityId, {})

      if (response.status === 200) {
        wx.hideLoading()
        
        // 发布成功，显示 Widget_Share
        const homeStore = useHomeStore.getState()
        const appStore = useAppStore.getState()
        
        // 构建活动数据用于 Widget_Share
        const activityData = {
          id: draft.activityId,
          title: draft.title,
          type: draft.type,
          startAt: draft.startAt,
          location: draft.location,
          locationName: draft.locationName,
          locationHint: draft.locationHint,
          maxParticipants: draft.maxParticipants || 4,
          currentParticipants: 1,
          shareTitle: `🔥 ${draft.title}，快来！`,
        }

        // 添加 Widget_Share 消息到对话流
        homeStore.addAIMessage({
          role: 'assistant',
          type: 'widget_share',
          content: activityData,
          activityId: draft.activityId,
        })

        // 显示分享引导蒙层
        appStore.showShareGuide({
          activityId: draft.activityId,
          title: draft.title,
          locationName: draft.locationName || draft.locationHint || '活动地点',
        })

        wx.showToast({ title: '发布成功', icon: 'success' })
      } else {
        wx.hideLoading()
        const errorData = response.data as { msg?: string }
        wx.showToast({ 
          title: errorData?.msg || '发布失败', 
          icon: 'none' 
        })
      }
    } catch (error: any) {
      wx.hideLoading()
      console.error('[Home] Publish draft failed:', error)
      wx.showToast({ 
        title: error?.message || '网络有点慢，再试一次？', 
        icon: 'none' 
      })
    }
  },

  /**
   * 跳转到活动确认页（保留用于地图选点后的确认流程）
   */
  navigateToConfirm(draft: any) {
    const params = new URLSearchParams()
    if (draft.activityId) params.append('activityId', draft.activityId)
    
    wx.navigateTo({
      url: `/subpackages/activity/confirm/index?${params.toString()}`,
    })
  },

  /**
   * Widget_Draft 调整位置
   * Requirements: 6.5
   */
  onDraftAdjustLocation(_e: WechatMiniprogram.CustomEvent<{ draft: any }>) {
    // 由 widget-draft 组件内部处理跳转
  },

  /**
   * Widget_Explore 展开地图
   * Requirements: 17.4
   */
  onExploreExpandMap(_e: WechatMiniprogram.CustomEvent<{ results: any[]; center: any }>) {
    // 由 widget-explore 组件内部处理跳转
  },

  // ==================== Auth Sheet 事件 ====================

  /**
   * 手机号绑定成功
   * Requirements: 12.5
   */
  onAuthSuccess(_e: WechatMiniprogram.CustomEvent<{ phoneNumber: string }>) {
    // 刷新用户信息
    this.loadUserInfo()
  },

  /**
   * 待执行操作（手机号绑定后继续）
   * Requirements: 12.5
   */
  async onPendingAction(e: WechatMiniprogram.CustomEvent<{ type: string; payload: any }>) {
    const { type, payload } = e.detail
    
    if (type === 'publish' && payload?.draft) {
      // 手机号绑定成功后，继续发布活动
      await this.publishDraftActivity(payload.draft)
    }
  },

  // ==================== 分享相关 ====================

  // 当前分享的活动数据（用于 Widget_Share 触发的分享）
  shareActivityData: null as any,

  /**
   * Widget_Share 分享事件
   * Requirements: 7.3, 13.1
   */
  onWidgetShareTap(e: WechatMiniprogram.CustomEvent<{ activity: any; shareTitle: string }>) {
    const { activity, shareTitle } = e.detail
    // 保存分享数据，供 onShareAppMessage 使用
    this.shareActivityData = { ...activity, shareTitle }
  },

  /**
   * 页面分享 - Requirements: 13.1, 13.2, 13.3, 13.4
   * 
   * 零成本方案：分享卡片不使用地图预览图，使用默认封面或纯文字
   */
  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    // 如果有 Widget_Share 触发的分享数据，使用该数据
    if (this.shareActivityData) {
      const activity = this.shareActivityData
      const shareTitle = activity.shareTitle || `🔥 ${activity.title}，快来！`
      
      // 清除分享数据
      const result = {
        title: shareTitle,
        path: `/subpackages/activity/detail/index?id=${activity.id}&share=1`,
        // 零成本方案：不使用地图预览图
        imageUrl: '',
      }
      
      this.shareActivityData = null
      return result
    }
    
    // 默认分享首页
    return {
      title: '聚场 - 微信群组局神器',
      path: '/pages/home/index',
    }
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '聚场 - 微信群组局神器',
    }
  },

  // ==================== 错误处理 ====================

  /**
   * Widget_Error 重试
   * Requirements: 错误处理, 用户引导
   */
  onWidgetErrorRetry(e: WechatMiniprogram.CustomEvent) {
    const originalText = e.currentTarget.dataset.originalText
    if (originalText) {
      // 重新发起 AI 解析
      this.startAIParse(originalText)
    }
  },

  /**
   * 网络恢复重试
   * Requirements: 错误处理
   */
  onNetworkRetry() {
    // 刷新消息列表
    this.loadMessages()
  },
})
