/**
 * 首页 (Chat-First 架构)
 * Requirements: 1.1, 1.2, 1.3, 1.4, 3.2
 * v3.7 重构: 使用 useChatStore 统一 AI 对话管理
 * 
 * 三层结构：Custom_Navbar + Chat_Stream + AI_Dock
 * - 首次进入显示 Widget_Dashboard（调用 /ai/welcome API）
 * - 集成 useChatStore（类似 @ai-sdk/react 的 useChat）
 * - 实现空气感渐变背景
 */
import { useChatStore, type UIMessage, type WidgetPart, getTextContent, getWidgetPart } from '../../src/stores/chat'
import { useHomeStore } from '../../src/stores/home'
import { useAppStore } from '../../src/stores/app'
import { useUserStore } from '../../src/stores/user'
import { postActivitiesByIdPublish } from '../../src/api/endpoints/activities/activities'
import { getWelcomeCard, getUserLocation, type WelcomeResponse, type QuickItem } from '../../src/services/welcome'
import type { ShareActivityData, SendEventDetail, SendMessageEventDetail, DraftContext } from '../../src/types/global'
import { getHotKeywords } from '../../src/api/endpoints/hot-keywords/hot-keywords'
import type { HotKeywordsListResponseDataItem } from '../../src/api/model'

// 页面数据类型
interface PageData {
  // 从 useChatStore 同步
  messages: UIMessage[]
  status: 'idle' | 'submitted' | 'streaming'
  streamingMessageId: string | null
  
  // 页面 UI 状态
  userNickname: string
  isAuthSheetVisible: boolean
  isShareGuideVisible: boolean
  shareGuideData: { activityId?: string; title?: string; mapUrl?: string } | null
  scrollToView: string
  
  // 欢迎卡片 (v3.10 新结构)
  welcomeData: WelcomeResponse | null
  isWelcomeLoading: boolean
  
