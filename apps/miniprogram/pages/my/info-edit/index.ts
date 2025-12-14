import { getUserInfo, updateUserInfo, uploadAvatar } from '../../../src/api/user'
import type { User, UpdateUserParams } from '../../../src/api/user'

interface UserInfoForm {
  nickname: string
  gender: 'male' | 'female' | 'unknown'
  bio: string
  avatarUrl: string
}

interface InfoEditPageData {
  userInfo: UserInfoForm
  genderOptions: Array<{
    label: string
    value: 'male' | 'female' | 'unknown'
  }>
  isLoading: boolean
  isSaving: boolean
  birthVisible: boolean
  birthStart: string
  birthEnd: string
  birthTime: number
  birthFilter: (type: string, options: any[]) => any[]
  addressText: string
  addressVisible: boolean
  provinces: any[]
  cities: any[]
  gridConfig: {
    column: number
    width: number
    height: number
  }
}

Page<InfoEditPageData>({
  data: {
    userInfo: {
      nickname: '',
      gender: 'unknown',
      bio: '',
      avatarUrl: '',
    },
    genderOptions: [
      {
        label: '男',
        value: 'male',
      },
      {
        label: '女',
        value: 'female',
      },
      {
        label: '保密',
        value: 'unknown',
      },
    ],
    isLoading: false,
    isSaving: false,
    birthVisible: false,
    birthStart: '1970-01-01',
    birthEnd: '2025-03-01',
    birthTime: 0,
    birthFilter: (type: string, options: any[]) => (type === 'year' ? options.sort((a, b) => b.value - a.value) : options),
    addressText: '',
    addressVisible: false,
    provinces: [],
    cities: [],

    gridConfig: {
      column: 3,
      width: 160,
      height: 160,
    },
  },

  onLoad() {
    this.loadUserInfo();
  },

  // 加载用户信息
  async loadUserInfo() {
    this.setData({ isLoading: true });
    
    try {
      const userInfo = await getUserInfo();
      this.setData({
        userInfo: {
          nickname: userInfo.nickname || '',
          gender: userInfo.gender || 'unknown',
          bio: userInfo.bio || '',
          avatarUrl: userInfo.avatarUrl || '',
        }
      });
    } catch (error: any) {
      console.error('加载用户信息失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  getAreaOptions(data: Record<string, string>, filter?: (item: any) => boolean) {
    const res = Object.keys(data).map((key) => ({ value: key, label: data[key] }));
    return typeof filter === 'function' ? res.filter(filter) : res;
  },

  getCities(provinceValue: string) {
    // 这里需要导入 areaList，暂时返回空数组
    return [];
  },

  initAreaData() {
    // 暂时不实现地区选择功能
  },

  onAreaPick(e: WechatMiniprogram.CustomEvent) {
    // 暂时不实现
  },

  showPicker(e: WechatMiniprogram.TouchEvent) {
    const { mode } = e.currentTarget.dataset;
    this.setData({
      [`${mode}Visible`]: true,
    });
  },

  hidePicker(e: WechatMiniprogram.TouchEvent) {
    const { mode } = e.currentTarget.dataset;
    this.setData({
      [`${mode}Visible`]: false,
    });
  },

  onPickerChange(e: WechatMiniprogram.CustomEvent) {
    const { value, label } = e.detail;
    const { mode } = e.currentTarget.dataset;

    this.setData({
      [`personInfo.${mode}`]: value,
    });
    if (mode === 'address') {
      this.setData({
        addressText: label.join(' '),
      });
    }
  },

  // 昵称变更
  onNicknameChange(e: WechatMiniprogram.Input) {
    this.setData({
      'userInfo.nickname': e.detail.value
    });
  },

  // 性别变更
  onGenderChange(e: WechatMiniprogram.RadioGroupChange) {
    this.setData({
      'userInfo.gender': e.detail.value as 'male' | 'female' | 'unknown'
    });
  },

  // 个人简介变更
  onBioChange(e: WechatMiniprogram.TextareaInput) {
    this.setData({
      'userInfo.bio': e.detail.value
    });
  },

  // 选择头像
  async onChooseAvatar() {
    try {
      const res = await new Promise<WechatMiniprogram.ChooseMediaSuccessCallbackResult>((resolve, reject) => {
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['album', 'camera'],
          success: resolve,
          fail: reject
        });
      });

      if (res.tempFiles && res.tempFiles.length > 0) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        wx.showLoading({ title: '上传中...' });
        
        // 上传头像
        const uploadResult = await uploadAvatar(tempFilePath);
        
        this.setData({
          'userInfo.avatarUrl': uploadResult.url
        });
        
        wx.hideLoading();
        wx.showToast({
          title: '头像上传成功',
          icon: 'success'
        });
      }
    } catch (error: any) {
      wx.hideLoading();
      console.error('上传头像失败:', error);
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },

  // 保存用户信息
  async onSaveInfo() {
    const { userInfo } = this.data;
    
    // 验证必填字段
    if (!userInfo.nickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    this.setData({ isSaving: true });

    try {
      const updateParams: UpdateUserParams = {
        nickname: userInfo.nickname.trim(),
        gender: userInfo.gender,
        bio: userInfo.bio.trim(),
        avatarUrl: userInfo.avatarUrl
      };

      const updatedUser = await updateUserInfo(updateParams);
      
      // 更新本地存储
      wx.setStorageSync('userInfo', updatedUser);
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error: any) {
      console.error('保存失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isSaving: false });
    }
  },
});