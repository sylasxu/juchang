/**
 * Data Stream Parser for WeChat MiniProgram
 * 解析 Vercel AI SDK Data Stream Protocol 格式
 * 
 * Data Stream 格式说明：
 * - 0:"text"     → 文本增量
 * - 9:{...}      → Tool Call (工具调用)
 * - a:{...}      → Tool Result (工具结果)
 * - d:{...}      → Done + Usage (完成信号)
 * - e:{...}      → Error (错误)
 * - 2:[...]      → Data (附加数据)
 * - 8:[...]      → Message Annotations
 * 
 * @see https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
 */

/** Tool Call 数据结构 */
export interface ToolCall {
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
}

/** Tool Result 数据结构 */
export interface ToolResult {
  toolCallId: string
  result: unknown
}

/** Usage 统计数据 */
export interface UsageStats {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

/** 解析器回调配置 */
export interface DataStreamParserCallbacks {
  /** 收到文本增量时触发 */
  onText?: (text: string) => void
  /** 收到 Tool Call 时触发 */
  onToolCall?: (toolCall: ToolCall) => void
  /** 收到 Tool Result 时触发 */
  onToolResult?: (result: ToolResult) => void
  /** 流完成时触发 */
  onDone?: (usage?: UsageStats) => void
  /** 发生错误时触发 */
  onError?: (error: string) => void
  /** 收到附加数据时触发 */
  onData?: (data: unknown[]) => void
}

/** 解析器状态 */
interface ParserState {
  buffer: string
  accumulatedText: string
  toolCalls: Map<string, ToolCall>
}

/**
 * Data Stream Parser Class
 * 处理流式数据的解析，支持粘包和不完整数据
 */
export class DataStreamParser {
  private state: ParserState
  private callbacks: DataStreamParserCallbacks

  constructor(callbacks: DataStreamParserCallbacks = {}) {
    this.callbacks = callbacks
    this.state = {
      buffer: '',
      accumulatedText: '',
      toolCalls: new Map(),
    }
  }

  /**
   * 喂入数据块进行解析
   * @param chunk 数据块（可能包含多行或不完整的行）
   */
  feed(chunk: string): void {
    // 将新数据追加到 buffer
    this.state.buffer += chunk

    // 按行分割处理
    const lines = this.state.buffer.split('\n')
    
    // 最后一行可能不完整，保留在 buffer 中
    this.state.buffer = lines.pop() || ''

    // 处理完整的行
    for (const line of lines) {
      this.parseLine(line.trim())
    }
  }

  /**
   * 解析单行数据
   */
  private parseLine(line: string): void {
    if (!line) return

    // 匹配格式: TYPE:CONTENT
    // TYPE 是单个字符或数字
    const match = line.match(/^([0-9a-f]):(.*)$/i)
    if (!match) {
      console.warn('[DataStreamParser] Invalid line format:', line)
      return
    }

    const [, type, content] = match

    try {
      switch (type) {
        case '0': // Text
          this.handleText(content)
          break
        case '9': // Tool Call
          this.handleToolCall(content)
          break
        case 'a': // Tool Result
          this.handleToolResult(content)
          break
        case 'd': // Done
          this.handleDone(content)
          break
        case 'e': // Error
          this.handleError(content)
          break
        case '2': // Data
          this.handleData(content)
          break
        case '8': // Message Annotations
          // 暂时忽略 annotations
          break
        default:
          console.warn('[DataStreamParser] Unknown type:', type)
      }
    } catch (err) {
      console.error('[DataStreamParser] Parse error:', err, 'Line:', line)
    }
  }

  /**
   * 处理文本增量
   * 格式: 0:"text content"
   */
  private handleText(content: string): void {
    // content 是 JSON 字符串格式，需要解析
    const text = JSON.parse(content) as string
    this.state.accumulatedText += text
    this.callbacks.onText?.(text)
  }

  /**
   * 处理 Tool Call
   * 格式: 9:{"toolCallId":"xxx","toolName":"xxx","args":{...}}
   */
  private handleToolCall(content: string): void {
    const data = JSON.parse(content) as ToolCall
    this.state.toolCalls.set(data.toolCallId, data)
    this.callbacks.onToolCall?.(data)
  }

  /**
   * 处理 Tool Result
   * 格式: a:{"toolCallId":"xxx","result":{...}}
   */
  private handleToolResult(content: string): void {
    const data = JSON.parse(content) as ToolResult
    this.callbacks.onToolResult?.(data)
  }

  /**
   * 处理完成信号
   * 格式: d:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":20}}
   */
  private handleDone(content: string): void {
    const data = JSON.parse(content) as {
      finishReason?: string
      usage?: UsageStats
    }
    this.callbacks.onDone?.(data.usage)
  }

  /**
   * 处理错误
   * 格式: e:"error message" 或 e:{"message":"..."}
   */
  private handleError(content: string): void {
    const data = JSON.parse(content)
    const errorMessage = typeof data === 'string' ? data : data.message || 'Unknown error'
    this.callbacks.onError?.(errorMessage)
  }

  /**
   * 处理附加数据
   * 格式: 2:[{...}, {...}]
   */
  private handleData(content: string): void {
    const data = JSON.parse(content) as unknown[]
    this.callbacks.onData?.(data)
  }

  /**
   * 获取累积的文本内容
   */
  getAccumulatedText(): string {
    return this.state.accumulatedText
  }

  /**
   * 获取所有 Tool Calls
   */
  getToolCalls(): ToolCall[] {
    return Array.from(this.state.toolCalls.values())
  }

  /**
   * 重置解析器状态
   */
  reset(): void {
    this.state = {
      buffer: '',
      accumulatedText: '',
      toolCalls: new Map(),
    }
  }

  /**
   * 刷新 buffer（处理最后可能不完整的数据）
   */
  flush(): void {
    if (this.state.buffer.trim()) {
      this.parseLine(this.state.buffer.trim())
      this.state.buffer = ''
    }
  }
}

/**
 * 工厂函数 - 创建 Data Stream Parser
 */
export function createDataStreamParser(
  callbacks: DataStreamParserCallbacks = {}
): DataStreamParser {
  return new DataStreamParser(callbacks)
}

/**
 * 辅助函数 - 从 Tool Call 中提取 Widget 类型
 * 根据 toolName 判断应该渲染哪种 Widget
 */
export function getWidgetTypeFromToolCall(toolCall: ToolCall): string | null {
  const toolNameToWidget: Record<string, string> = {
    createActivityDraft: 'widget_draft',
    exploreNearby: 'widget_explore',
  }
  return toolNameToWidget[toolCall.toolName] || null
}

/**
 * 辅助函数 - 判断是否是 Widget 相关的 Tool
 */
export function isWidgetTool(toolName: string): boolean {
  const widgetTools = ['createActivityDraft', 'exploreNearby']
  return widgetTools.includes(toolName)
}

export default DataStreamParser
