/**
 * Widget Error 组件 - 错误提示卡片
 * Requirements: 错误处理, 用户引导
 * 
 * 功能：
 * - AI 解析失败时显示
 * - 带重试按钮
 */

interface ComponentData {
  // 无内部状态
}

interface ComponentProperties {
  message: WechatMiniprogram.Component.PropertyOption
  retryText: WechatMiniprogram.Component.PropertyOption
  showRetry: WechatMiniprogram.Component.PropertyOption
}

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 错误消息
    message: {
      type: String,
      value: '抱歉，我没理解你的意思，试试换个说法？',
    },
    // 重试按钮文字
    retryText: {
      type: String,
      value: '重试',
    },
    // 是否显示重试按钮
    showRetry: {
      type: Boolean,
      value: true,
    },
  },

  data: {},

  methods: {
    /**
     * 点击重试
     */
    onRetry() {
      // 触感反馈
      wx.vibrateShort({ type: 'light' })
      this.triggerEvent('retry')
    },
  },
})
