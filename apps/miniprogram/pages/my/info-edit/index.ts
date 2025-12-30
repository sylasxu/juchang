/**
 * 个人资料编辑页面
 */
import { getUsersById, putUsersById } from '../../../src/api/endpoints/users/users';
import type { GetUsersById200, UserUpdateRequest } from '../../../src/api/model';

interface UserInfoForm {
  nickname: string;
  gender: 'male' | 'female' | 'unknown';
  bio: string;
  avatarUrl: string;
}

interface InfoEditPageData {
  userId: string;
  userInfo: UserInfoForm;
  genderOptions: Array<{
    label: string;
    value: 'male' | 'female' | 'unknown';
  }>;
  isLoading: boolean;
  isSaving: boolean;
}

Page<InfoEditPageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    userId: '',
    userInfo: {
      nickname: '',
      gender: 'unknown',
      bio: '',
      avatarUrl: '',
    },
    genderOptions: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
      { label: '保密', value: 'unknown' },
    ],
    isLoading: false,
    isSaving: false,
  },

  onLoad() {
    this.loadUserInfo();
  },

  // 加载用户信息
  async loadUserInfo() {
    const cachedUserInfo = wx.getStorageSync('userInfo') as { id?: string } | null;
    if (!cachedUserInfo?.id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateBack();
      return;
    }

    this.setData({ isLoading: true, userId: cachedUserInfo.id });

    try {
      const response = await getUsersById(cachedUserInfo.id);
      if (response.status === 200) {
        const apiUser = response.data as GetUsersById200;
        this.setData({
          userInfo: {
            nickname: apiUser.nickname || '',
            gender: 'unknown', // TODO: 后端需要添加 gender 字段
            bio: '', // TODO: 后端需要添加 bio 字段
            avatarUrl: apiUser.avatarUrl || '',
          },
        });
      } else {
        throw new Error('加载失败');
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 昵称变更
  onNicknameChange(e: WechatMiniprogram.Input) {
    this.setData({ 'userInfo.nickname': e.detail.value });
  },

  // 性别变更
  onGenderChange(e: WechatMiniprogram.RadioGroupChange) {
    this.setData({
      'userInfo.gender': e.detail.value as 'male' | 'female' | 'unknown',
    });
  },

  // 个人简介变更
  onBioChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ 'userInfo.bio': e.detail.value });
  },

  // 选择头像
  async onChooseAvatar() {
    try {
      const res = await new Promise<WechatMiniprogram.ChooseMediaSuccessCallbackResult>(
        (resolve, reject) => {
          wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: resolve,
            fail: reject,
          });
        }
      );

      if (res.tempFiles && res.tempFiles.length > 0) {
        const tempFilePath = res.tempFiles[0].tempFilePath;

        wx.showLoading({ title: '上传中...' });

        // TODO: 实现头像上传到服务器
        // 目前直接使用本地路径
        this.setData({ 'userInfo.avatarUrl': tempFilePath });

        wx.hideLoading();
        wx.showToast({ title: '头像已选择', icon: 'success' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('选择头像失败:', error);
    }
  },

  // 保存用户信息
  async onSaveInfo() {
    const { userInfo, userId } = this.data;

    // 验证必填字段
    if (!userInfo.nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    this.setData({ isSaving: true });

    try {
      const updateParams: UserUpdateRequest = {
        nickname: userInfo.nickname.trim(),
        avatarUrl: userInfo.avatarUrl || undefined,
      };

      const response = await putUsersById(userId, updateParams);

      if (response.status === 200) {
        // 更新本地存储
        const cachedUserInfo = wx.getStorageSync('userInfo') || {};
        wx.setStorageSync('userInfo', {
          ...cachedUserInfo,
          nickname: updateParams.nickname,
          avatarUrl: updateParams.avatarUrl,
        });

        wx.showToast({ title: '保存成功', icon: 'success' });

        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        const errorData = response.data as { msg?: string };
        throw new Error(errorData?.msg || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      wx.showToast({
        title: (error as Error).message || '保存失败',
        icon: 'none',
      });
    } finally {
      this.setData({ isSaving: false });
    }
  },
});
