// Admin Transaction Model - 管理后台交易管理相关 TypeBox Schema
import { Elysia, t, type Static } from 'elysia';
import { selectTransactionSchema, selectUserSchema, selectActivitySchema } from '@juchang/db';

// 管理员交易视图（扩展基础交易信息）
const AdminTransactionView = t.Intersect([
  t.Omit(selectTransactionSchema, ['callbackData']), // 排除 callbackData 避免类型冲突
  t.Object({
    callbackData: t.Optional(t.Any()), // 重新定义为 Any 类型
    userInfo: t.Optional(t.Pick(selectUserSchema, ['id', 'nickname', 'phoneNumber'])),
    relatedActivityInfo: t.Optional(
      t.Object({
        id: t.String(),
        title: t.String(),
      })
    ),
    refundInfo: t.Optional(t.Object({
      refundAmount: t.Number(),
      refundReason: t.String(),
      refundedAt: t.Date()
    }))
  })
]);

// 交易筛选查询参数
const AdminTransactionFilterQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  search: t.Optional(t.String()), // 搜索用户昵称、手机号、订单号
  status: t.Optional(t.Array(t.Union([
    t.Literal('pending'),
    t.Literal('paid'),
    t.Literal('failed'),
    t.Literal('refunded'),
  ]))),
  productType: t.Optional(t.Array(t.String())),
  amountRange: t.Optional(t.Object({
    min: t.Number({ minimum: 0 }),
    max: t.Number({ minimum: 0 })
  })),
  dateRange: t.Optional(t.Object({
    start: t.Date(),
    end: t.Date()
  })),
  sortBy: t.Optional(t.Union([
    t.Literal('createdAt'),
    t.Literal('amount'),
    t.Literal('paidAt')
  ])),
  sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')]))
});

// 交易列表响应
const AdminTransactionListResponse = t.Object({
  data: t.Array(AdminTransactionView),
  total: t.Number(),
  page: t.Number(),
  totalPages: t.Number(),
  summary: t.Object({
    totalAmount: t.Number(),
    paidAmount: t.Number(),
    refundedAmount: t.Number(),
    transactionCount: t.Number()
  })
});

// 退款请求
const RefundRequest = t.Object({
  transactionId: t.String({ format: 'uuid' }),
  refundAmount: t.Number({ minimum: 1 }),
  reason: t.String({ minLength: 1, maxLength: 200 }),
  adminNotes: t.Optional(t.String({ maxLength: 500 }))
});

// 收入分析查询参数
const RevenueAnalyticsQuery = t.Object({
  period: t.Union([
    t.Literal('daily'),
    t.Literal('weekly'),
    t.Literal('monthly'),
    t.Literal('yearly')
  ]),
  startDate: t.Date(),
  endDate: t.Date(),
  productTypes: t.Optional(t.Array(t.String())),
  groupBy: t.Optional(t.Union([
    t.Literal('productType'),
    t.Literal('date'),
    t.Literal('userSegment')
  ]))
});

// 收入分析响应
const RevenueAnalyticsResponse = t.Object({
  totalRevenue: t.Number(),
  revenueByProduct: t.Record(t.String(), t.Number()),
  revenueByPeriod: t.Array(t.Object({
    period: t.String(),
    revenue: t.Number(),
    transactionCount: t.Number(),
    refundAmount: t.Number()
  })),
  conversionRates: t.Record(t.String(), t.Number()),
  userSegmentAnalysis: t.Object({
    newUsers: t.Object({
      revenue: t.Number(),
      count: t.Number()
    }),
    returningUsers: t.Object({
      revenue: t.Number(),
      count: t.Number()
    }),
    proMembers: t.Object({
      revenue: t.Number(),
      count: t.Number()
    })
  }),
  trends: t.Array(t.Object({
    date: t.String(),
    revenue: t.Number(),
    transactions: t.Number(),
    avgOrderValue: t.Number()
  }))
});

// 交易详情响应（单个交易）
const AdminTransactionDetailResponse = AdminTransactionView;

// 路径参数
const IdParams = t.Object({
  id: t.String({ format: 'uuid' }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 注册到 Elysia Model Plugin
export const adminTransactionModel = new Elysia({ name: 'adminTransactionModel' })
  .model({
    'adminTransaction.filterQuery': AdminTransactionFilterQuery,
    'adminTransaction.listResponse': AdminTransactionListResponse,
    'adminTransaction.detailResponse': AdminTransactionDetailResponse,
    'adminTransaction.refundRequest': RefundRequest,
    'adminTransaction.revenueQuery': RevenueAnalyticsQuery,
    'adminTransaction.revenueResponse': RevenueAnalyticsResponse,
    'adminTransaction.idParams': IdParams,
    'adminTransaction.error': ErrorResponse,
  });

// 导出 TS 类型
export type AdminTransactionView = Static<typeof AdminTransactionView>;
export type AdminTransactionFilterQuery = Static<typeof AdminTransactionFilterQuery>;
export type AdminTransactionListResponse = Static<typeof AdminTransactionListResponse>;
export type AdminTransactionDetailResponse = Static<typeof AdminTransactionDetailResponse>;
export type RefundRequest = Static<typeof RefundRequest>;
export type RevenueAnalyticsQuery = Static<typeof RevenueAnalyticsQuery>;
export type RevenueAnalyticsResponse = Static<typeof RevenueAnalyticsResponse>;
export type IdParams = Static<typeof IdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;