// Transaction Model - 支付交易相关 TypeBox Schema
import { Elysia, t, type Static } from 'elysia';
import { selectTransactionSchema } from '@juchang/db';

// 创建交易请求
const CreateTransactionRequest = t.Object({
  productType: t.Union([
    t.Literal('boost'),
    t.Literal('pin_plus'),
    t.Literal('fast_pass'),
    t.Literal('ai_report'),
    t.Literal('ai_pack'),
    t.Literal('pro_monthly'),
  ]),
  relatedId: t.Optional(t.String({ format: 'uuid' })), // 关联的活动ID或用户ID
  metadata: t.Optional(t.Object({})),
});

// 微信支付回调
const WxPayCallback = t.Object({
  out_trade_no: t.String(),
  transaction_id: t.String(),
  trade_state: t.String(),
  trade_state_desc: t.String(),
  success_time: t.Optional(t.String()),
  amount: t.Object({
    total: t.Number(),
    currency: t.String(),
  }),
});

// 交易列表查询
const TransactionListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 20 })),
  status: t.Optional(t.Union([
    t.Literal('pending'),
    t.Literal('paid'),
    t.Literal('failed'),
    t.Literal('refunded'),
  ])),
  productType: t.Optional(t.String()),
});

// 交易列表响应
const TransactionListResponse = t.Object({
  data: t.Array(selectTransactionSchema),
  total: t.Number(),
  page: t.Number(),
  totalPages: t.Number(),
});

// 创建交易响应
const CreateTransactionResponse = t.Object({
  transactionId: t.String(),
  paymentParams: t.Object({
    appId: t.String(),
    timeStamp: t.String(),
    nonceStr: t.String(),
    package: t.String(),
    signType: t.String(),
    paySign: t.String(),
  }),
});

// 路径参数
const IdParams = t.Object({
  id: t.String({ format: 'uuid' }),
});

// 错误响应
const ErrorResponse = t.Object({
  code: t.Number(),
  msg: t.String(),
});

// 购买强力召唤请求
const BoostRequest = t.Object({
  activityId: t.String({ format: 'uuid' }),
});

// 购买黄金置顶请求
const PinPlusRequest = t.Object({
  activityId: t.String({ format: 'uuid' }),
});

// 购买优先入场券请求
const FastPassRequest = t.Object({
  activityId: t.String({ format: 'uuid' }),
});

// 购买会员请求
const MembershipRequest = t.Object({
  plan: t.Union([
    t.Literal('monthly'),
    t.Literal('quarterly'),
    t.Literal('yearly'),
  ]),
});

// 注册到 Elysia Model Plugin
export const transactionModel = new Elysia({ name: 'transactionModel' })
  .model({
    'transaction.create': CreateTransactionRequest,
    'transaction.wxCallback': WxPayCallback,
    'transaction.listQuery': TransactionListQuery,
    'transaction.listResponse': TransactionListResponse,
    'transaction.createResponse': CreateTransactionResponse,
    'transaction.idParams': IdParams,
    'transaction.error': ErrorResponse,
    'transaction.boostRequest': BoostRequest,
    'transaction.pinPlusRequest': PinPlusRequest,
    'transaction.fastPassRequest': FastPassRequest,
    'transaction.membershipRequest': MembershipRequest,
  });

// 导出 TS 类型
export type CreateTransactionRequest = Static<typeof CreateTransactionRequest>;
export type WxPayCallback = Static<typeof WxPayCallback>;
export type TransactionListQuery = Static<typeof TransactionListQuery>;
export type TransactionListResponse = Static<typeof TransactionListResponse>;
export type CreateTransactionResponse = Static<typeof CreateTransactionResponse>;
export type IdParams = Static<typeof IdParams>;
export type ErrorResponse = Static<typeof ErrorResponse>;

export type BoostRequest = Static<typeof BoostRequest>;
export type PinPlusRequest = Static<typeof PinPlusRequest>;
export type FastPassRequest = Static<typeof FastPassRequest>;
export type MembershipRequest = Static<typeof MembershipRequest>;