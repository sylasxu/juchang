/**
 * 地图选点页面 (零成本版)
 * 直接调用 wx.chooseLocation()，无需自定义 UI
 * 
 * Requirements: 6.5, 地图选点
 */

import { chooseLocation } from '../../../src/config/index'

Page({
  data: {},

  onLoad(options: { lat?: string; lng?: string }) {
    // 直接调用微信选点 API
    this.openLocationPicker(options)
  },

  /**
   * 打开微信原生位置选择器
   */
  async openLocationPicker(options: { lat?: string; lng?: string }) {
    try {
      const result = await chooseLocation({
        latitude: options.lat ? parseFloat(options.lat) : undefined,
        longitude: options.lng ? parseFloat(options.lng) : undefined,
      })

      if (result) {
        // 获取上一页实例，传递选择的位置
        const pages = getCurrentPages()
        const prevPage = pages[pages.length - 2] as WechatMiniprogram.Page.Instance<
          Record<string, unknown>,
          { onLocationSelected?: (location: { latitude: number; longitude: number; addressName: string; addressDetail: string }) => void }
        > | undefined

        if (prevPage && typeof prevPage.onLocationSelected === 'function') {
          prevPage.onLocationSelected({
            latitude: result.latitude,
            longitude: result.longitude,
            addressName: result.name,
            addressDetail: result.address,
          })
        }
      }
      // 无论成功还是取消，都返回上一页
      wx.navigateBack()
    } catch (error) {
      console.error('[MapPicker] chooseLocation failed:', error)
      wx.showToast({ title: '获取位置失败', icon: 'none' })
      wx.navigateBack()
    }
  },
})
