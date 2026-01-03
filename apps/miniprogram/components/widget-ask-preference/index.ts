/**
 * Widget Ask Preference 组件
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 * 
 * 多轮对话信息收集卡片
 * - 显示 AI 询问的问题
 * - 渲染选项按钮供用户快速选择
 * - 支持"随便/都可以"跳过按钮
 * - 点击后触发事件通知父组件
 */

/** 选项结构 */
interface PreferenceOption {
  label: string;
  value: string;
}

/** 已收集信息 */
interface CollectedInfo {
  location?: string;
  type?: string;
}

interface ComponentData {
  // 无额外 data
}

interface ComponentProperties {
  questionType: WechatMiniprogram.Component.PropertyOption;
  question: WechatMiniprogram.Component.PropertyOption;
  options: WechatMiniprogram.Component.PropertyOption;
  allowSkip: WechatMiniprogram.Component.PropertyOption;
  collectedInfo: WechatMiniprogram.Component.PropertyOption;
  disabled: WechatMiniprogram.Component.PropertyOption;
}

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    /** 询问类型：location=位置偏好，type=活动类型偏好 */
    questionType: {
      type: String,
      value: 'location' as 'location' | 'type',
    },
    /** 问题文本 */
    question: {
      type: String,
      value: '你想看哪个地方的活动呢？',
    },
    /** 选项列表 */
    options: {
      type: Array,
      value: [] as PreferenceOption[],
    },
    /** 是否允许跳过 */
    allowSkip: {
      type: Boolean,
      value: true,
    },
    /** 已收集的信息（用于上下文传递） */
    collectedInfo: {
      type: Object,
      value: {} as CollectedInfo,
    },
    /** 是否禁用（已选择后禁用） */
    disabled: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    /**
     * 点击选项
     */
    onSelectOption(e: WechatMiniprogram.TouchEvent) {
      if (this.properties.disabled) return;
      
      const { option } = e.currentTarget.dataset as { option: PreferenceOption };
      if (!option) return;
      
      // 触感反馈
      wx.vibrateShort({ type: 'light' });
      
      // 触发选择事件
      this.triggerEvent('select', {
        questionType: this.properties.questionType,
        selectedOption: option,
        collectedInfo: this.properties.collectedInfo,
      });
    },

    /**
     * 点击跳过按钮
     */
    onSkip() {
      if (this.properties.disabled) return;
      
      // 触感反馈
      wx.vibrateShort({ type: 'light' });
      
      // 触发跳过事件
      this.triggerEvent('skip', {
        questionType: this.properties.questionType,
        collectedInfo: this.properties.collectedInfo,
      });
    },
  },
});
