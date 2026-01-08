# AI 海报生成

> **版本**: Phase 2
> **状态**: 规划中

## 概述

Native Share Card 适合群聊快速分享，朋友圈需要更有设计感的海报。

## API

```
POST /share/poster
Request: { activityId: string; style?: 'default' | 'cyberpunk' | 'minimal' }
Response: { posterUrl: string; cached: boolean }
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 渲染层 | Puppeteer + HTML |
| 内容层 | Flux/SDXL API (AI 生成背景图) |
| 存储层 | CDN |

## 核心优势

- CSS 复用: Halo Card 样式 100% 复用
- 高级效果: 支持 backdrop-filter 等
- AI 增强: 每次生成独特背景图
