/**
 * 首页 (Chat-First 架构)
 * Requirements: 1.1, 1.2, 1.3, 1.4, 3.2
 * v3.4 新增: 5.1-5.4, 6.1-6.2, 7.1-7.5 - 智能欢迎卡片
 * 
 * 三层结构：Custom_Navbar + Chat_Stream + AI_Dock
 * - 首次进入显示 Widget_Dashboard（调用 /ai/welcome API）
 * - 集成 homeStore（subscribe 模式）
 * - 实现空气感渐变背景
 */
import { useHomeStore, type ChatMessage } from '../../src/stores/home'
import { useAppStore } from '../../src/stores/app'
import { useUserStore } from '../../src/stores/user'
import { sendAIChat, type ToolCall } from '../../src/utils/sse-request'
import { getWidgetTypeFromToolCall } from '../../src/utils/data-stream-parser'
import { postActivitiesByIdPublish } from '../../src/api/endpoints/activities/activities'
import { getWelcomeCard, getUserLocation, type WelcomeResponse, type QuickAction } from '../../src/services/welcome'
import type { DraftData, ExploreData, ShareActivityData, SendEventDetail, SendMessageEventDetail, DraftContext } from '../../src/types/global'

// 生成唯一 ID
const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

// 页面数据类型
interface PageData {
  messages: ChatMessage[]
  isLoading: boolean
  isLoadingMore: boolean
  aiThinkingState: 'idle' | 'thinking' | 'rendering_widget'
  thinkingText: string
  skeletonType: 'draft' | 'explore' | 'share' | null
  userNickname: string
  upcomingActivities: any[]
  isAuthSheetVisible: boolean
  isShareGuideVisible: boolean
  shareGuideData: { activityId?: string; title?: string; mapUrl?: string } | null
  currentDraft: any | null
  currentExplore: any | null
  currentShare: any | null
  scrollToView: string
  // v3.4 新增：欢迎卡片数据
  welcomeData: WelcomeResponse | null
  isWelcomeLoading: boolean
  // v3.4 新增：当前草稿上下文（用于多轮对话）
  currentDraftContext: DraftContext | null
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
    // v3.4 新增：欢迎卡片数据
    welcomeData: null,
    isWelcomeLoading: false,
    // v3.4 新增：当前草稿上下文
    currentDraftContext: null,
  },

  unsubscribeHome: null as (() => void) | null,
  unsubscribeApp: null as (() => void) | null,
  unsubscribeUser: null as (() => void) | null,
  sseController: null as { abort: () => void } | null,
  // v3.4 新增：用户位置缓存
  userLocation: null as { lat: number; lng: number } | null,

  onLoad() {
    this.subscribeHomeStore()
    this.subscribeAppStore()
    this.subscribeUserStore()
    this.loadMessages()
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  onUnload() {
    this.unsubscribeHome?.()
    this.unsubscribeApp?.()
    this.unsubscribeUser?.()
    this.sseController?.abort()
  },

  onHide() {
    this.sseController?.abort()
  },

  subscribeHomeStore() {
    const homeStore = useHomeStore.getState()
    this.setData({
      messages: homeStore.messages,
      isLoading: homeStore.isLoading,
      isLoadingMore: homeStore.isLoadingMore,
    })
    this.unsubscribeHome = useHomeStore.subscribe((state) => {
      this.setData({
        messages: state.messages,
        isLoading: state.isLoading,
        isLoadingMore: state.isLoadingMore,
      })
      if (state.messages.length > 0) {
        const lastMsg = state.messages[state.messages.length - 1]
        this.setData({ scrollToView: `msg-${lastMsg.id}` })
      }
    })
  },

  subscribeAppStore() {
    const appStore = useAppStore.getState()
    this.setData({
      aiThinkingState: appStore.aiThinkingState,
      isAuthSheetVisible: appStore.isAuthSheetVisible,
      isShareGuideVisible: appStore.isShareGuideVisible,
      shareGuideData: appStore.shareGuideData,
    })
    this.unsubscribeApp = useAppStore.subscribe((state) => {
      this.setData({
        aiThinkingState: state.aiThinkingState,
        isAuthSheetVisible: state.isAuthSheetVisible,
        isShareGuideVisible: state.isShareGuideVisible,
        shareGuideData: state.shareGuideData,
      })
    })
  },

  subscribeUserStore() {
    const userStore = useUserStore.getState()
    if (userStore.user) {
      this.setData({ userNickname: userStore.user.nickname || '搭子' })
    }
    this.unsubscribeUser = useUserStore.subscribe((state) => {
      if (state.user) {
        this.setData({ userNickname: state.user.nickname || '搭子' })
      }
    })
  },

  async loadMessages() {
    const homeStore = useHomeStore.getState()
    await homeStore.loadMessages()
    const messages = useHomeStore.getState().messages
    if (messages.length === 0) {
      this.showDashboard()
    }
  },

  async loadUserInfo() {
    const userStore = useUserStore.getState()
    if (userStore.user) {
      this.setData({ userNickname: userStore.user.nickname || '搭子' })
    }
  },

  /**
   * 显示欢迎卡片
   * Requirements: 5.1-5.4, 6.1-6.2
   * v3.4 新增：调用 /ai/welcome API 获取个性化内容
   */
  async showDashboard() {
    const homeStore = useHomeStore.getState()
    
    // 设置加载状态
    this.setData({ isWelcomeLoading: true })
    
    try {
      // 尝试获取用户位置
      if (!this.userLocation) {
        this.userLocation = await getUserLocation()
      }
      
      // 调用 welcome API
      const welcomeData = await getWelcomeCard(
        this.userLocation ? { lat: this.userLocation.lat, lng: this.userLocation.lng } : undefined
      )
      
      this.setData({ 
        welcomeData,
        isWelcomeLoading: false,
      })
      
      // 添加 AI 消息到对话流
      homeStore.addAIMessage({
        role: 'assistant',
        type: 'widget_dashboard',
        content: {
          nickname: this.data.userNickname,
          activities: this.data.upcomingActivities,
          // v3.4 新增：传递 API 返回的数据
          greeting: welcomeData.greeting,
          quickActions: welcomeData.quickActions,
          fallbackPrompt: welcomeData.fallbackPrompt,
        },
        activityId: null,
      })
    } catch (error) {
      console.error('[Home] Failed to load welcome card:', error)
      this.setData({ isWelcomeLoading: false })
      
      // 降级：使用本地生成的欢迎卡片
      homeStore.addAIMessage({
        role: 'assistant',
        type: 'widget_dashboard',
        content: {
          nickname: this.data.userNickname,
          activities: this.data.upcomingActivities,
        },
        activityId: null,
      })
    }
  },

  async onLoadMore() {
    const homeStore = useHomeStore.getState()
    await homeStore.loadMoreMessages()
  },

  async onNewChat() {
    const homeStore = useHomeStore.getState()
    await homeStore.clearMessages()
    this.showDashboard()
  },

  async onSend(e: WechatMiniprogram.CustomEvent<{ text: string }>) {
    const { text } = e.detail
    if (!text?.trim()) return
    const homeStore = useHomeStore.getState()
    await homeStore.addUserMessage(text)
    // v3.4: 普通发送不带 draftContext
    this.startAIParse(text)
  },

  /**
   * 处理 Widget_Draft 的 sendMessage 事件
   * v3.4 新增：多轮对话支持
   * Requirements: 多轮对话支持
   */
  async onDraftSendMessage(e: WechatMiniprogram.CustomEvent<SendMessageEventDetail>) {
    const { text, draftContext } = e.detail
    if (!text?.trim()) return
    
    const homeStore = useHomeStore.getState()
    await homeStore.addUserMessage(text)
    
    // 保存当前草稿上下文
    if (draftContext) {
      this.setData({ currentDraftContext: draftContext })
    }
    
    // 带 draftContext 发起 AI 请求
    this.startAIParse(text, draftContext)
  },

  onParse(_e: WechatMiniprogram.CustomEvent<{ text: string }>) {
    // 防抖已在 ai-dock 组件中处理
  },

  onPaste(_e: WechatMiniprogram.CustomEvent<{ text: string }>) {
    // 粘贴后自动触发解析
  },

  /**
   * 发起 AI 解析请求
   * v3.4 新增：支持 draftContext 用于多轮对话修改草稿
   * Requirements: 多轮对话支持
   */
  startAIParse(text: string, draftContext?: DraftContext) {
    const appStore = useAppStore.getState()
    const homeStore = useHomeStore.getState()

    // v3.4 优化：使用新的文案
    appStore.setAIThinkingState('thinking')
    this.setData({ thinkingText: '收到，小聚正在整理你的安排...' })

    this.sseController?.abort()

    let accumulatedText = ''
    let currentToolCall: ToolCall | null = null
    const aiMessageId = generateId()

    // v3.4: 构建请求选项，支持 draftContext 多轮对话
    const requestOptions: {
      location?: { lat: number; lng: number }
      draftContext?: DraftContext
    } = {}
    
    // 添加用户位置（如果有）
    if (this.userLocation) {
      requestOptions.location = this.userLocation
    }
    
    // 添加草稿上下文（如果有）
    if (draftContext) {
      requestOptions.draftContext = draftContext
    }

    this.sseController = sendAIChat(text, {
      onStart: () => {
        console.log('[Home] AI parse started')
      },

      onText: (chunk) => {
        accumulatedText += chunk
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
        const widgetType = getWidgetTypeFromToolCall(toolCall)
        if (widgetType) {
          appStore.setAIThinkingState('rendering_widget')
          if (widgetType === 'widget_draft') {
            this.setData({ 
              skeletonType: 'draft',
              thinkingText: '正在生成活动草稿...',
            })
          } else if (widgetType === 'widget_explore') {
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
          const draftData = result.result as DraftData
          this.setData({ currentDraft: draftData, skeletonType: null })
          homeStore.addAIMessage({
            id: aiMessageId,
            role: 'assistant',
            type: 'widget_draft',
            content: draftData,
            activityId: draftData?.activityId || null,
          })
        } else if (widgetType === 'widget_explore') {
          const exploreData = result.result as ExploreData
          const exploreContent = {
            results: exploreData?.results || exploreData?.activities || [],
            center: exploreData?.center || {
              lat: exploreData?.lat || 29.5647,
              lng: exploreData?.lng || 106.5507,
              name: exploreData?.locationName || '附近',
            },
            title: exploreData?.title || '',
          }
          this.setData({ currentExplore: exploreContent, skeletonType: null })
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
        this.setData({ thinkingText: '', skeletonType: null })
        this.sseController = null
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
        this.setData({ thinkingText: '', skeletonType: null })
        this.sseController = null
        homeStore.addAIMessage({
          id: aiMessageId,
          role: 'assistant',
          type: 'widget_error',
          content: { 
            message: '抱歉，我没理解你的意思，试试换个说法？',
            showRetry: true,
            originalText: text,
          },
          activityId: null,
        })
        wx.showToast({ title: '网络有点慢，再试一次？', icon: 'none' })
      },

      onFinish: () => {
        this.sseController = null
      },
    }, requestOptions)
  },

  onDashboardActivityTap(e: WechatMiniprogram.CustomEvent<{ id: string }>) {
    const { id } = e.detail
    wx.navigateTo({ url: `/subpackages/activity/detail/index?id=${id}` })
  },

  onDashboardPromptTap(e: WechatMiniprogram.CustomEvent<{ prompt: string }>) {
    const { prompt } = e.detail
    const aiDock = this.selectComponent('#aiDock')
    if (aiDock) {
      aiDock.setValue(prompt)
    }
    this.onSend({ detail: { text: prompt } } as WechatMiniprogram.CustomEvent<SendEventDetail>)
  },

  /**
   * 处理快捷操作按钮点击
   * Requirements: 7.4
   */
  onDashboardQuickActionTap(e: WechatMiniprogram.CustomEvent<{ action: QuickAction }>) {
    const { action } = e.detail
    console.log('[Home] Quick action tap:', action)
    // 具体操作已在 widget-dashboard 组件内处理
  },

  /**
   * 处理探索附近按钮点击
   * Requirements: 7.4 - explore_nearby → 触发 AI 搜索或跳转探索页
   */
  onDashboardExploreNearby(e: WechatMiniprogram.CustomEvent<{ locationName: string; lat: number; lng: number; activityCount: number }>) {
    const { locationName, lat, lng } = e.detail
    // 触发 AI 搜索
    const searchText = `看看${locationName}附近有什么活动`
    this.onSend({ detail: { text: searchText } } as WechatMiniprogram.CustomEvent<SendEventDetail>)
  },

  /**
   * 处理找搭子按钮点击
   * Requirements: 7.4 - find_partner → 预填输入框并聚焦
   */
  onDashboardFindPartner(e: WechatMiniprogram.CustomEvent<{ activityType: string; activityTypeLabel: string; suggestedPrompt: string }>) {
    const { suggestedPrompt } = e.detail
    const aiDock = this.selectComponent('#aiDock')
    if (aiDock) {
      aiDock.setValue(suggestedPrompt)
      aiDock.focus()
    }
  },

  async onDraftConfirm(e: WechatMiniprogram.CustomEvent<{ draft: any }>) {
    const { draft } = e.detail
    const userStore = useUserStore.getState()
    if (!userStore.user?.phoneNumber) {
      const appStore = useAppStore.getState()
      appStore.showAuthSheet({ type: 'publish', payload: { draft } })
      return
    }
    await this.publishDraftActivity(draft)
  },

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
        const homeStore = useHomeStore.getState()
        const appStore = useAppStore.getState()
        
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

        homeStore.addAIMessage({
          role: 'assistant',
          type: 'widget_share',
          content: activityData,
          activityId: draft.activityId,
        })

        appStore.showShareGuide({
          activityId: draft.activityId,
          title: draft.title,
          locationName: draft.locationName || draft.locationHint || '活动地点',
        })

        // v3.4 优化：使用新的成功文案
        wx.showToast({ title: '搞定！快分享给朋友吧', icon: 'success' })
      } else {
        wx.hideLoading()
        const errorData = response.data as { msg?: string }
        wx.showToast({ title: errorData?.msg || '发布失败', icon: 'none' })
      }
    } catch (error: any) {
      wx.hideLoading()
      console.error('[Home] Publish draft failed:', error)
      wx.showToast({ title: error?.message || '网络有点慢，再试一次？', icon: 'none' })
    }
  },

  navigateToConfirm(draft: any) {
    const params = new URLSearchParams()
    if (draft.activityId) params.append('activityId', draft.activityId)
    wx.navigateTo({ url: `/subpackages/activity/confirm/index?${params.toString()}` })
  },

  onDraftAdjustLocation(_e: WechatMiniprogram.CustomEvent<{ draft: any }>) {
    // 由 widget-draft 组件内部处理跳转
  },

  onExploreExpandMap(_e: WechatMiniprogram.CustomEvent<{ results: any[]; center: any }>) {
    // 由 widget-explore 组件内部处理跳转
  },

  onAuthSuccess(_e: WechatMiniprogram.CustomEvent<{ phoneNumber: string }>) {
    this.loadUserInfo()
  },

  async onPendingAction(e: WechatMiniprogram.CustomEvent<{ type: string; payload: any }>) {
    const { type, payload } = e.detail
    if (type === 'publish' && payload?.draft) {
      await this.publishDraftActivity(payload.draft)
    }
  },

  shareActivityData: null as ShareActivityData | null,

  onWidgetShareTap(e: WechatMiniprogram.CustomEvent<{ activity: any; shareTitle: string }>) {
    const { activity, shareTitle } = e.detail
    this.shareActivityData = { ...activity, shareTitle }
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    if (this.shareActivityData) {
      const activity = this.shareActivityData
      const shareTitle = activity.shareTitle || `🔥 ${activity.title}，快来！`
      const result = {
        title: shareTitle,
        path: `/subpackages/activity/detail/index?id=${activity.id}&share=1`,
        imageUrl: '',
      }
      this.shareActivityData = null
      return result
    }
    // v3.4 优化：使用新的品牌定位
    return {
      title: '聚场 - 想怎么玩？跟小聚说说',
      path: '/pages/home/index',
    }
  },

  onShareTimeline() {
    // v3.4 优化：使用新的品牌定位
    return {
      title: '聚场 - 你的 AI 活动助理',
    }
  },

  onWidgetErrorRetry(e: WechatMiniprogram.CustomEvent) {
    const originalText = e.currentTarget.dataset.originalText
    if (originalText) {
      this.startAIParse(originalText)
    }
  },

  onNetworkRetry() {
    this.loadMessages()
  },
})
