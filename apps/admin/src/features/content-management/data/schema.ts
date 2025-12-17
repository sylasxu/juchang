import { Type, type Static } from '@sinclair/typebox'

export const contentSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  type: Type.Union([
    Type.Literal('privacy'),
    Type.Literal('terms'),
    Type.Literal('help'),
    Type.Literal('announcement'),
    Type.Literal('h5'),
  ]),
  status: Type.Union([
    Type.Literal('published'),
    Type.Literal('draft'),
    Type.Literal('archived'),
    Type.Literal('pending'),
  ]),
  content: Type.Optional(Type.String()),
  url: Type.Optional(Type.String()),
  order: Type.Number({ minimum: 0 }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  publishedAt: Type.Optional(Type.String({ format: 'date-time' })),
})

export type Content = Static<typeof contentSchema>