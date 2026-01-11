/**
 * Intent Definitions - 意图定义和正则模式
 */

import type { IntentType } from './types';

/**
 * 意图正则模式定义
 * 
 * 按优先级排序，匹配到即返回
 */
export const intentPatterns: Record<IntentType, RegExp[]> = {
  // 空闲/暂停意图（优先级最高）
  idle: [
    /改天|下次|先这样|不用了|算了|没事了/,
    /好的.*谢|谢谢.*不|拜拜|再见|88|byebye/i,
  ],

  // 闲聊意图（与组局无关的话题）
  chitchat: [
    /你是谁|你叫什么|讲个笑话|今天天气/,
    /你好厉害|你真棒|哈哈|嘿嘿|呵呵/,
    /无聊|聊聊天|陪我聊|说说话/,
  ],

  // 管理意图
  manage: [
    /我的活动|我发布的|我参与的/,
    /取消活动|不办了/,
  ],

  // 找搭子意图
  partner: [
    /找搭子|谁组我就去|懒得组局|等人约/,
    /我的意向|我的搭子意向/,
    /取消意向|不找了/,
    /确认匹配|确认发布/,
  ],

  // 明确创建意图
  create: [
    /帮我组|帮我创建|自己组|我来组|我要组|我想组/,
  ],

  // 探索意图
  explore: [
    /想找|找人|一起|有什么|附近|推荐|看看/,
    /想.*打|想.*吃|想.*玩/,
    /想|约/, // 兜底
  ],

  // 未知（不匹配任何模式）
  unknown: [],
};

/**
 * 意图优先级顺序
 * 
 * 按此顺序检查，先匹配到的优先
 */
export const intentPriority: IntentType[] = [
  'idle',
  'chitchat',
  'manage',
  'partner',
  'create',
  'explore',
  'unknown',
];

/**
 * 草稿上下文下的修改意图模式
 */
export const draftModifyPatterns: RegExp[] = [
  /改|换|加|减|调/,
  /发布|没问题|就这样|确认/,
];

/**
 * 意图显示名称
 */
export const intentDisplayNames: Record<IntentType, string> = {
  create: '创建活动',
  explore: '探索附近',
  manage: '管理活动',
  partner: '找搭子',
  chitchat: '闲聊',
  idle: '暂停',
  unknown: '未知',
};

/**
 * 闲聊模板回复
 */
export const chitchatResponses: string[] = [
  '哈哈，我只会帮你组局约人，闲聊就不太行了～想约点什么？',
  '聊天我不太擅长，但组局我很在行！想找人一起玩点什么？',
  '我是组局小助手，帮你约人才是我的强项～有什么想玩的吗？',
  '这个我不太懂，但如果你想约人吃饭、打球、桌游，随时找我！',
];

/**
 * 获取随机闲聊回复
 */
export function getRandomChitchatResponse(): string {
  return chitchatResponses[Math.floor(Math.random() * chitchatResponses.length)];
}
