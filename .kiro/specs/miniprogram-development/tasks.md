# Implementation Plan

## 当前状态总结

### ✅ 已完成的核心功能

| 模块 | 页面 | 状态 |
|------|------|------|
| 导航 | 3 Tab架构 + 自定义TabBar | ✅ 完成 |
| 首页 | pages/home | ✅ 完成 |
| 消息 | pages/message | ✅ 完成 |
| 我的 | pages/my | ✅ 完成 |
| 活动详情 | subpackages/activity/detail | ✅ 完成 |
| 创建活动 | subpackages/activity/create | ✅ 完成 |
| 履约确认 | subpackages/activity/confirm | ✅ 完成 |
| 群聊 | pages/chat | ✅ 完成 |
| 登录 | pages/login | ✅ 完成 |
| 个人编辑 | pages/my/info-edit | ✅ 完成 |

### 🔄 待实现的新功能 (PRD V9.2)

| 模块 | 说明 |
|------|------|
| AI 输入栏 | 底部悬浮的 AI 入口组件 |
| CUI 副驾面板 | AI 流式响应展示面板 |
| 靠谱度徽章 | 更新为徽章方案（🏅/✓/🆕） |
| 幽灵锚点 | 运营投放的需求引导 Pin |
| 微信原生分享 | 简化分享功能 |

---

## Phase 1-7: 已完成 ✅

- [x] 1. 重构导航架构为3 Tab
- [x] 3. 实现地图首页基础功能
- [x] 4. 实现活动Pin渲染
- [x] 5. 实现筛选功能
- [x] 7. 实现活动详情页
- [x] 8. 实现活动创建流程
- [x] 10. 重构消息中心
- [x] 11. 完善群聊功能
- [x] 13. 实现履约确认功能
- [x] 14. 实现申诉功能
- [x] 15. 实现差评反馈
- [x] 17. 完善个人中心
- [x] 18. 实现懒注册逻辑
- [x] 20. 实现增值服务购买
- [x] 21. 实现分享功能
- [x] 23. 清理遗留页面
- [x] 24. 完善搜索功能
- [x] 25. 完善设置页面

---

## Phase 8: PRD V9.2 新功能实现

- [x] 27. 重命名首页并更新导航
  - [x] 27.1 将 pages/map 重命名为 pages/home
    - 更新目录名称和所有文件引用
    - 更新 app.json 中的页面路径
    - 更新 custom-tab-bar 中的路由配置
    - _需求: Requirements 1.1, 4.1_

- [x] 28. 实现 AI 输入栏组件
  - [x] 28.1 创建 ai-input-bar 组件
    - 创建 components/ai-input-bar/ 目录
    - 实现底部悬浮的黑色长条样式
    - 左侧 AI 图标，中间提示文案，右侧语音按钮
    - 点击展开 CUI 副驾面板
    - _需求: Requirements 2.1, 2.2_
  - [x] 28.2 实现语音输入功能
    - 集成微信语音识别 API
    - 实现录音状态 UI 反馈
    - _需求: Requirements 2.5_
  - [x] 28.3 实现输入防抖机制
    - 用户停止输入 500ms 后触发 AI 解析
    - _需求: Requirements 2.6_

- [x] 28.4 编写 AI 输入栏属性测试 (手动测试)
  - **Property 3: AI输入防抖机制**
  - **Validates: Requirements 2.6**

- [x] 29. 实现 CUI 副驾面板组件
  - [x] 29.1 创建 cui-panel 组件
    - 创建 components/cui-panel/ 目录
    - 实现思考态、搜索态、结果态三种状态
    - 实现流式文字显示效果
    - _需求: Requirements 3.1, 3.3_
  - [x] 29.2 实现地图联动
    - AI 定位到地点时，地图同步飞向目标位置
    - _需求: Requirements 3.2_
  - [x] 29.3 实现双选卡片
    - 有匹配活动时显示"发现X个局"卡片
    - 显示创建草稿卡片
    - _需求: Requirements 3.4, 3.5_
  - [x] 29.4 创建 draft-card 组件
    - 创建 components/draft-card/ 目录
    - 显示 AI 解析的活动草稿预览
    - 点击"立即发布"跳转创建页并预填数据
    - _需求: Requirements 3.7_

- [x] 29.5 编写 CUI 面板属性测试 (手动测试)
  - **Property 4: AI响应时间保证**
  - **Property 5: 地图位置联动**
  - **Property 6: AI搜索结果展示一致性**
  - **Validates: Requirements 3.1, 3.2, 3.4, 3.5**

