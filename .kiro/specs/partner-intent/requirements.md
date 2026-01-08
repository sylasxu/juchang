# Requirements Document: Partner Intent System (找搭子)

## Introduction

**Version: v4.0 (Smart Broker)**

「找搭子」功能的核心转变：从"被动等待"到"精准下单"。Agent 不再是"收单的传达室大爷"，而是"会对需求负责的高级经纪人"。

**Core Philosophy**：
- 用户是"挑剔的买家"（Picky），不是"随便的乞讨者"
- Agent 是"高级经纪人"，必须追问清楚需求才下单
- 匹配必须精准，tag 冲突宁可不匹配

**核心流程**：
```
Inquiry (询价) → Search (查库) → Consultation (追问澄清) → Booking (下单入库) → Matching (精准撮合)
```

**通知策略**：No Push. Heavy Pull (Dashboard Alert) + Community FOMO.

## Glossary

- **Smart_Broker**: 智能经纪人模式，Agent 主动追问澄清需求
- **Partner_Intent**: 精准需求单，经过 Agent 追问后入库的高质量意向
- **Rich_MetaData**: 结构化偏好数据（tags, requirements, poi_preference）
- **Consultation**: 需求澄清环节，Agent 追问用户具体要求
- **Strict_Matching**: 精准撮合，tag 冲突直接不匹配
- **Lite_Chat**: 匹配成功后的轻量群聊

## Requirements

### Requirement 1: 意向咨询与录入 (The Broker Interaction)

**User Story:** As a picky user, I want the Agent to understand my specific preferences (Time/Budget/Vibe) so that I don't get matched with incompatible people.

> **设计原则**：Agent 必须追问澄清，不能用户说一句就入库。这保证了入库数据的高质量。

#### Acceptance Criteria

1. **触发条件**：WHEN user searches for activities and NO results found, OR user explicitly says "帮我找人", THE Agent SHALL enter Broker Mode
2. **禁止立即入库**：IF user input is vague (e.g., only "想吃火锅"), THE Agent SHALL NOT create an intent immediately
3. **追问澄清**：THE Agent SHALL ask follow-up questions to fill critical slots:
   - WHAT: Activity Type (火锅、桌游、运动)
   - WHERE: Location Hint (观音桥、解放碑)
   - WHEN: Time Preference (今晚、周末、明天下午)
   - HOW: Budget/Vibe (AA制、请客、安静、热闹、不喝酒)
4. **追问限制**：THE Agent SHALL ask max 1-2 rounds of questions to avoid annoyance
5. **一句话追问**：THE Agent SHOULD combine multiple questions naturally, e.g., "没问题，想大概几点去？是希望能AA吗？"
6. **Rich Intent 提取**：THE System SHALL extract structured data into `meta_data` JSON:
   - `tags`: ["AA", "NoAlcohol", "Quiet", "GirlFriendly"]
   - `poi_preference`: "朱光玉" (Optional, specific venue)
   - `budget_type`: "AA" | "Treat" | "Free"
7. **Tool 执行**：ONLY after clarification, THE Agent SHALL call `createPartnerIntent` with populated metadata
8. **确认反馈**：WHEN intent is created, THE Agent SHALL confirm with summary:
   ```
   📋 需求确认：
   目标：朱光玉火锅 (观音桥)
   时间：今晚 19:00 左右
   偏好：AA制、不喝酒、安静
   正在帮你寻找匹配的饭搭子... 有消息第一时间叫你。
   ```

### Requirement 2: 精准撮合 (Strict Matching)

**User Story:** As a user, I only want to be matched if the other person actually fits my vibe, not just because they are nearby.

> **设计原则**：宁缺毋滥。tag 冲突直接不匹配，不能乱拉郎配。

#### Acceptance Criteria

1. **触发时机**：WHEN a new intent is created, THE System SHALL trigger matching algorithm
2. **Hard Filters (必须一致)**：
   - `activity_type` must match exactly
   - `location` must be within 3km
   - `time_window` must overlap
3. **Critical Conflict Check**：IF User A has tag "NoAlcohol" AND User B has tag "Drinking", THE System SHALL NOT match (Score = 0)
4. **Soft Scoring (标签加权)**：THE System SHALL calculate match_score based on `meta_data` overlap percentage
5. **匹配阈值**：THE System SHALL only create a match if 2+ users have High Score (> 80%)
6. **Temp_Organizer 选择**：THE System SHALL designate the earliest intent creator as Temp_Organizer

### Requirement 3: 经纪人式通知 (Broker Notification)

**User Story:** As a user, I want to be notified like a VIP when a customized match is found.

> **设计原则**：这不是"随便凑合"的局，这是"为您定制"的局。通知要强调匹配的精准度。

#### Acceptance Criteria

1. **Dashboard Alert (置顶高亮)**：WHEN user opens app and has pending matches, THE Widget_Dashboard SHALL display match alert at TOP with:
   - Visual highlight (accent background, subtle animation)
   - Specific match details: "终于等到你！帮你找到了 2 位也想吃【朱光玉】且接受【AA制】的朋友。"
2. **Lite_Chat Icebreaker**：THE Agent SHALL send icebreaker message in group:
   ```
   🎉 匹配成功！大家的需求很一致：都想去朱光玉，都偏好AA。
   @[Temp_Organizer] 既然大家目标一致，要不你点个头，我们这局就成了？
   ```
3. **确认窗口**：THE Temp_Organizer SHALL have 6 hours (or by 23:59 same day) to confirm
4. **超时重分配**：IF Temp_Organizer does not confirm within deadline, THE System SHALL reassign to next user

### Requirement 4: 意向转活动 (Intent to Activity)

**User Story:** As a user, I want the matched intent to seamlessly convert into an actual activity.

#### Acceptance Criteria

1. WHEN Temp_Organizer confirms, THE System SHALL create Activity with status='active'
2. WHEN Activity is created, THE System SHALL update all related intents to status='matched'
3. WHEN Activity is created, THE System SHALL auto-join all matched users as participants
4. THE Activity SHALL inherit the Lite_Chat group created during matching

### Requirement 5: 官方群 FOMO (社群营销)

**User Story:** As a user in the official group, I want to see match success notifications to motivate me to use the feature.

> **设计原则**：制造 FOMO，让群里的人想回 App 看看是不是自己匹配成功了。

#### Acceptance Criteria

1. THE Custom_Navbar SHALL include "加群" button with official group QR code
2. WHEN a match is successful, THE Bot SHALL post in official group:
   ```
   📢 [观音桥]附近的[火锅]局匹配成功啦！
   有 3 位朋友正在等待确认，快回 App 看看是不是你！
   ```
3. THE message SHALL NOT reveal user identities (privacy protection)

### Requirement 6: Admin Dashboard 指标

**User Story:** As an admin, I want to monitor the partner intent feature health.

#### Acceptance Criteria

1. THE Dashboard SHALL display intent metrics:
   - 活跃意向数 (active intents count)
   - 今日新增意向 (new intents today)
   - 意向转化率 (intent-to-activity conversion rate)
   - 平均匹配时长 (average time from intent to match)
2. THE metrics SHALL use existing MetricCard component pattern

### Requirement 7: AI Playground 调试

**User Story:** As a developer, I want to test the Broker interaction in Playground.

#### Acceptance Criteria

1. THE new tools SHALL be available in Playground automatically
2. THE ToolPreview SHALL render intent-specific UI for `createPartnerIntent`
3. THE EmptyState SHALL include quick actions: "帮我看看观音桥有没有火锅局"
