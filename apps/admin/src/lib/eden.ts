// Eden Treaty 客户端 - 类型安全的 API 调用
import { treaty } from '@elysiajs/eden'
import type { App } from '@juchang/api'

// 使用根目录 .env 中的 API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const api = treaty<App>(API_BASE_URL)

// 使用示例：
// const { data, error } = await api.users.get({ query: { page: 1, limit: 20 } })
// const { data, error } = await api.users({ id: 'xxx' }).get()
