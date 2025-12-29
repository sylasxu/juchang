/**
 * Widget Launcher 组件 (Composite Widget)
 * Requirements: Composite Widget Design, 功能外露
 * 
 * 组局发射台 - 三层结构复合型卡片
 * - Header: 图标 + 标题"发起活动" + Badge"AI 辅助中"
 * - Body: 双栏功能区（极速建局 / 探索附近）
 * - Footer: 辅助工具网格（掷骰子、AA计算、发起投票）
 */

// 辅助工具配置
const TOOLS = [
  { key: 'dice', label: '掷骰子', icon: 'app' },
  { key: 'split', label: 'AA计算', icon: 'calculation' },
  { key: 'vote', label: '发起投票', icon: 'chart-bar' },
];

interface Tool {
  key: string;
  label: string;
  icon: string;
}

interface ComponentData {
  tools: Tool[];
}

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 是否显示 AI 辅助中 Badge
    showBadge: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    tools: TOOLS,
  },

  methods: {
    /**
     * 点击极速建局
     * 粘贴群接龙文本，AI 一键提取
     */
    onQuickCreate() {
      // 触感反馈
      wx.vibrateShort({ type: 'light' });
      
      // 触发事件
      this.triggerEvent('quickcreate');
      
      // 读取剪贴板
      wx.getClipboardData({
        success: (res) => {
          if (res.data) {
            this.triggerEvent('paste', { text: res.data });
          }
        },
      });
    },

    /**
     * 点击探索附近
     * 在地图上找灵感
     */
    onExplore() {
      // 触感反馈
      wx.vibrateShort({ type: 'light' });
      
      // 触发事件
      this.triggerEvent('explore');
      
      // 跳转到沉浸式地图页
      wx.navigateTo({
        url: '/subpackages/activity/explore/index',
      });
    },

    /**
     * 点击辅助工具
     */
    onToolTap(e: WechatMiniprogram.TouchEvent) {
      const { key } = e.currentTarget.dataset;
      if (!key) return;
      
      // 触感反馈
      wx.vibrateShort({ type: 'light' });
      
      // 触发事件
      this.triggerEvent('tooltap', { tool: key });
      
      // 根据工具类型执行不同操作
      switch (key) {
        case 'dice':
          this.rollDice();
          break;
        case 'split':
          this.openSplitCalculator();
          break;
        case 'vote':
          this.createVote();
          break;
      }
    },

    /**
     * 掷骰子
     */
    rollDice() {
      const result = Math.floor(Math.random() * 6) + 1;
      wx.showToast({
        title: `🎲 掷出了 ${result} 点`,
        icon: 'none',
        duration: 2000,
      });
      this.triggerEvent('diceroll', { result });
    },

    /**
     * AA 计算器
     */
    openSplitCalculator() {
      // TODO: 跳转到 AA 计算页面或弹出计算器
      wx.showToast({
        title: 'AA 计算功能开发中',
        icon: 'none',
      });
    },

    /**
     * 发起投票
     */
    createVote() {
      // TODO: 跳转到投票创建页面
      wx.showToast({
        title: '投票功能开发中',
        icon: 'none',
      });
    },
  },
});