  // 热词列表 (v4.7 全局关键词系统)
  hotKeywords: HotKeywordsListResponseDataItem[]
}

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    messages: [],
    status: 'idle',
    streamingMessageId: null,
    userNickname: '搭子',
    isAuthSheetVisible: false,
    isShareGuideVisible: false,
    shareGuideData: null,
    scrollToView: '',
    welcomeData: null,
    isWelcomeLoading: false,
    hotKeywords: [],
  },

  unsubscribeChat: null as (() => void) | null,
  unsubscribeApp: null as (() => void) | null,
  unsubscribeUser: null as (() => void) | null,
  userLocation: null as { lat: number; lng: number } | null,

  onLoad() {
    this.subscribeChatStore()
    this.subscribeAppStore()
    this.subscribeUserStore()
    this.initChat()
    this.loadUserInfo()
    this.loadHotKeywords()
  },

  onShow() {
    this.loadUserInfo()
  },

  onUnload() {
    this.unsubscribeChat?.()
    this.unsubscribeApp?.()
    this.unsubscribeUser?.()
    // 停止正在进行的流式输出
    useChatStore.getState().stop()
  },

  onHide() {
    // 页面隐藏时停止流式输出
    useChatStore.getState().stop()
  },

  /**
   * 订阅 useChatStore 状态变化
   */
  subscribeChatStore() {
    const chatStore = useChatStore.getState()
    this.setData({
      messages: chatStore.messages,
      status: chatStore.status,
      streamingMessageId: chatStore.streamingMessageId,
    })
    
    this.unsubscribeChat = useChatStore.subscribe((state) => {
      this.setData({
        messages: state.messages,
        status: state.status,
        streamingMessageId: state.streamingMessageId,
      })
      
      // 自动滚动到最新消息
      if (state.messages.length > 0) {
        const lastMsg = state.messages[state.messages.length - 1]
        this.setData({ scrollToView: `msg-${lastMsg.id}` })
      }
    })
  },

  subscribeAppStore() {
    const appStore = useAppStore.getState()
    this.setData({
      isAuthSheetVisible: appStore.isAuthSheetVisible,
      isShareGuideVisible: appStore.isShareGuideVisible,
      shareGuideData: appStore.shareGuideData,
    })
    this.unsubscribeApp = useAppStore.subscribe((state) => {
      this.setData({
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

  /**
   * 初始化对话
   */
  async initChat() {
    const chatStore = useChatStore.getState()
    
    // 如果没有消息，显示欢迎卡片
    if (chatStore.messages.length === 0) {
      await this.showDashboard()
    }
    
    // 获取用户位置并设置到 store
    if (!this.userLocation) {
      this.userLocation = await getUserLocation()
      if (this.userLocation) {
        chatStore.setLocation(this.userLocation)
      }
    }
  },

  async loadUserInfo() {
    const userStore = useUserStore.getState()
    if (userStore.user) {
      this.setData({ userNickname: userStore.user.nickname || '搭子' })
    }
  },

  /**
   * 加载热词列表 - Requirements: 3.7, 3.8, 3.9
   */
  async loadHotKeywords() {
    try {
      const response = await getHotKeywords({ limit: 5 })
      
      if (response.status === 200) {
        this.setData({ hotKeywords: response.data.data })
        
        // 埋点：记录热词曝光事件 - Requirements: 3.9
        if (response.data.data.length > 0) {
          wx.reportEvent('hot_chip_show', {
            keyword_count: response.data.data.length,
            keywords: response.data.data.map(k => k.keyword).join(','),
          })
        }
      }
    } catch (error) {
      console.error('[Home] Failed to load hot keywords:', error)
      // 静默失败，不影响主流程
    }
  },

  /**
   * 显示欢迎卡片
   * v4.4: 增加社交档案和快捷入口
   */
  async showDashboard() {
    const chatStore = useChatStore.getState()
    
    this.setData({ isWelcomeLoading: true })
    
    try {
      if (!this.userLocation) {
        this.userLocation = await getUserLocation()
      }
      
      const welcomeData = await getWelcomeCard(
        this.userLocation ? { lat: this.userLocation.lat, lng: this.userLocation.lng } : undefined
      )
      
      this.setData({ 
        welcomeData,
        isWelcomeLoading: false,
      })
      
      // 使用 useChatStore 添加 Dashboard Widget (v4.4 新结构)
      chatStore.addWidgetMessage('dashboard', {
        nickname: this.data.userNickname,
        greeting: welcomeData.greeting,
        subGreeting: welcomeData.subGreeting,
        sections: welcomeData.sections,
        socialProfile: welcomeData.socialProfile,
        quickPrompts: welcomeData.quickPrompts,
      })
    } catch (error) {
      console.error('[Home] Failed to load welcome card:', error)
      this.setData({ isWelcomeLoading: false })
      
      // 降级：使用本地欢迎卡片
      chatStore.addWidgetMessage('dashboard', {
        nickname: this.data.userNickname,
      })
    }
  },

  /**
   * 新对话
   */
  async onNewChat() {
    const chatStore = useChatStore.getState()
    chatStore.clearMessages()
    
    // 同时清空服务端历史
    try {
      await useHomeStore.getState().clearMessages()
    } catch (e) {
      console.error('[Home] Failed to clear server messages:', e)
    }
    
    await this.showDashboard()
  },

  /**
   * 发送消息
   */
  onSend(e: WechatMiniprogram.CustomEvent<{ text: string }>) {
    const { text } = e.detail
    if (!text?.trim()) return
    
    const chatStore = useChatStore.getState()
    chatStore.sendMessage(text)
  },

  /**
   * 处理 Widget_Draft 的 sendMessage 事件（多轮对话）
   */
  onDraftSendMessage(e: WechatMiniprogram.CustomEvent<SendMessageEventDetail>) {
    const { text, draftContext } = e.detail
    if (!text?.trim()) return
    
    const chatStore = useChatStore.getState()
    chatStore.sendMessage(text, { draftContext })
  },

  onParse(_e: WechatMiniprogram.CustomEvent<{ text: string }>) {
    // 防抖已在 ai-dock 组件中处理
  },

  onPaste(_e: WechatMiniprogram.CustomEvent<{ text: string }>) {
    // 粘贴后自动触发解析
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
   * 处理快捷项点击 (v3.10 新结构)
   */
  onDashboardQuickItemTap(e: WechatMiniprogram.CustomEvent<{ item: QuickItem }>) {
    const { item } = e.detail
    console.log('[Home] Quick item tap:', item)
    // prompttap 事件会自动触发，这里只做日志
  },

  /**
   * 查看全部活动 (v4.4 新增)
   */
  onDashboardViewAll() {
    wx.navigateTo({ url: '/subpackages/activity/list/index?type=joined' })
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
        const chatStore = useChatStore.getState()
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

        // 使用 useChatStore 添加 Share Widget
        chatStore.addWidgetMessage('share', activityData)

        appStore.showShareGuide({
          activityId: draft.activityId,
          title: draft.title,
          locationName: draft.locationName || draft.locationHint || '活动地点',
        })

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
    return {
      title: '聚场 - 想怎么玩？跟小聚说说',
      path: '/pages/home/index',
    }
  },

  onShareTimeline() {
    return {
      title: '聚场 - 你的 AI 活动助理',
    }
  },

  /**
   * 错误重试
   */
  onWidgetErrorRetry(e: WechatMiniprogram.CustomEvent) {
    const originalText = e.currentTarget.dataset.originalText
    if (originalText) {
      const chatStore = useChatStore.getState()
      chatStore.sendMessage(originalText)
    }
  },

  /**
   * 处理 Widget_Ask_Preference 选项选择
   */
  onAskPreferenceSelect(e: WechatMiniprogram.CustomEvent<{
    questionType: 'location' | 'type';
    selectedOption: { label: string; value: string };
    collectedInfo?: { location?: string; type?: string };
  }>) {
    const { selectedOption } = e.detail
    const chatStore = useChatStore.getState()
    chatStore.sendMessage(selectedOption.label)
  },

  /**
   * 处理 Widget_Ask_Preference 跳过按钮
   */
  onAskPreferenceSkip(_e: WechatMiniprogram.CustomEvent<{
    questionType: 'location' | 'type';
    collectedInfo?: { location?: string; type?: string };
  }>) {
    const chatStore = useChatStore.getState()
    chatStore.sendMessage('随便，你推荐吧')
  },

  onNetworkRetry() {
    this.initChat()
  },

  /**
   * 处理热词点击 - Requirements: 3.5, 3.6, 3.11
   */
  onHotChipClick(e: WechatMiniprogram.CustomEvent<{ id: string; keyword: string }>) {
    const { id, keyword } = e.detail
    
    // 发送消息到 AI，并传递 keywordId 到 metadata
    const chatStore = useChatStore.getState()
    chatStore.sendMessage(keyword, { keywordId: id })
  },
})
