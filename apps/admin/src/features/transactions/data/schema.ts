import { Type, type Static } from '@sinclair/typebox'

export const transactionSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  activityId: Type.Optional(Type.String()),
  type: Type.Union([
    Type.Literal('payment'),
    Type.Literal('refund'),
    Type.Literal('reward'),
    Type.Literal('withdrawal'),
  ]),
  status: Type.Union([
    Type.Literal('completed'),
    Type.Literal('pending'),
    Type.Literal('failed'),
    Type.Literal('cancelled'),
  ]),
  amount: Type.Number({ minimum: 0 }),
  method: Type.Union([
    Type.Literal('wechat'),
    Type.Literal('alipay'),
    Type.Literal('balance'),
    Type.Literal('bank'),
  ]),
  description: Type.Optional(Type.String()),
  createdAt: Type.String({ format: 'date-time' }),
  completedAt: Type.Optional(Type.String({ format: 'date-time' })),
})

export type Transaction = Static<typeof transactionSchema>