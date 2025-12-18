# Implementation Plan

## Phase 1: 基础架构重构

- [x] 1. 重构导航架构为3 Tab
  - [x] 1.1 更新app.json配置，移除AI Tab，保留map/message/my三个Tab
    - 修改tabBar.list配置
    - 重命名pages/home为pages/map
    - _Requirements: 1.1_
  - [x] 1.2 重构custom-tab-bar组件
    - 修改TabBar为3个Tab（地图、消息、我的）
    - 保留未读消息角标功能
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Checkpoint - 确保导航架构正常工作
  - 手动测试：3个Tab切换正常

## Phase 2: 地图首页

- [x] 3. 实现地图首页基础功能
  - [x] 3.1 重构pages/map页面，使用微信map组件
    - 请求位置权限
    - 以用户位置为中心渲染全屏地图
    - _Requirements: 2.1_
  - [x] 3.2 创建浮动按钮组件(floating-buttons)
    - 实现定位按钮（右侧中间）
    - 实现安全中心按钮（左上角）
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 3.3 创建底部抽屉组件(bottom-drawer)
    - 实现可滑动抽屉
    - 支持展开/收起状态
    - 包含筛选入口和创建活动按钮
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. 实现活动Pin渲染
  - [x] 4.1 实现活动Pin渲染
    - 调用API获取附近活动
    - 将活动数据转换为markers
    - 根据isPinPlus/isBoosted设置不同样式
    - _Requirements: 2.2, 2.3, 2.4_
  - [x] 4.2 实现活动卡片弹窗
    - 创建activity-card组件
    - 点击Pin显示活动简要信息
    - 点击卡片跳转详情页
    - _Requirements: 2.5, 2.6_

- [x] 5. 实现筛选功能
  - [x] 5.1 创建filter-panel组件
    - 实现筛选面板UI（时间/类型/人群/靠谱度/距离/状态/费用）
    - 实现筛选条件选择逻辑
    - _Requirements: 5.1_
  - [x] 5.2 实现筛选逻辑
    - 根据筛选条件过滤活动
    - 重新渲染地图Pin
    - 显示已选条件数量角标
    - _Requirements: 5.2, 5.3, 5.4_

- [ ] 6. Checkpoint - 确保地图功能正常
  - 手动测试：地图加载、Pin渲染、浮动按钮、底部抽屉、筛选功能

## Phase 3: 活动详情与创建

- [x] 7. 实现活动详情页
  - [x] 7.1 创建subpackages/activity/detail页面
    - 显示活动完整信息
    - 私密局显示模糊地址
    - 显示发起人信息和靠谱度
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 7.2 实现报名功能
    - 校验用户靠谱度
    - 热门活动显示Fast Pass选项
    - 调用报名API
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 8. 实现活动创建流程
  - [x] 8.1 创建subpackages/activity/create页面（活动表单）
    - 实现表单字段（标题/描述/时间/地点/人数/费用等）
    - 位置选择强制填写位置备注
    - 隐私设置（模糊地理位置）
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 8.2 实现表单验证和提交
    - 必填字段校验
    - 调用创建活动API
    - 推广选项（Boost/Pin+）
    - _Requirements: 7.4, 7.5, 7.6_

- [ ] 9. Checkpoint - 确保活动流程正常
  - 手动测试：活动详情查看、报名、创建活动

## Phase 4: 消息与群聊

- [x] 10. 重构消息中心
  - [x] 10.1 重构pages/message页面
    - 分离系统通知区域和群聊列表区域
    - 实现通知列表渲染
    - 申诉按钮（被标记未到场时显示）
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 10.2 实现未读消息角标
    - 计算未读消息数量
    - 更新TabBar角标
    - _Requirements: 8.5_

- [x] 11. 完善群聊功能
  - [x] 11.1 重构pages/chat页面
    - 显示活动信息头部
    - 消息列表渲染
    - _Requirements: 9.1_
  - [x] 11.2 实现消息发送和接收
    - 调用发送消息API
    - WebSocket实时接收
    - _Requirements: 9.2, 9.3_

- [ ] 12. Checkpoint - 确保消息功能正常
  - 手动测试：通知列表、群聊消息收发

## Phase 5: 履约与反馈

- [x] 13. 实现履约确认功能
  - [x] 13.1 创建subpackages/activity/confirm页面
    - 显示参与者列表（默认全选已到场）
    - 标记未到场警告提示
    - _Requirements: 10.2, 10.3_
  - [x] 13.2 实现履约确认提交
    - 调用履约确认API
    - 处理确认结果
    - _Requirements: 10.4_

- [x] 14. 实现申诉功能
  - [x] 14.1 在通知中添加申诉入口
    - 被标记未到场时显示"我到场了"按钮
    - 调用申诉API
    - _Requirements: 11.1, 11.2_

- [x] 15. 实现差评反馈
  - [x] 15.1 创建feedback-dialog组件
    - 体验反馈弹窗UI
    - 问题类型选择
    - 指定反馈对象
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 16. Checkpoint - 确保履约流程正常
  - 手动测试：履约确认、申诉、差评反馈

## Phase 6: 个人中心与认证

- [x] 17. 完善个人中心
  - [x] 17.1 更新pages/my页面
    - 显示靠谱度等级
    - 统计数据展示
    - _Requirements: 12.1, 12.2_
  - [x] 17.2 实现活动列表页面
    - 我发布的活动列表
    - 我参与的活动列表
    - _Requirements: 12.3, 12.4_

- [x] 18. 实现懒注册逻辑
  - [x] 18.1 实现权限控制
    - 未登录可浏览地图和详情
    - 创建/报名/群聊跳转登录
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 12.5_

- [ ] 19. Checkpoint - 确保个人中心正常
  - 手动测试：个人信息、活动列表、登录拦截

## Phase 7: 增值服务与分享

- [x] 20. 实现增值服务购买
  - [x] 20.1 在活动创建页添加推广选项
    - Boost服务选择和说明
    - Pin+服务选择和说明
    - _Requirements: 14.1, 14.2_
  - [x] 20.2 在报名页添加Fast Pass选项
    - Fast Pass服务选择和说明
    - _Requirements: 14.3_
  - [x] 20.3 集成微信支付
    - 调用支付API
    - 处理支付结果
    - _Requirements: 14.4, 14.5_

- [x] 21. 实现分享功能
  - [x] 21.1 创建分享卡片生成器
    - 活动信息卡片预览
    - 生成带小程序码的图片
    - _Requirements: 15.1, 15.2_
  - [x] 21.2 实现场景参数解析
    - 解析启动scene参数
    - 直接跳转活动详情
    - _Requirements: 15.3_

- [ ] 22. Final Checkpoint - 全功能测试
  - 手动测试：完整用户流程、支付流程、分享流程
