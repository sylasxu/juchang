/**
 * 靠谱度徽章组件
 * Requirements: 14.1, 14.2, 14.3, 14.4
 *
 * 简化的徽章式靠谱度展示
 * - rate > 90% → 🏅 超靠谱
 * - 80% < rate ≤ 90% → ✓ 靠谱
 * - rate ≤ 80% 或新用户 → 🆕 新人
 */

type BadgeType = 'super' | 'normal' | 'new';

interface BadgeDisplay {
  icon: string;
  label: string;
  type: BadgeType;
}

/**
 * 根据履约率计算徽章显示
 * @param rate 履约率 0-100，-1表示新用户
 */
function getReliabilityDisplay(rate: number): BadgeDisplay {
  // 新用户或履约率 ≤ 80%
  if (rate === -1 || rate <= 80) {
    return { icon: '🆕', label: '新人', type: 'new' };
  }
  // 超靠谱：履约率 > 90%
  if (rate > 90) {
    return { icon: '🏅', label: '超靠谱', type: 'super' };
  }
  // 靠谱：80% < 履约率 ≤ 90%
  return { icon: '✓', label: '靠谱', type: 'normal' };
}

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 履约率 0-100，-1表示新用户
    rate: {
      type: Number,
      value: -1,
    },
    // 是否显示文字标签
    showLabel: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    badgeIcon: '🆕',
    badgeLabel: '新人',
    badgeType: 'new' as BadgeType,
  },

  observers: {
    rate(newRate: number) {
      const display = getReliabilityDisplay(newRate);
      this.setData({
        badgeIcon: display.icon,
        badgeLabel: display.label,
        badgeType: display.type,
      });
    },
  },

  lifetimes: {
    attached() {
      // 初始化时计算徽章
      const display = getReliabilityDisplay(this.properties.rate as number);
      this.setData({
        badgeIcon: display.icon,
        badgeLabel: display.label,
        badgeType: display.type,
      });
    },
  },
});

// 导出计算函数供其他地方使用
export { getReliabilityDisplay };
