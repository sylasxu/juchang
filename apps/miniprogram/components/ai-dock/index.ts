/**
 * AI Dock 组件 (Floating Capsule)
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 15.1, 15.17
 * 
 * Chat-First 架构的超级输入坞
 * - 悬浮胶囊样式（距离底部/左右 32rpx，圆角 48rpx）
 * - Halo Card 渐变边框效果
 * - 输入框（placeholder: "粘贴文字，或直接告诉我..."）
 * - [📋 粘贴] 和 [🎤 语音] 快捷按钮
 * - 键盘弹起处理（adjust-position=false + 手动计算高度）
 * - 800ms 防抖机制
 * - 按钮 Scale Down 回弹效果 + wx.vibrateShort 触感反馈
 */

// 防抖定时器 (模块级变量)
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

// 录音计时器 (模块级变量)
let _recordingTimer: ReturnType<typeof setInterval> | null = null;

// 防抖延迟时间 (ms) - Requirements: 5.8
const _DEBOUNCE_DELAY = 800;

Component({
  options: {
    styleIsolation: 'apply-shared',
  },

  properties: {
    // 提示文案
    placeholder: {
      type: String,
      value: '想找点乐子？还是想约人？跟我说说。',
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    inputValue: '',
    isFocused: false,
    isRecording: false,
    recordingDuration: 0,
    keyboardHeight: 0,
    bottomOffset: 32, // 默认底部偏移 32rpx
    safeAreaBottom: 0,
  },

  lifetimes: {
    attached() {
      this.initSafeArea();
      this.bindKeyboardEvents();
    },

    detached() {
      // 清理防抖定时器
      if (_debounceTimer) {
        clearTimeout(_debounceTimer);
        _debounceTimer = null;
      }
      // 清理录音定时器
      this.stopRecordingTimer();
    },
  },

  methods: {
    /**
     * 初始化安全区域
     */
    initSafeArea() {
      try {
        const systemInfo = wx.getSystemInfoSync();
        const safeAreaBottom = systemInfo.safeArea 
          ? systemInfo.screenHeight - systemInfo.safeArea.bottom 
          : 0;
        this.setData({ safeAreaBottom });
      } catch (error) {
        console.error('获取安全区域失败', error);
      }
    },

    /**
     * 绑定键盘事件
     * Requirements: 5.4 - 键盘弹起处理
     */
    bindKeyboardEvents() {
      // 监听键盘高度变化
      wx.onKeyboardHeightChange((res) => {
        const keyboardHeight = res.height;
        // 将 px 转换为 rpx (假设设计稿宽度 750rpx)
        const systemInfo = wx.getSystemInfoSync();
        const ratio = 750 / systemInfo.windowWidth;
        const keyboardHeightRpx = keyboardHeight * ratio;
        
        this.setData({
          keyboardHeight: keyboardHeightRpx,
          // 键盘弹起时，底部偏移 = 键盘高度 + 16rpx 间距
          bottomOffset: keyboardHeight > 0 ? keyboardHeightRpx + 16 : 32,
        });
      });
    },

    /**
     * 输入框聚焦
     * Requirements: 5.4
     */
    onInputFocus() {
      this.setData({ isFocused: true });
      this.triggerEvent('focus');
    },

    /**
     * 输入框失焦
     */
    onInputBlur() {
      this.setData({ isFocused: false });
      this.triggerEvent('blur');
    },

    /**
     * 输入内容变化
     * Requirements: 5.7, 5.8 - 800ms 防抖
     */
    onInputChange(e: WechatMiniprogram.Input) {
      const value = e.detail.value;
      this.setData({ inputValue: value });

      // 清除之前的防抖定时器
      if (_debounceTimer) {
        clearTimeout(_debounceTimer);
      }

      // 如果输入为空，不触发解析
      if (!value.trim()) {
        return;
      }

      // 防抖：800ms 后触发 AI 解析 - Requirements: 5.8
      _debounceTimer = setTimeout(() => {
        this.triggerEvent('parse', { text: value });
      }, _DEBOUNCE_DELAY);
    },

    /**
     * 确认输入（按回车或点击发送）
     * Requirements: 5.7
     */
    onInputConfirm() {
      const value = this.data.inputValue.trim();
      if (!value) return;

      // 清除防抖定时器，立即触发
      if (_debounceTimer) {
        clearTimeout(_debounceTimer);
        _debounceTimer = null;
      }

      // 触感反馈
      wx.vibrateShort({ type: 'light' });

      this.triggerEvent('send', { text: value });
      this.setData({ inputValue: '' });
    },

    /**
     * 点击发送按钮
     */
    onSendTap() {
      this.onInputConfirm();
    },

    /**
     * 点击粘贴按钮
     * Requirements: 5.5
     */
    onPasteTap() {
      // 触感反馈 - Requirements: 15.17
      wx.vibrateShort({ type: 'light' });

      wx.getClipboardData({
        success: (res) => {
          if (res.data) {
            this.setData({ inputValue: res.data });
            this.triggerEvent('paste', { text: res.data });
            
            // 自动触发解析
            if (_debounceTimer) {
              clearTimeout(_debounceTimer);
            }
            _debounceTimer = setTimeout(() => {
              this.triggerEvent('parse', { text: res.data });
            }, _DEBOUNCE_DELAY);
          } else {
            wx.showToast({ title: '剪贴板为空', icon: 'none' });
          }
        },
        fail: () => {
          wx.showToast({ title: '读取剪贴板失败', icon: 'none' });
        },
      });
    },

    /**
     * 点击语音按钮
     * Requirements: 5.6
     */
    onVoiceTap() {
      // 触感反馈 - Requirements: 15.17
      wx.vibrateShort({ type: 'light' });

      if (this.data.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    },

    /**
     * 开始录音
     * Requirements: 5.6
     */
    async startRecording() {
      try {
        // 检查录音权限
        const setting = await wx.getSetting();
        if (!setting.authSetting['scope.record']) {
          await wx.authorize({ scope: 'scope.record' });
        }

        this.setData({ isRecording: true, recordingDuration: 0 });

        // 创建录音管理器
        const recorderManager = wx.getRecorderManager();

        recorderManager.onStart(() => {
          console.log('录音开始');
          this.startRecordingTimer();
        });

        recorderManager.onStop((res) => {
          console.log('录音结束', res);
          this.setData({ isRecording: false });
          this.stopRecordingTimer();
          this.recognizeVoice(res.tempFilePath);
        });

        recorderManager.onError((err) => {
          console.error('录音错误', err);
          this.setData({ isRecording: false });
          this.stopRecordingTimer();
          wx.showToast({ title: '录音失败', icon: 'none' });
        });

        // 开始录音
        recorderManager.start({
          duration: 60000, // 最长60秒
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000,
          format: 'mp3',
        });
      } catch (error) {
        console.error('录音权限获取失败', error);
        wx.showModal({
          title: '需要录音权限',
          content: '请在设置中开启录音权限以使用语音输入',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          },
        });
      }
    },

    /**
     * 停止录音
     */
    stopRecording() {
      const recorderManager = wx.getRecorderManager();
      recorderManager.stop();
    },

    startRecordingTimer() {
      _recordingTimer = setInterval(() => {
        this.setData({
          recordingDuration: this.data.recordingDuration + 1,
        });
      }, 1000);
    },

    stopRecordingTimer() {
      if (_recordingTimer) {
        clearInterval(_recordingTimer);
        _recordingTimer = null;
      }
    },

    /**
     * 语音识别
     * Requirements: 5.6
     */
    async recognizeVoice(filePath: string) {
      wx.showLoading({ title: '识别中...' });

      try {
        // 使用微信同声传译插件
        const plugin = requirePlugin('WechatSI');
        
        plugin.manager.translate({
          lfrom: 'zh_CN',
          lto: 'zh_CN',
          content: filePath,
          tts: false,
          success: (res: { retcode: number; result: string }) => {
            wx.hideLoading();
            if (res.retcode === 0 && res.result) {
              this.setData({ inputValue: res.result });
              this.triggerEvent('voice', { text: res.result });
              
              // 自动触发解析
              if (_debounceTimer) {
                clearTimeout(_debounceTimer);
              }
              _debounceTimer = setTimeout(() => {
                this.triggerEvent('parse', { text: res.result });
              }, _DEBOUNCE_DELAY);
            } else {
              wx.showToast({ title: '识别失败，请重试', icon: 'none' });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '识别失败，请重试', icon: 'none' });
          },
        });
      } catch (error) {
        wx.hideLoading();
        console.error('语音识别失败', error);
        wx.showToast({ title: '语音识别暂不可用', icon: 'none' });
      }
    },

    /**
     * 清空输入
     */
    onClearTap() {
      // 触感反馈
      wx.vibrateShort({ type: 'light' });
      
      this.setData({ inputValue: '' });
      
      if (_debounceTimer) {
        clearTimeout(_debounceTimer);
        _debounceTimer = null;
      }
    },

    /**
     * 设置输入值（供外部调用）
     */
    setValue(value: string) {
      this.setData({ inputValue: value });
    },

    /**
     * 清空并聚焦（供外部调用）
     */
    clearAndFocus() {
      this.setData({ inputValue: '', isFocused: true });
    },
  },
});
