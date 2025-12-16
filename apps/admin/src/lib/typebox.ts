// TypeBox 类型集成工具
import { Type, type TSchema, type Static } from '@sinclair/typebox'

// 通用分页参数 Schema
export const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
  search: Type.Optional(Type.String()),
})

// 通用分页响应 Schema
export const PaginationResponseSchema = <T extends TSchema>(itemSchema: T) =>
  Type.Object({
    data: Type.Array(itemSchema),
    pagination: Type.Object({
      page: Type.Number(),
      limit: Type.Number(),
      total: Type.Number(),
      totalPages: Type.Number(),
      hasNext: Type.Boolean(),
      hasPrev: Type.Boolean(),
    }),
  })

// 通用 API 响应 Schema
export const ApiResponseSchema = <T extends TSchema>(dataSchema: T) =>
  Type.Object({
    success: Type.Boolean(),
    data: dataSchema,
    message: Type.Optional(Type.String()),
    timestamp: Type.String({ format: 'date-time' }),
  })

// 错误响应 Schema
export const ErrorResponseSchema = Type.Object({
  success: Type.Literal(false),
  error: Type.Object({
    code: Type.String(),
    message: Type.String(),
    details: Type.Optional(Type.Any()),
  }),
  timestamp: Type.String({ format: 'date-time' }),
})

// 管理员操作审计 Schema
export const AuditLogSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  adminId: Type.String({ format: 'uuid' }),
  action: Type.String(),
  resource: Type.String(),
  resourceId: Type.Optional(Type.String()),
  details: Type.Optional(Type.Any()),
  ipAddress: Type.Optional(Type.String()),
  userAgent: Type.Optional(Type.String()),
  createdAt: Type.String({ format: 'date-time' }),
})

// 筛选和排序参数 Schema
export const FilterSortSchema = Type.Object({
  sortBy: Type.Optional(Type.String()),
  sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
  filters: Type.Optional(Type.Record(Type.String(), Type.Any())),
})

// 批量操作参数 Schema
export const BulkActionSchema = <T extends TSchema>(actionSchema: T) =>
  Type.Object({
    ids: Type.Array(Type.String({ format: 'uuid' })),
    action: actionSchema,
    reason: Type.Optional(Type.String()),
  })

// 地理位置参数 Schema
export const LocationSchema = Type.Object({
  latitude: Type.Number({ minimum: -90, maximum: 90 }),
  longitude: Type.Number({ minimum: -180, maximum: 180 }),
})

export const LocationFilterSchema = Type.Object({
  center: LocationSchema,
  radius: Type.Number({ minimum: 0, maximum: 50000 }), // 最大 50km
  unit: Type.Optional(Type.Union([Type.Literal('m'), Type.Literal('km')])),
})

// 时间范围参数 Schema
export const DateRangeSchema = Type.Object({
  startDate: Type.String({ format: 'date-time' }),
  endDate: Type.String({ format: 'date-time' }),
})

// 管理员权限 Schema
export const PermissionSchema = Type.Object({
  resource: Type.String(),
  actions: Type.Array(Type.String()),
})

export const AdminRoleSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  description: Type.String(),
  permissions: Type.Array(PermissionSchema),
})

// 类型导出
export type PaginationQuery = Static<typeof PaginationQuerySchema>
export type PaginationResponse<T = any> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
export type ApiResponse<T = any> = {
  success: boolean
  data: T
  message?: string
  timestamp: string
}
export type ErrorResponse = Static<typeof ErrorResponseSchema>
export type AuditLog = Static<typeof AuditLogSchema>
export type FilterSort = Static<typeof FilterSortSchema>
export type BulkAction<T = any> = {
  ids: string[]
  action: T
  reason?: string
}
export type Location = Static<typeof LocationSchema>
export type LocationFilter = Static<typeof LocationFilterSchema>
export type DateRange = Static<typeof DateRangeSchema>
export type Permission = Static<typeof PermissionSchema>
export type AdminRole = Static<typeof AdminRoleSchema>

// TypeBox 验证工具函数
export function validateSchema<T extends TSchema>(
  _schema: T,
  data: unknown
): data is Static<T> {
  try {
    // 这里可以集成 TypeBox 的验证器
    // 目前先做简单的类型检查
    return typeof data === 'object' && data !== null
  } catch {
    return false
  }
}

// 创建类型安全的查询参数构建器
export function buildQueryParams(params: Record<string, any>): URLSearchParams {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })
  
  return searchParams
}

// 创建类型安全的表单数据构建器
export function buildFormData(data: Record<string, any>): FormData {
  const formData = new FormData()
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value)
      } else if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)))
      } else {
        formData.append(key, String(value))
      }
    }
  })
  
  return formData
}