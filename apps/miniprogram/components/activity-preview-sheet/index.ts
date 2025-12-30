/**
 * Activity Preview Sheet 组件 - 地图浮层预览
 * Requirements: 18.4, 轻量预览
 * 
 * 交互逻辑：
 * - 地图页点击 Pin → 显示此浮层
 * - 点击地图空白处 → 浮层下沉隐藏
 * - 点击 [查看详情] → navigateTo 活动详情页
 * - 点击 [直接报名] → 检查手机号 → 报名
 */

import { useUserStore } from '../../src/stores/user'
import { useAppStore } from '../../src/stores/app'

// 活动类型映射
const TYPE_CONFIG: Record<string, { icon: string; label: string; colorClass: string }> = {
  food: { icon: '🍲', label: '美食', colorClass: 'amber' },
  entertainment: { icon: '🎬', label: '娱乐', colorClass: 'purple' },
  sports: { icon: '⚽', label: '运动', colorClass: 'mint' },
  boardgame: { icon: '🎲', label: '桌游', colorClass: 'blue' },
  mahjong: { icon: '🀄', label: '麻将', colorClass: 'amber' },
  hotpot: { icon: '🍲', label: '火锅', colorClass: 'amber' },
  ktv: { icon: '🎤', label: 'KTV', colorClass: 'purple' },
  movie: { icon: '🎬', label: '电影', colorClass: 'purple' },
  game: { icon: '🎮', label: '游戏', colorClass: 'purple' },
  drink: { icon: '🍺', label: '喝酒', colorClass: 'amber' },
  coffee: { icon: '☕', label: '咖啡', colorClass: 'amber' },
  hiking: { icon: '🥾', label: '徒步', colorClass: 'mint' },
  other: { icon: '📌', label: '其他', colorClass: 'blue' },
}

// 活动数据类型
interface ActivityData {
  id: string
  title: string
  type: string
  startAt: string
  locationName: string
  currentParticipants: number
  maxParticipants: number
  creatorId?: string
}

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false,
    },
    // 活动数据
    activity: {
      type: Object,
      value: {},
    },
    // 是否已报名
    joined: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    visible: false,
    activityData: null as ActivityData | null,
    typeIcon: '📌',
    typeLabel: '活动',
    colorClass: 'blue',
    formattedTime: '',
    spotsLeft: 0,
    isFull: false,
    isJoined: false,
  },

  observers: {
    'show': function(show: boolean) {
      this.setData({ visible: show })
    },
    'activity': function(activity: ActivityData) {
      if (!activity || !activity.id) {
        this.setData({ activityData: null })
        return
      }
      
      // 更新类型信息
      const typeConfig = TYPE_CONFIG[activity.type] || TYPE_CONFIG.other
      
      // 格式化时间
      const formattedTime = this.formatTime(activity.startAt)
      
      // 计算剩余名额
      const spotsLeft = Math.max(0, activity.maxParticipants - activity.currentParticipants)
      const isFull = spotsLeft === 0
      
      this.setData({
        activityData: activity,
        typeIcon: typeConfig.icon,
        typeLabel: typeConfig.label,
        colorClass: typeConfig.colorClass,
        formattedTime,
        spotsLeft,
        isFull,
      })
    },
    'joined': function(joined: boolean) {
      this.setData({ isJoined: joined })
    },
  },

  methods: {
    /**
     * 格式化时间
     */
    formatTime(dateStr: string): string {
      if (!dateStr) return ''
      
      const date = new Date(dateStr)
      const now = new Date()
      
      // 判断是否是今天
      const isToday = date.toDateString() === now.toDateString()
      
      // 判断是否是明天
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const isTomorrow = date.toDateString() === tomorrow.toDateString()
      
      // 格式化时间
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const timeStr = `${hours}:${minutes}`
      
      if (isToday) {
        return `今天 ${timeStr}`
      }
      
      if (isTomorrow) {
        return `明天 ${timeStr}`
      }
      
      // 判断是否是本周
      const dayOfWeek = date.getDay()
      const daysUntil = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntil > 0 && daysUntil < 7) {
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        return `${weekDays[dayOfWeek]} ${timeStr}`
      }
      
      // 其他日期
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${month}月${day}日 ${timeStr}`
    },

    /**
     * 查看详情
     */
    onViewDetail() {
      const activity = this.data.activityData
      if (!activity?.id) return
      
      // 触感反馈
      wx.vibrateShort({ type: 'light' })
      
      // 跳转到活动详情页
      wx.navigateTo({
        url: `/subpackages/activity/detail/index?id=${activity.id}`,
      })
      
      // 触发事件
      this.triggerEvent('viewdetail', { activityId: activity.id })
    },

    /**
     * 直接报名
     */
    onJoin() {
      const activity = this.data.activityData
      if (!activity?.id) return
      
      // 检查是否已满员或已报名
      if (this.data.isFull || this.data.isJoined) return
      
      // 触感反馈
      wx.vibrateShort({ type: 'light' })
      
      // 检查是否已绑定手机号
      const userStore = useUserStore.getState()
      const user = userStore.user
      
      if (!user?.phoneNumber) {
        // 未绑定手机号，显示绑定弹窗
        const appStore = useAppStore.getState()
        appStore.showAuthSheet({
          type: 'join',
          payload: { activityId: activity.id },
        })
        return
      }
      
      // 触发报名事件
      this.triggerEvent('join', { activityId: activity.id })
    },

    /**
     * 隐藏浮层
     */
    hide() {
      this.setData({ visible: false })
      this.triggerEvent('hide')
    },

    /**
     * 显示浮层
     */
    show() {
      this.setData({ visible: true })
      this.triggerEvent('show')
    },
  },
})
