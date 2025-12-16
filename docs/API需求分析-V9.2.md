# 聚场 API 需求分析 - V9.2

## 总览：9个核心模块，50个API端点

基于PRD V9.2的功能需求，聚场需要以下API模块和端点：

### 🔥 技术顾问补充的关键优化点：
1. **地图聚合优化** - `/activities/nearby` 支持聚合与幽灵标记
2. **AI流式体验** - `/ai/parse` 考虑SSE流式返回
3. **流量闭环透传** - 新增场景参数解析接口
4. **文件上传模块** - 补充图片上传功能

---

## 1. 认证模块 (Auth) - 6个端点

### 微信小程序认证流程
- `POST /auth/wechat/login` - 微信登录（code换取session）
- `POST /auth/wechat/register` - 完善用户信息（昵称、头像等）
- `POST /auth/refresh` - 刷新JWT Token
- `POST /auth/logout` - 登出
- `GET /auth/profile` - 获取当前用户信息
- `PUT /auth/profile` - 更新用户基本信息

---

## 2. 用户模块 (Users) - 8个端点

### 用户管理与信任体系
- `GET /users/:id` - 获取用户详情（公开信息）
- `GET /users/:id/reliability` - 获取用户靠谱度详情
- `GET /users/:id/activities` - 获取用户创建的活动列表
- `GET /users/:id/participations` - 获取用户参与的活动列表
- `POST /users/:id/report` - 举报用户
- `GET /users/me/disputes` - 获取我的争议记录
- `POST /users/me/appeal` - 申诉履约争议（一键申诉）
- `GET /users/nearby` - 获取附近在线用户（可选功能）

---

## 3. 活动模块 (Activities) - 12个端点

### 核心业务：活动CRUD + 地图展示
- `GET /activities` - 获取活动列表（支持地理位置筛选）
- `GET /activities/nearby` - 获取附近活动（🔥优化：支持聚合+幽灵标记）
- `GET /activities/:id` - 获取活动详情
- `POST /activities` - 创建活动
- `PUT /activities/:id` - 更新活动信息
- `DELETE /activities/:id` - 删除活动
- `POST /activities/:id/join` - 报名参加活动
- `DELETE /activities/:id/join` - 取消报名
- `POST /activities/:id/confirm` - 确认活动完成（发起人操作）
- `POST /activities/:id/fulfillment` - 标记参与者履约状态
- `GET /activities/:id/participants` - 获取活动参与者列表
- `POST /activities/ghost` - 创建幽灵锚点（运营功能）

---

## 4. AI模块 (AI) - 5个端点

### AI赋能：意图解析 + 搜索 + 风控
- `POST /ai/parse` - 解析用户输入，生成活动信息（魔法输入框）
- `POST /ai/search` - AI搜索活动（全能搜索框）
- `POST /ai/risk-assessment` - 活动风险评估
- `POST /ai/user-report` - 用户深度风控报告（付费功能）
- `GET /ai/quota` - 获取用户AI使用额度

---

## 5. 参与者模块 (Participants) - 4个端点

### 报名审批与管理
- `GET /participants/activity/:activityId` - 获取活动参与者列表
- `PUT /participants/:id/approve` - 审批参与申请
- `PUT /participants/:id/reject` - 拒绝参与申请
- `POST /participants/:id/feedback` - 对参与者进行评价反馈

---

## 6. 群聊模块 (Chat) - 4个端点

### 活动群聊功能
- `GET /chat/activity/:activityId/messages` - 获取活动群聊消息
- `POST /chat/activity/:activityId/messages` - 发送群聊消息
- `PUT /chat/activity/:activityId/archive` - 归档群聊
- `GET /chat/my-chats` - 获取我的群聊列表

---

## 7. 交易模块 (Transactions) - 6个端点

### 支付与增值服务
- `POST /transactions/boost` - 购买强力召唤
- `POST /transactions/pin-plus` - 购买黄金置顶
- `POST /transactions/fast-pass` - 购买优先入场券
- `POST /transactions/membership` - 购买Pro会员
- `POST /transactions/webhook` - 微信支付回调
- `GET /transactions/my-orders` - 获取我的订单记录

