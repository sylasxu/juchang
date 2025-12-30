/**
 * Widget Skeleton 组件 - 卡片骨架屏
 * Requirements: 响应感, 预期管理
 * 
 * Props：type = 'draft' | 'explore' | 'share'（不同骨架形态）
 * 
 * 使用场景：
 * - SSE 检测到 Widget 类型后，先渲染骨架
 * - 数据填充完成后替换为真实 Widget
 */

// 骨架类型
type SkeletonType = 'draft' | 'explore' | 'share' | 'default'

interface ComponentData {
  // 无内部状态
}

interface ComponentProperties {
  type: WechatMiniprogram.Component.PropertyOption
}

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 骨架类型
    type: {
      type: String,
      value: 'default' as SkeletonType,
    },
  },

  data: {},

  methods: {},
})
