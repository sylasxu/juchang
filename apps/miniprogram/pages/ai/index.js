// AI 助手页面
Page({
  data: {
    aiQuota: {
      create: 3,
      chat: 5
    },
    messages: [
      {
        role: 'assistant',
        content: '你好！我是聚场AI助手，可以帮你找活动、写文案、分析用户等。有什么需要帮助的吗？'
      }
    ],
    inputText: '',
    scrollTop: 0,
    showQuotaDialog: false
  },

  onLoad() {
    this.loadUserQuota()
  },

  onShow() {
    // 更新 tabbar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        value: 'ai'
      })
    }
  },

  // 加载用户AI额度
  loadUserQuota() {
    // TODO: 从API获取用户今日剩余额度
    // const quota = await api.getUserAIQuota()
    // this.setData({ aiQuota: quota })
  },

  // 快捷操作
  onQuickAction(e) {
    const action = e.currentTarget.dataset.action
    let prompt = ''
    
    switch (action) {
      case 'find':
        prompt = '帮我找一些周末的活动'
        break
      case 'write':
        prompt = '帮我写一个招募文案'
        break
      case 'analyze':
        prompt = '如何分析一个申请者是否靠谱？'
        break
    }
    
    if (prompt) {
      this.setData({ inputText: prompt })
      this.onSendMessage()
    }
  },

  // 输入框变化
  onInputChange(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  // 发送消息
  async onSendMessage() {
    const { inputText, aiQuota } = this.data
    
    if (!inputText.trim()) {
      return
    }

    // 检查额度
    if (aiQuota.chat <= 0) {
      this.setData({ showQuotaDialog: true })
      return
    }

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: inputText
    }
    
    this.setData({
      messages: [...this.data.messages, userMessage],
      inputText: '',
      'aiQuota.chat': aiQuota.chat - 1
    })

    // 滚动到底部
    this.scrollToBottom()

    try {
      // TODO: 调用AI API
      // const response = await api.chatWithAI(inputText)
      
      // 模拟AI回复
      setTimeout(() => {
        const aiMessage = {
          role: 'assistant',
          content: '这是AI的回复内容，实际使用时会调用真实的AI API。'
        }
        
        this.setData({
          messages: [...this.data.messages, aiMessage]
        })
        
        this.scrollToBottom()
      }, 1000)
      
    } catch (error) {
      console.error('AI调用失败:', error)
      wx.showToast({
        title: 'AI服务暂时不可用',
        icon: 'none'
      })
    }
  },

  // 滚动到底部
  scrollToBottom() {
    this.setData({
      scrollTop: this.data.messages.length * 100
    })
  },

  // 购买额度
  onBuyQuota() {
    // TODO: 跳转到支付页面
    wx.showToast({
      title: '跳转到支付页面',
      icon: 'none'
    })
    this.setData({ showQuotaDialog: false })
  },

  // 关闭额度弹窗
  onCloseQuotaDialog() {
    this.setData({ showQuotaDialog: false })
  }
})