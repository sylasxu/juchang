/**
 * 创建活动页面
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 19.3, 19.4
 * - 实现表单字段（标题/描述/时间/地点/人数/费用等）
 * - 位置选择强制填写位置备注
 * - 隐私设置（模糊地理位置）
 * - 必填字段校验
 * - 调用创建活动API
 * - 推广选项（Boost/Pin+）
 * - 活动发布额度检查
 */
import { postActivities } from '../../../src/api/index';
import {
  postTransactionsBoost,
  postTransactionsPinPlus,
} from '../../../src/api/endpoints/transactions/transactions';
import type { ActivityCreateRequest } from '../../../src/api/model';
import {
  checkActivityCreateQuota,
  consumeActivityCreateQuota,
  showActivityCreateQuotaExhaustedTip,
} from '../../../src/services/quota';

// 类型定义
interface PickerOption {
  label: string;
  value: string;
}

interface ActivityForm {
  title: string;
  description: string;
  images: string[];
  locationName: string;
  address: string;
  locationHint: string;
  latitude: number | null;
  longitude: number | null;
  startAt: string;
  endAt: string;
  type: string;
  maxParticipants: number;
  feeType: string;
  estimatedCost: string;
  joinMode: string;
  genderRequirement: string;
  minReliabilityRate: string;
  isLocationBlurred: boolean;
}

interface PageData {
  form: ActivityForm;
  enableBoost: boolean;
  enablePinPlus: boolean;
  boostPrice: number;
  pinPlusPrice: number;
  activityTypes: PickerOption[];
  feeTypes: PickerOption[];
  joinModes: PickerOption[];
  showTypePicker: boolean;
  showFeeTypePicker: boolean;
  showJoinModePicker: boolean;
  showStartTimePicker: boolean;
  showEndTimePicker: boolean;
  isSubmitting: boolean;
  maxImageCount: number;
}

interface PageOptions {
  lat?: string;
  lng?: string;
  ghostType?: string;
  // AI 预填数据 - Requirements: 8.7
  title?: string;
  type?: string;
  startAt?: string;
  maxParticipants?: string;
  locationName?: string;
  description?: string;
  aiText?: string;
}

interface WxPaymentParams {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'MD5' | 'HMAC-SHA256' | 'RSA';
  paySign: string;
}

// 活动类型选项
const ACTIVITY_TYPES: PickerOption[] = [
  { label: '美食', value: 'food' },
  { label: '娱乐', value: 'entertainment' },
  { label: '运动', value: 'sports' },
  { label: '学习', value: 'study' },
  { label: '旅行', value: 'travel' },
  { label: '其他', value: 'other' },
];

// 费用类型选项
const FEE_TYPES: PickerOption[] = [
  { label: '免费', value: 'free' },
  { label: 'AA制', value: 'aa' },
  { label: '固定费用', value: 'fixed' },
  { label: '请客', value: 'treat' },
];