---

## 8. 仪表板模块 (Dashboard) - 2个端点

### 数据统计与运营
- `GET /dashboard/stats` - 获取平台统计数据
- `GET /dashboard/user-stats` - 获取用户个人统计

---

## 9. 文件上传模块 (Upload) - 3个端点

### 图片与文件处理
- `POST /upload/image` - 上传图片（活动海报、头像等）
- `POST /upload/token` - 获取OSS/COS直传签名（推荐方案）
- `GET /activities/share-info/:sceneId` - 解析微信小程序场景参数

---

## API设计原则

### 1. RESTful设计
- 使用标准HTTP方法（GET/POST/PUT/DELETE）
- 资源导向的URL设计
- 统一的响应格式

### 2. 地理位置处理
```typescript
// 地理位置查询参数
interface LocationQuery {
  lat: number;      // 纬度
  lng: number;      // 经度
  radius?: number;  // 搜索半径（米），默认3000
}

// 地理位置响应格式
interface LocationResponse {
  lat: number;
  lng: number;
  address: string;
  locationName: string;
  locationHint?: string; // 重庆地形位置备注
}
```

### 3. 分页与筛选
```typescript
// 通用查询参数
interface CommonQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 活动筛选参数
interface ActivityFilter extends CommonQuery, LocationQuery {
  type?: ActivityType;
  status?: ActivityStatus;
  startTime?: string;
  endTime?: string;
  feeType?: FeeType;
  minReliability?: number;
}
```

### 4. 错误处理
```typescript
// 统一错误响应格式
interface ErrorResponse {
  code: number;
  msg: string;
  data?: any;
}

// 常见错误码
enum ErrorCode {
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  QUOTA_EXCEEDED = 429,
  PAYMENT_REQUIRED = 402,
}
```

### 5. 权限控制
- JWT Token认证
- 基于用户靠谱度的权限限制
- 付费功能的权益验证

---

## 开发优先级

### Phase 1: 核心基础 (Week 1-2)
1. **Auth模块** - 微信登录认证
2. **Users模块** - 用户信息与靠谱度
3. **Activities模块** - 活动CRUD + 地图数据
4. **AI模块** - 意图解析（魔法输入框）

### Phase 2: 社交闭环 (Week 3-4)
5. **Participants模块** - 报名审批流程
6. **Chat模块** - 群聊功能
7. **AI模块** - 搜索功能（全能搜索框）

### Phase 3: 商业化 (Week 5-6)
8. **Transactions模块** - 支付与增值服务
9. **Dashboard模块** - 数据统计
10. **完善所有模块** - 风控、申诉、反馈等

---

## 技术实现要点

### 1. 数据库查询优化
- 地理位置查询使用PostGIS的ST_DWithin函数
- 活动列表查询添加合适的索引
- 分页查询使用cursor-based pagination

### 2. 缓存策略
- 用户信息缓存（Redis）
- 活动列表缓存（按地理位置分区）
- AI调用结果缓存

### 3. 实时功能
- 群聊消息使用WebSocket或Server-Sent Events
- 活动状态变更的实时推送
- 支付状态的实时更新

### 4. 安全考虑
- 输入验证和SQL注入防护
- 频率限制（Rate Limiting）
- 敏感信息脱敏
- AI调用的额度控制

---

## 总结

聚场V9.2共需要**47个API端点**，分布在**8个核心模块**中。设计遵循RESTful原则，重点关注地理位置处理、实时通信、支付安全和AI功能集成。开发按照3个阶段进行，优先实现核心功能，再逐步完善社交和商业化功能。

---

## 🔥 技术顾问补充的关键优化

### 1. 地图接口聚合优化

