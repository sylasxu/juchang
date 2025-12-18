/**
 * 聚场小程序入口
 * Requirements: 15.3 - 解析启动scene参数，直接跳转活动详情
 */
import config from './config';
import Mock from './mock/index';
import createBus from './utils/eventBus';
import { connectSocket, fetchUnreadNum } from './mock/chat';

if (config.isMock) {
  Mock();
}

interface GlobalData {
  userInfo: {
    id: string;
    nickname: string;
    avatarUrl: string;
  } | null;
  unreadNum: number;
  socket: WechatMiniprogram.SocketTask | null;
}

interface AppInstance {
  globalData: GlobalData;
  eventBus: ReturnType<typeof createBus>;
  connect(): void;
  getUnreadNum(): void;
  setUnreadNum(unreadNum: number): void;
  handleSceneParams(options: LaunchOptions): void;
}

interface LaunchOptions {
  path: string;
  query: Record<string, string>;
  scene: number;
  referrerInfo?: {
    appId: string;
    extraData?: Record<string, unknown>;
  };
}

App<AppInstance>({
  onLaunch(options: LaunchOptions) {
    // 版本更新检查
    const updateManager = wx.getUpdateManager();

    updateManager.onCheckForUpdate(() => {
      // 检查更新
    });

    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        },
      });
    });

    // 处理场景参数 (Requirements: 15.3)
    this.handleSceneParams(options);

    // 初始化
    this.getUnreadNum();
    this.connect();
  },

  globalData: {
    userInfo: null,
    unreadNum: 0,
    socket: null,
  },

  /** 全局事件总线 */
  eventBus: createBus(),

  /**
   * 处理场景参数 (Requirements: 15.3)
   * 解析启动scene参数，直接跳转活动详情
   */
  handleSceneParams(options: LaunchOptions) {
    const { scene, query } = options;

    // 场景值说明：
    // 1007 - 单人聊天会话中的小程序消息卡片
    // 1008 - 群聊会话中的小程序消息卡片
    // 1011 - 扫描二维码
    // 1012 - 长按图片识别二维码
    // 1013 - 扫描手机相册中选取的二维码
    // 1047 - 扫描小程序码
    // 1048 - 长按图片识别小程序码
    // 1049 - 扫描手机相册中选取的小程序码

    // 如果有活动ID参数，跳转到活动详情
    if (query.id || query.activityId) {
      const activityId = query.id || query.activityId;

      // 延迟跳转，确保首页加载完成
      setTimeout(() => {
        wx.navigateTo({
          url: `/subpackages/activity/detail/index?id=${activityId}`,
          fail: () => {
            // 如果跳转失败（可能是分包未加载），使用 reLaunch
            wx.reLaunch({
              url: `/subpackages/activity/detail/index?id=${activityId}`,
            });
          },
        });
      }, 500);
    }

    // 处理分享场景
    if (query.scene) {
      try {
        // scene 参数是 encodeURIComponent 编码的
        const sceneParams = decodeURIComponent(query.scene);
        const params = new URLSearchParams(sceneParams);
        const activityId = params.get('id') || params.get('activityId');

        if (activityId) {
          setTimeout(() => {
            wx.navigateTo({
              url: `/subpackages/activity/detail/index?id=${activityId}`,
              fail: () => {
                wx.reLaunch({
                  url: `/subpackages/activity/detail/index?id=${activityId}`,
                });
              },
            });
          }, 500);
        }
      } catch (error) {
        console.error('解析 scene 参数失败', error);
      }
    }
  },

  /** 初始化WebSocket */
  connect() {
    const socket = connectSocket();
    socket.onMessage((result: { data: string | ArrayBuffer }) => {
      const parsedData = JSON.parse(result.data as string) as {
        type: string;
        data: {
          message?: {
            read: boolean;
          };
        };
      };
      if (parsedData.type === 'message' && parsedData.data.message && !parsedData.data.message.read) {
        this.setUnreadNum(this.globalData.unreadNum + 1);
      }
    });
    this.globalData.socket = socket as unknown as WechatMiniprogram.SocketTask;
  },

  /** 获取未读消息数量 */
  getUnreadNum() {
    fetchUnreadNum().then((result: { data: number }) => {
      this.globalData.unreadNum = result.data;
      this.eventBus.emit('unread-num-change', result.data);
    });
  },

  /** 设置未读消息数量 */
  setUnreadNum(unreadNum: number) {
    this.globalData.unreadNum = unreadNum;
    this.eventBus.emit('unread-num-change', unreadNum);
  },
});
