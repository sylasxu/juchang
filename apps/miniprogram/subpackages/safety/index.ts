/**
 * 安全中心页面
 * Requirements: 21.1-21.7
 */

interface PageData {
  safetyTips: string[];
  emergencyPhone: string;
}

Page({
  data: {
    safetyTips: [
      '选择公共场所见面，避免偏僻地点',
      '提前告知朋友或家人你的行程',
      '保持手机电量充足，通讯畅通',
      '第一次见面不要透露过多个人信息',
      '如感到不适，可随时离开',
    ],
    emergencyPhone: '400-xxx-xxxx',
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '安全中心' });
  },

  /** 查看安全须知 */
  onSafetyTipsTap() {
    // 已在页面展示，可跳转到详情页
  },

  /** 举报入口 */
  onReportTap() {
    wx.showActionSheet({
      itemList: ['虚假信息', '骚扰行为', '违法内容', '其他'],
      success: (res) => {
        const reportTypes = ['fake_info', 'harassment', 'illegal', 'other'];
        const type = reportTypes[res.tapIndex];
        this.showReportDialog(type);
      },
    });
  },

  /** 显示举报对话框 */
  showReportDialog(type: string) {
    wx.showModal({
      title: '提交举报',
      content: '请描述具体问题，我们会尽快处理',
      editable: true,
      placeholderText: '请输入举报内容...',
      success: (res) => {
        if (res.confirm && res.content) {
          this.submitReport(type, res.content);
        }
      },
    });
  },

  /** 提交举报 */
  async submitReport(type: string, content: string) {
    // TODO: 调用举报 API
    wx.showToast({
      title: '已收到举报，我们会尽快处理',
      icon: 'none',
      duration: 2000,
    });
  },

  /** 紧急联系 */
  onEmergencyTap() {
    wx.showModal({
      title: '紧急联系',
      content: `客服电话：${this.data.emergencyPhone}`,
      confirmText: '拨打',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: this.data.emergencyPhone.replace(/-/g, ''),
          });
        }
      },
    });
  },

  /** 黑名单管理 */
  onBlacklistTap() {
    // TODO: 跳转到黑名单管理页面
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },
});
