/**
 * Growth Service
 * 
 * 增长工具业务逻辑
 */

import { db, conversationMessages, sql, desc, and, gte } from '@juchang/db'

interface PosterResult {
  headline: string
  subheadline: string
  body: string
  cta: string
  hashtags: string[]
}

interface TrendWord {
  word: string
  count: number
  trend: 'up' | 'down' | 'stable'
}

interface IntentDistribution {
  intent: string
  count: number
  percentage: number
}

interface TrendInsight {
  topWords: TrendWord[]
  intentDistribution: IntentDistribution[]
  period: '7d' | '30d'
}

/**
 * 生成海报文案
 * 
 * TODO: 接入 AI 生成真实文案
 */
export async function generatePoster(
  text: string,
  style: 'minimal' | 'cyberpunk' | 'handwritten'
): Promise<PosterResult> {
  // 简单的模板生成（后续可接入 AI）
  const templates = {
    minimal: {
      headline: '一起来玩',
      subheadline: '简单快乐',
      cta: '扫码加入',
    },
    cyberpunk: {
      headline: '赛博聚会 🌃',
      subheadline: '未来已来',
      cta: '链接未来',
    },
    handwritten: {
      headline: '手写邀请函 ✍️',
      subheadline: '诚挚邀请',
      cta: '期待你的到来',
    },
  }

  const template = templates[style]
  
  // 提取关键词作为标签
  const keywords = extractKeywords(text)
  const hashtags = keywords.map(k => `#${k}`)

  return {
    headline: template.headline,
    subheadline: template.subheadline,
    body: text.slice(0, 100), // 简化处理
    cta: template.cta,
    hashtags: hashtags.slice(0, 5),
  }
}

/**
 * 简单的关键词提取
 */
function extractKeywords(text: string): string[] {
  const commonWords = ['火锅', '周末', '约饭', '重庆', '美食', '运动', '电影', '咖啡', '聚会']
  return commonWords.filter(word => text.includes(word))
}

/**
 * 获取热门洞察
 * 
 * 统计用户消息中的高频词和意图分布
 */
export async function getTrendInsights(period: '7d' | '30d'): Promise<TrendInsight> {
  const days = period === '7d' ? 7 : 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // 查询用户消息（role = 'user'）
  const userMessages = await db
    .select({
      content: conversationMessages.content,
      createdAt: conversationMessages.createdAt,
    })
    .from(conversationMessages)
    .where(
      and(
        sql`${conversationMessages.role} = 'user'`,
        gte(conversationMessages.createdAt, startDate)
      )
    )
    .orderBy(desc(conversationMessages.createdAt))

  // 提取文本内容
  const texts: string[] = []
  for (const msg of userMessages) {
    const content = msg.content as any
    if (content && typeof content === 'object' && content.text) {
      texts.push(content.text)
    }
  }

  // 统计高频词
  const wordCounts = new Map<string, number>()
  const keywords = [
    '火锅', '周末', '约饭', '重庆', '美食', '运动', '电影', '咖啡', '聚会',
    '打球', '篮球', '足球', '羽毛球', '游泳', '健身', '跑步', '爬山',
    '唱歌', 'KTV', '桌游', '剧本杀', '密室', '展览', '音乐会',
    '奶茶', '烧烤', '串串', '小龙虾', '日料', '西餐', '川菜',
    '周六', '周日', '今晚', '明天', '下午', '晚上',
  ]

  for (const text of texts) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        wordCounts.set(keyword, (wordCounts.get(keyword) || 0) + 1)
      }
    }
  }

  // 排序并取 Top 20
  const sortedWords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({
      word,
      count,
      trend: 'stable' as const, // 简化处理，后续可对比上周数据
    }))

  // 统计意图分布（简化版，基于关键词分类）
  const intentCounts = {
    '美食': 0,
    '运动': 0,
    '娱乐': 0,
    '社交': 0,
    '其他': 0,
  }

  for (const text of texts) {
    if (/火锅|烧烤|串串|美食|约饭|奶茶|日料|西餐|川菜/.test(text)) {
      intentCounts['美食']++
    } else if (/运动|打球|篮球|足球|羽毛球|游泳|健身|跑步|爬山/.test(text)) {
      intentCounts['运动']++
    } else if (/电影|唱歌|KTV|桌游|剧本杀|密室|展览|音乐会/.test(text)) {
      intentCounts['娱乐']++
    } else if (/聚会|咖啡|社交/.test(text)) {
      intentCounts['社交']++
    } else {
      intentCounts['其他']++
    }
  }

  const totalIntents = Object.values(intentCounts).reduce((a, b) => a + b, 0)
  const intentDistribution = Object.entries(intentCounts)
    .map(([intent, count]) => ({
      intent,
      count,
      percentage: totalIntents > 0 ? (count / totalIntents) * 100 : 0,
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)

  return {
    topWords: sortedWords,
    intentDistribution,
    period,
  }
}