// 加入模式选项
const JOIN_MODES: PickerOption[] = [
  { label: '自动通过', value: 'auto' },
  { label: '需要审批', value: 'approval' },
];

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    // 表单数据 (Requirements: 7.1)
    form: {
      title: '',
      description: '',
      images: [],
      locationName: '',
      address: '',
      locationHint: '', // 位置备注 (Requirements: 7.2)
      latitude: null,
      longitude: null,
      startAt: '',
      endAt: '',
      type: '',
      maxParticipants: 10,
      feeType: 'aa',
      estimatedCost: '',
      joinMode: 'approval',
      genderRequirement: '',
      minReliabilityRate: '',
      isLocationBlurred: false, // 模糊地理位置 (Requirements: 7.3)
    },

    // 增值服务 (Requirements: 7.6)
    enableBoost: false,
    enablePinPlus: false,
    boostPrice: 3,
    pinPlusPrice: 5,

    // 选项数据
    activityTypes: ACTIVITY_TYPES,
    feeTypes: FEE_TYPES,
    joinModes: JOIN_MODES,

    // 选择器状态
    showTypePicker: false,
    showFeeTypePicker: false,
    showJoinModePicker: false,
    showStartTimePicker: false,
    showEndTimePicker: false,

    // 提交状态
    isSubmitting: false,

    // 图片上传
    maxImageCount: 9,
  },

  onLoad(options: PageOptions) {
    // 检查登录状态 (Requirements: 16.2)
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再创建活动',
        showCancel: false,
        success: () => {
          wx.navigateTo({ url: '/pages/login/login' });
        },
      });
      return;
    }

    // 处理预填数据 - Requirements: 8.7
    const updates: Partial<ActivityForm> = {};

    // 位置信息
    if (options.lat && options.lng) {
      updates.latitude = parseFloat(options.lat);
      updates.longitude = parseFloat(options.lng);
    }
    if (options.locationName) {
      updates.locationName = decodeURIComponent(options.locationName);
    }

    // AI 预填数据
    if (options.title) {
      updates.title = decodeURIComponent(options.title);
    }
    if (options.type) {
      updates.type = options.type;
    }
    if (options.startAt) {
      updates.startAt = decodeURIComponent(options.startAt);
    }
    if (options.maxParticipants) {
      updates.maxParticipants = parseInt(options.maxParticipants, 10);
    }
    if (options.description) {
      updates.description = decodeURIComponent(options.description);
    }

    // 应用预填数据
    if (Object.keys(updates).length > 0) {
      const formUpdates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        formUpdates[`form.${key}`] = value;
      }
      this.setData(formUpdates as Partial<PageData>);
    }
  },

  // ==================== 表单输入处理 ====================

  onTitleInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.title': e.detail.value });
  },

  onDescriptionInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.description': e.detail.value });
  },

  onLocationHintInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.locationHint': e.detail.value });
  },

  onEstimatedCostInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.estimatedCost': e.detail.value });
  },

  onMinReliabilityInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.minReliabilityRate': e.detail.value });
  },

  onParticipantsChange(e: WechatMiniprogram.CustomEvent<{ value: number }>) {
    this.setData({ 'form.maxParticipants': e.detail.value });
  },

  onLocationBlurredChange(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    this.setData({ 'form.isLocationBlurred': e.detail.value });
  },

  // ==================== 选择器处理 ====================

  showTypePicker() {
    this.setData({ showTypePicker: true });
  },

  onTypeChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    const { value } = e.detail;
    this.setData({
      'form.type': value[0],
      showTypePicker: false,
    });
  },

  onTypePickerCancel() {
    this.setData({ showTypePicker: false });
  },

  showFeeTypePicker() {
    this.setData({ showFeeTypePicker: true });
  },

  onFeeTypeChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    const { value } = e.detail;
    this.setData({
      'form.feeType': value[0],
      showFeeTypePicker: false,
    });
  },

  onFeeTypePickerCancel() {
    this.setData({ showFeeTypePicker: false });
  },

  showJoinModePicker() {
    this.setData({ showJoinModePicker: true });
  },

  onJoinModeChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    const { value } = e.detail;
    this.setData({
      'form.joinMode': value[0],
      showJoinModePicker: false,
    });
  },

  onJoinModePickerCancel() {
    this.setData({ showJoinModePicker: false });
  },

  // ==================== 时间选择 ====================

  showStartTimePicker() {
    this.setData({ showStartTimePicker: true });
  },

  onStartTimeChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const { value } = e.detail;
    this.setData({
      'form.startAt': value,
      showStartTimePicker: false,
    });
  },

  onStartTimePickerCancel() {
    this.setData({ showStartTimePicker: false });
  },

  showEndTimePicker() {
    this.setData({ showEndTimePicker: true });
  },

  onEndTimeChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const { value } = e.detail;
    this.setData({
      'form.endAt': value,
      showEndTimePicker: false,
    });
  },

  onEndTimePickerCancel() {
    this.setData({ showEndTimePicker: false });
  },

  // ==================== 位置选择 ====================

  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.locationName': res.name || '',
          'form.address': res.address || '',
          'form.latitude': res.latitude,
          'form.longitude': res.longitude,
        });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '需要位置权限',
            content: '请在设置中开启位置权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            },
          });
        }
      },
    });
  },

  // ==================== 图片上传 ====================

  onImageSuccess(e: WechatMiniprogram.CustomEvent<{ files: Array<{ url?: string; path?: string }> }>) {
    const { files } = e.detail;
    const images = files.map((f) => f.url || f.path || '');
    this.setData({ 'form.images': images });
  },

  onImageRemove(e: WechatMiniprogram.CustomEvent<{ index: number }>) {
    const { index } = e.detail;
    const images = [...this.data.form.images];
    images.splice(index, 1);
    this.setData({ 'form.images': images });
  },

  // ==================== 增值服务 (Requirements: 7.6) ====================

  onBoostChange(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    this.setData({ enableBoost: e.detail.value });
  },

  onPinPlusChange(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    this.setData({ enablePinPlus: e.detail.value });
  },

  // ==================== 表单验证和提交 (Requirements: 7.4) ====================

  validateForm(): string[] {
    const { form } = this.data;
    const errors: string[] = [];

    if (!form.title || form.title.trim().length === 0) {
      errors.push('请输入活动标题');
    } else if (form.title.length > 100) {
      errors.push('活动标题不能超过100个字符');
    }

    if (!form.type) {
      errors.push('请选择活动类型');
    }

    if (!form.startAt) {
      errors.push('请选择活动开始时间');
    }

    if (!form.locationName || !form.latitude || !form.longitude) {
      errors.push('请选择活动地点');
    }

    // 位置备注强制填写 (Requirements: 7.2)
    if (form.latitude && form.longitude && (!form.locationHint || form.locationHint.trim().length === 0)) {
      errors.push('请填写位置备注（如"4楼平台入口"）');
    }

    if (form.maxParticipants < 2) {
      errors.push('参与人数至少为2人');
    }

    if (form.startAt && form.endAt) {
      const startTime = new Date(form.startAt).getTime();
      const endTime = new Date(form.endAt).getTime();
      if (endTime <= startTime) {
        errors.push('结束时间必须晚于开始时间');
      }
    }

    if (form.startAt) {
      const startTime = new Date(form.startAt).getTime();
      if (startTime < Date.now()) {
        errors.push('开始时间不能是过去的时间');
      }
    }

    if (form.estimatedCost && (isNaN(Number(form.estimatedCost)) || parseFloat(form.estimatedCost) < 0)) {
      errors.push('预估费用必须是有效的数字');
    }

    if (form.minReliabilityRate) {
      const rate = parseInt(form.minReliabilityRate, 10);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        errors.push('靠谱度门槛必须在0-100之间');
      }
    }

    return errors;
  },

  async onSubmit() {
    const errors = this.validateForm();
    if (errors.length > 0) {
      wx.showToast({
        title: errors[0],
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    // 检查活动发布额度 - Requirements: 19.3, 19.4
    if (!checkActivityCreateQuota()) {
      showActivityCreateQuotaExhaustedTip();
      return;
    }

    const { form, enableBoost, enablePinPlus } = this.data;

    this.setData({ isSubmitting: true });

    try {
      // 消耗活动发布额度
      consumeActivityCreateQuota();

      const requestData: ActivityCreateRequest = {
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        images: form.images.length > 0 ? form.images : undefined,
        locationName: form.locationName,
        address: form.address || undefined,
        locationHint: form.locationHint.trim(),
        location: [form.longitude, form.latitude], // GeoJSON格式 [lng, lat]
        startAt: new Date(form.startAt).toISOString() as unknown,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        type: form.type as ActivityCreateRequest['type'],
        maxParticipants: form.maxParticipants,
        feeType: form.feeType as ActivityCreateRequest['feeType'],
        estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
        joinMode: form.joinMode as ActivityCreateRequest['joinMode'],
        genderRequirement: form.genderRequirement || undefined,
        minReliabilityRate: form.minReliabilityRate ? parseInt(form.minReliabilityRate, 10) : undefined,
        isLocationBlurred: form.isLocationBlurred,
      };

      const response = await postActivities(requestData);

      if (response.status === 200) {
        const activityId = (response.data as { id: string }).id;

        if (enableBoost || enablePinPlus) {
          this.handlePremiumServices(activityId, enableBoost, enablePinPlus);
        } else {
          this.showSuccessAndShare(activityId);
        }
      } else {
        throw new Error((response.data as { msg?: string })?.msg || '创建活动失败');
      }
    } catch (error) {
      console.error('创建活动失败', error);
      wx.showToast({
        title: (error as Error).message || '创建失败，请重试',
        icon: 'none',
      });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  async handlePremiumServices(activityId: string, enableBoost: boolean, enablePinPlus: boolean) {
    const services: string[] = [];
    let totalPrice = 0;

    if (enableBoost) {
      services.push('Boost强力召唤');
      totalPrice += this.data.boostPrice;
    }
    if (enablePinPlus) {
      services.push('Pin+黄金置顶');
      totalPrice += this.data.pinPlusPrice;
    }

    wx.showModal({
      title: '购买增值服务',
      content: `您选择了${services.join('、')}服务，共需支付¥${totalPrice}`,
      confirmText: '去支付',
      cancelText: '稍后再说',
      success: async (res) => {
        if (res.confirm) {
          try {
            if (enableBoost) {
              const boostResponse = await postTransactionsBoost({ activityId });
              const boostData = boostResponse.data as { paymentParams?: WxPaymentParams };
              if (boostResponse.status === 200 && boostData?.paymentParams) {
                await this.callWxPay(boostData.paymentParams);
              }
            }

            if (enablePinPlus) {
              const pinPlusResponse = await postTransactionsPinPlus({ activityId });
              const pinPlusData = pinPlusResponse.data as { paymentParams?: WxPaymentParams };
              if (pinPlusResponse.status === 200 && pinPlusData?.paymentParams) {
                await this.callWxPay(pinPlusData.paymentParams);
              }
            }

            wx.showToast({ title: '购买成功', icon: 'success' });
            this.showSuccessAndShare(activityId);
          } catch (error) {
            console.error('购买增值服务失败', error);
            wx.showToast({ title: '支付失败，请稍后重试', icon: 'none' });
            this.showSuccessAndShare(activityId);
          }
        } else {
          this.showSuccessAndShare(activityId);
        }
      },
    });
  },

  callWxPay(paymentParams: WxPaymentParams): Promise<void> {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        ...paymentParams,
        success: () => resolve(),
        fail: (err) => {
          if (err.errMsg.includes('cancel')) {
            resolve();
          } else {
            reject(err);
          }
        },
      });
    });
  },

  showSuccessAndShare(activityId: string) {
    wx.showModal({
      title: '创建成功',
      content: '活动创建成功！是否分享到微信群？',
      confirmText: '去分享',
      cancelText: '查看活动',
      success: (res) => {
        if (res.confirm) {
          wx.redirectTo({
            url: `/subpackages/activity/detail/index?id=${activityId}&share=1`,
          });
        } else {
          wx.redirectTo({
            url: `/subpackages/activity/detail/index?id=${activityId}`,
          });
        }
      },
    });
  },

  // ==================== 辅助方法 ====================

  getTypeLabel(value: string): string {
    const type = ACTIVITY_TYPES.find((t) => t.value === value);
    return type ? type.label : '';
  },

  getFeeTypeLabel(value: string): string {
    const type = FEE_TYPES.find((t) => t.value === value);
    return type ? type.label : '';
  },

  getJoinModeLabel(value: string): string {
    const mode = JOIN_MODES.find((m) => m.value === value);
    return mode ? mode.label : '';
  },

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: '我在聚场创建了一个活动，快来参加吧！',
      path: '/pages/home/index',
    };
  },
});