#### GET /activities/nearby 响应结构优化
```typescript
// 优化后的响应结构
interface NearbyResponse {
  items: Array<{
    type: 'activity' | 'cluster' | 'ghost'; // 区分类型
    id: string; // 活动ID 或 聚合ID
    lat: number;
    lng: number;
    
    // type='activity' 时才有
    title?: string;
    isBoosted?: boolean; // 决定是否有闪烁特效
    isPinPlus?: boolean; // 决定是否变大变金
    
    // type='cluster' 时才有
    count?: number; // 聚合数量
    
    // type='ghost' 时才有
    ghostType?: 'food' | 'sports'; // 决定图标
  }>; 
}
```

**查询参数新增**：
- `zoom_level` - 用于计算聚合粒度
- 后端利用 PostGIS `ST_ClusterDBSCAN` 处理聚合

### 2. AI接口流式体验优化

#### POST /ai/parse 优化建议
- **优先使用 JSON Mode**：确保 LLM 稳定输出 JSON
- **考虑 SSE (Server-Sent Events)**：流式返回解析进度
- **MVP 决策**：Phase 1 先用普通 POST + Loading 动画

```typescript
// AI解析进度事件
interface ParseProgressEvent {
  type: 'progress' | 'complete' | 'error';
  message: string;
  data?: any;
}
```

### 3. 流量闭环透传参数

#### GET /activities/share-info/:sceneId
**场景**：微信小程序二维码 scene 参数长度限制（32字符）

**流程**：
1. 生成时：复杂参数存入 Redis，返回短 sceneId
2. 扫码时：用 sceneId 换回真实的 activityId 和跳转逻辑

```typescript
interface ShareInfo {
  activityId?: string;
  inviterId?: string;
  source: 'qr_code' | 'share_card' | 'wechat_group';
  redirectTo: 'activity_detail' | 'nearby_list' | 'user_profile';
}
```

### 4. 文件上传模块补充

#### 推荐方案：OSS/COS 直传模式
- 后端只负责签发 Upload Token
- 前端直接传给腾讯云 COS/阿里云 OSS
- 节省服务器带宽，提升上传速度

```typescript
interface UploadToken {
  token: string;
  uploadUrl: string;
  expireTime: number;
  maxSize: number;
  allowedTypes: string[];
}
```

---

## 重庆地形特殊处理

### locationHint 字段应用
所有涉及地理位置的API都需要支持重庆地形备注：

```typescript
interface LocationInfo {
  lat: number;
  lng: number;
  address: string;
  locationName: string;
  locationHint: string; // "4楼平台入口"、"地下B1层"、"轻轨站3号出口"
}
```

### PostGIS 查询优化
- 使用 `ST_DWithin` 进行地理距离查询
- 考虑重庆山地地形的实际步行距离
- 支持海拔高度差异的距离计算

---

## 性能优化策略

### 1. 缓存策略
- **用户信息缓存**：Redis 缓存用户基本信息和靠谱度
- **活动列表缓存**：按地理位置分区缓存热点区域活动
- **AI调用结果缓存**：相似输入的解析结果缓存1小时

### 2. 数据库优化
- **地理位置索引**：使用 GiST 索引优化 PostGIS 查询
- **分页优化**：使用 cursor-based pagination
- **查询优化**：合理使用 JOIN 和子查询

### 3. 实时功能
- **WebSocket/SSE**：群聊消息、活动状态变更
- **推送通知**：履约提醒、申诉通知
- **支付回调**：实时更新订单状态

---

## 开发任务清单

### Phase 1: 核心地图功能 (本周)
- [ ] 实现 `GET /activities/nearby` 聚合功能
- [ ] 支持幽灵锚点 (isGhost) 标记
- [ ] 集成重庆地形备注 (locationHint)
- [ ] PostGIS 距离查询优化

### Phase 2: AI体验优化 (下周)  
- [ ] 实现 `POST /ai/parse` JSON Mode
- [ ] 考虑 SSE 流式返回（可选）
- [ ] AI调用结果缓存机制

### Phase 3: 流量闭环 (第三周)
- [ ] 实现场景参数解析接口
- [ ] 文件上传模块（OSS直传）
- [ ] 分享卡片生成功能