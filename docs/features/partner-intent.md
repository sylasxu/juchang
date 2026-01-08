# 找搭子功能 (Partner Intent)

> **版本**: v4.0 Smart Broker
> **状态**: 已实现
> **Spec**: `.kiro/specs/partner-intent/`

## 概述

用户想参加某类活动但不想自己组局，Agent 作为"高级经纪人"帮用户找到志同道合的搭子。

## 核心流程

```
用户: "想吃火锅，谁组我就去"
  ↓
Agent 进入 Broker Mode，结构化追问
  ↓
用户: "1A 2A 3A" (今晚/AA/不喝酒)
  ↓
Agent 调用 createPartnerIntent
  ↓
系统匹配 → 创建 Match → 发送 Icebreaker
  ↓
Temp_Organizer 确认 → 转为 Activity
```

## 结构化追问 (Flova 模式)

```
好的，帮你找火锅搭子！🍲 为了精准匹配，请确认一下：

1. ⏰ 时间偏好？
   - A: 今晚  B: 明天  C: 周末

2. 💰 费用方式？
   - A: AA制  B: 有人请客也行  C: 都可以

3. 🎯 特别要求？（可多选）
   - A: 不喝酒  B: 安静点的  C: 女生友好  D: 没有

你可以这样回复：**1A 2A 3AD**
```

## 数据模型

### 3 表设计

| 表 | 说明 |
|---|------|
| `partner_intents` | 搭子意向 |
| `intent_matches` | 意向匹配 (含 intentIds[], userIds[] 数组) |
| `match_messages` | 匹配消息 (Match = Group) |

### Rich Intent 结构

```typescript
{
  tags: string[];           // ["AA", "NoAlcohol", "Quiet"]
  poiPreference?: string;   // "朱光玉"
  budgetType?: "AA" | "Treat" | "Free";
  rawInput: string;
}
```

### 标签冲突规则

| 冲突对 |
|--------|
| AA ↔ Treat |
| NoAlcohol ↔ Drinking |
| Quiet ↔ Party |
| GirlOnly ↔ BoyOnly |

## 匹配规则

**硬性条件**:
1. 活动类型完全匹配
2. 位置在 3km 内
3. 无 tag 冲突

**匹配分数**: `common_tags / avg_tags * 100`，≥80% 才创建匹配

**Temp_Organizer**: 最早创建意向的用户

## AI Tools

| Tool | 说明 |
|------|------|
| `createPartnerIntent` | 创建意向 |
| `getMyIntents` | 查询意向和待确认匹配 |
| `cancelIntent` | 取消意向 |
| `confirmMatch` | 确认匹配，创建活动 |

## 生命周期

```
Intent: active → matched/expired/cancelled
Match: pending → confirmed/expired/cancelled (6h 超时)
```

## Cron Jobs

- 每小时: 过期意向处理
- 每 10 分钟: 过期匹配处理 (尝试重新分配 Temp_Organizer)
