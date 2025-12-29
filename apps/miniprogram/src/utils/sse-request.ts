/**
 * SSE Request for WeChat MiniProgram
 * 使用 wx.request + enableChunked 实现流式请求
 * 
 * 注意：微信小程序的 enableChunked 需要基础库 2.20.1+
 */

import { 
  createDataStreamParser, 
  type DataStreamParserCallbacks,
  type ToolCall,
  type ToolResult,
  type UsageStats,
} from './data-stream-parser'

// 基础 URL
const BASE_URL = 'http://localhost:3000'

/** SSE 请求配置 */
export interface SSERequestOptions {
  /** 请求体 */
  body?: Record<string, unknown>
  /** 额外的 headers */
  headers?: Record<string, string>
  /** 超时时间（毫秒），默认 60000 */
  timeout?: number
}

/** SSE 请求回调 */
export interface SSECallbacks extends DataStreamParserCallbacks {
  /** 请求开始 */
  onStart?: () => void
  /** 请求结束（无论成功失败） */
  onFinish?: () => void
}

/** SSE 请求返回的控制器 */
export interface SSEController {
  /** 中止请求 */
  abort: () => void
}

/**
 * 发起 SSE 流式请求
 * @param url 请求 URL（相对路径或完整 URL）
 * @param options 请求配置
 * @param callbacks 回调函数
 * @returns 控制器，可用于中止请求
 */
export function sseRequest(
  url: string,
  options: SSERequestOptions = {},
  callbacks: SSECallbacks = {}
): SSEController {
  const { body, headers = {}, timeout = 60000 } = options
  
  // 获取 token
  const token = wx.getStorageSync('token') as string
  
  // 创建解析器
  const parser = createDataStreamParser({
    onText: callbacks.onText,
    onToolCall: callbacks.onToolCall,
    onToolResult: callbacks.onToolResult,
    onDone: (usage) => {
      callbacks.onDone?.(usage)
      callbacks.onFinish?.()
    },
    onError: (error) => {
      callbacks.onError?.(error)
      callbacks.onFinish?.()
    },
    onData: callbacks.onData,
  })

  // 通知开始
  callbacks.onStart?.()

  // 发起请求
  const requestTask = wx.request({
    url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
    method: 'POST',
    data: body,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    timeout,
    enableChunked: true, // 启用分块传输
    success: () => {
      // 刷新 parser buffer
      parser.flush()
    },
    fail: (err) => {
      console.error('[SSE] Request failed:', err)
      callbacks.onError?.(err.errMsg || 'Request failed')
      callbacks.onFinish?.()
    },
  })

  // 监听分块数据
  requestTask.onChunkReceived((res) => {
    try {
      // res.data 是 ArrayBuffer，需要转换为字符串
      const chunk = arrayBufferToString(res.data)
      parser.feed(chunk)
    } catch (err) {
      console.error('[SSE] Chunk parse error:', err)
    }
  })

  // 返回控制器
  return {
    abort: () => {
      requestTask.abort()
      callbacks.onFinish?.()
    },
  }
}

/**
 * ArrayBuffer 转字符串
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
  // 使用 TextDecoder（小程序基础库 2.19.2+ 支持）
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(buffer)
  }
  
  // 降级方案：使用 Uint8Array
  const uint8Array = new Uint8Array(buffer)
  let result = ''
  for (let i = 0; i < uint8Array.length; i++) {
    result += String.fromCharCode(uint8Array[i])
  }
  // 处理 UTF-8 多字节字符
  try {
    return decodeURIComponent(escape(result))
  } catch {
    return result
  }
}

/**
 * 发送 AI Chat 消息
 * 封装 /ai/chat 端点的调用
 */
export function sendAIChat(
  message: string,
  callbacks: SSECallbacks = {},
  options: {
    /** 历史消息（可选） */
    messages?: Array<{ role: 'user' | 'assistant'; content: string }>
    /** 用户位置（可选） */
    location?: { lat: number; lng: number }
  } = {}
): SSEController {
  const { messages = [], location } = options

  // 构建消息列表
  const allMessages = [
    ...messages,
    { role: 'user' as const, content: message },
  ]

  return sseRequest(
    '/ai/chat',
    {
      body: {
        messages: allMessages,
        source: 'miniprogram',
        ...(location ? { location } : {}),
      },
    },
    callbacks
  )
}

export type { ToolCall, ToolResult, UsageStats }