- [x] 30. 实现幽灵锚点功能
  - [x] 30.1 实现幽灵锚点渲染
    - 从 API 获取幽灵锚点数据
    - 渲染绿色虚线 Pin 样式
    - 显示引导文案（如"这里缺一个火锅局🍲"）
    - _需求: Requirements 5.1, 5.3, 5.4_
  - [x] 30.2 实现幽灵锚点交互
    - 点击幽灵锚点唤起 AI 输入栏
    - 预填锚点建议的类型和位置
    - _需求: Requirements 5.2_

- [x] 30.3 编写幽灵锚点属性测试 (手动测试)
  - **Property 7: 活动Pin样式正确性**
  - **Property 12: 幽灵锚点预填数据传递**
  - **Validates: Requirements 4.3, 4.4, 4.7, 5.2**

- [x] 31. 更新靠谱度展示为徽章方案
  - [x] 31.1 创建 reliability-badge 组件
    - 创建 components/reliability-badge/ 目录
    - 实现徽章展示逻辑：
      - rate > 90% → 🏅 超靠谱
      - 80% < rate ≤ 90% → ✓ 靠谱
      - rate ≤ 80% 或新用户 → 🆕 新人
    - _需求: Requirements 14.1, 14.2, 14.3, 14.4_
  - [x] 31.2 更新所有靠谱度显示位置
    - 更新 pages/my 个人中心
    - 更新 activity-card 组件
    - 更新 activity/detail 详情页
    - _需求: Requirements 13.1, 7.3_

- [x] 31.3 编写靠谱度徽章属性测试 (手动测试)
  - **Property 1: 靠谱度徽章计算正确性**
  - **Validates: Requirements 14.1, 14.2, 14.3, 14.4**

- [x] 32. 更新分享功能为微信原生分享
  - [x] 32.1 更新分享服务
    - 移除 Canvas 海报生成逻辑
    - 实现 wx.onShareAppMessage 配置
    - 生成分享标题、路径、图片
    - _需求: Requirements 17.1, 17.2, 17.4_
  - [x] 32.2 更新活动详情页分享
    - 配置 onShareAppMessage 返回活动分享数据
    - _需求: Requirements 17.3_
  - [x] 32.3 更新活动创建成功后的分享引导
    - 显示分享引导 UI
    - 引导用户使用微信原生分享
    - _需求: Requirements 17.1_

- [x] 32.4 编写分享功能属性测试 (手动测试)
  - **Property 17: 分享深度链接**
  - **Validates: Requirements 17.3**

- [x] 33. 更新活动创建页
  - [x] 33.1 添加位置备注必填验证
    - 添加 locationHint 字段
    - 提供选项：地面入口/地下通道进/XX楼平台/其他自定义
    - 实现必填验证
    - _需求: Requirements 8.2, 8.4_
  - [x] 33.2 实现 AI 预填数据接收
    - 从 AI 输入栏跳转时接收预填数据
    - 自动填充标题、时间、地点等字段
    - _需求: Requirements 8.7_

- [x] 33.3 编写活动创建属性测试 (手动测试)
  - **Property 10: 位置备注必填验证**
  - **Property 11: AI输入栏预填数据传递**
  - **Validates: Requirements 8.2, 8.4, 8.7**

- [x] 34. 实现 AI 额度管理
  - [x] 34.1 实现额度消耗逻辑
    - AI 搜索/解析消耗额度（50次/天）
    - 活动发布消耗额度（3次/天）
    - _需求: Requirements 19.1, 19.3_
  - [x] 34.2 实现额度用完提示
    - AI 额度用完显示提示
    - 发布额度用完显示提示
    - _需求: Requirements 19.2, 19.4_

- [x] 34.4 编写 AI 额度属性测试 (手动测试)
  - **Property 16: AI额度消耗正确性**
  - **Validates: Requirements 19.1, 19.3**

- [x] 35. Checkpoint - 确保所有测试通过
  - 手动测试验证

---

## Phase 9: 集成测试与优化

- [x] 36. 集成测试 (手动测试)
  - [x] 36.1 测试 AI 输入栏完整流程
    - 输入文本 → AI 解析 → 地图联动 → 结果展示
  - [x] 36.2 测试幽灵锚点流程
    - 点击锚点 → 唤起 AI 输入栏 → 预填数据
  - [x] 36.3 测试分享流程
    - 创建活动 → 分享引导 → 微信原生分享

- [x] 37. Final Checkpoint (手动测试)
  - 手动测试：完整用户流程
  - 确保所有新功能正常工作
