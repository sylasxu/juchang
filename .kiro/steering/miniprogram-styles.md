---
inclusion: fileMatch
fileMatchPattern: "apps/miniprogram/**/*.{wxml,less,ts}"
---

# 小程序样式开发规范

## 核心原则

1. **原子类优先** - 优先使用全局原子类，减少组件级 Less 编写
2. **TDesign 组件** - UI 组件使用 TDesign，不重复造轮子
3. **Design Token** - 所有数值来源于 `styles/tokens.less`，禁止魔法数字
4. **rpx vs px** - 布局用 rpx，边框/阴影用 px

## 样式文件结构

```
apps/miniprogram/styles/
├── tokens.less        # Design Token 变量（间距/字号/颜色/圆角）
├── utilities.less     # Tailwind 风格原子类
└── tdesign-theme.less # TDesign 主题覆盖
```

## 原子类使用

### 布局
```html
<view class="flex items-center justify-between">
<view class="flex-col gap-2">
<view class="flex-1">
```

### 间距（基于 8rpx 基数）
```html
<view class="mt-4 mb-2">      <!-- margin-top: 32rpx, margin-bottom: 16rpx -->
<view class="p-4 px-6">       <!-- padding: 32rpx, padding-x: 48rpx -->
<view class="mx-auto">        <!-- 水平居中 -->
```

### 文字
```html
<text class="text-lg font-bold text-gray-900">标题</text>
<text class="text-sm text-gray-600">描述文字</text>
<text class="text-brand">品牌色文字</text>
<text class="truncate">超长文字截断...</text>
```

### 容器
```html
<view class="bg-white rounded-lg shadow-sm p-4">
<view class="border-b border-gray-100">
```

## 禁止事项

❌ **禁止魔法数字**
```less
// 错误
.card { padding: 15px; font-size: 13px; }

// 正确
.card { padding: @spacing-4; font-size: @text-sm; }
```

❌ **禁止在 WXML 中使用内联样式（除非动态计算）**
```html
<!-- 错误 -->
<view style="margin-top: 20rpx; color: #666;">

<!-- 正确 -->
<view class="mt-2 text-gray-600">
```

❌ **禁止重复定义 TDesign 已有的组件样式**

## AI 代码生成指南

当生成小程序 WXML 代码时：

1. **优先使用原子类**
   - 布局：`flex`, `flex-col`, `items-center`, `justify-between`
   - 间距：`mt-4`, `p-4`, `px-6`, `gap-2`
   - 文字：`text-sm`, `text-gray-600`, `font-bold`, `truncate`
   - 容器：`bg-white`, `rounded-lg`, `shadow-sm`, `border-b`

2. **使用 TDesign 组件**
   - 按钮：`<t-button>`
   - 输入框：`<t-input>`
   - 弹窗：`<t-popup>`
   - 列表：`<t-cell>`

3. **组件级样式**
   - 仅在原子类无法满足时编写
   - 必须使用 Design Token 变量
   - 导入：`@import '/styles/tokens.less';`

## 间距速查表

| 类名 | 值 | 用途 |
|------|-----|------|
| `*-1` | 8rpx | 最小间距 |
| `*-2` | 16rpx | 紧凑间距 |
| `*-3` | 24rpx | - |
| `*-4` | 32rpx | 标准间距 |
| `*-6` | 48rpx | 宽松间距 |
| `*-8` | 64rpx | 区块间距 |

## 颜色速查表

| 类名 | 用途 |
|------|------|
| `text-gray-900` | 主要文字 |
| `text-gray-600` | 次要文字 |
| `text-gray-400` | 占位符 |
| `text-brand` | 品牌色文字 (#FF6B35) |
| `text-error` | 错误/警告文字 |
| `text-success` | 成功文字 |
| `bg-gray-50` | 页面背景 |
| `bg-gray-100` | 输入框/次级背景 |
| `bg-white` | 卡片背景 |
| `bg-brand-light` | 品牌浅色背景 |

## 常用组合模式

### 页面容器
```html
<view class="min-h-screen bg-gray-50">
```

### 卡片
```html
<view class="bg-white rounded-lg p-4 mb-3">
```

### 列表项
```html
<view class="flex items-center px-4 py-3 border-b border-gray-100">
```

### 底部安全区
```html
<view class="safe-bottom"></view>
```

### 固定底部栏
```less
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}
```
