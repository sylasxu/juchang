import { Type, type Static } from '@sinclair/typebox'

export const activitySchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Type.Optional(Type.String()),
  category: Type.Union([
    Type.Literal('sports'),
    Type.Literal('food'),
    Type.Literal('entertainment'),
    Type.Literal('study'),
    Type.Literal('travel'),
    Type.Literal('other'),
  ]),
  status: Type.Union([
    Type.Literal('active'),
    Type.Literal('completed'),
    Type.Literal('cancelled'),
    Type.Literal('draft'),
  ]),
  maxParticipants: Type.Number({ minimum: 1 }),
  currentParticipants: Type.Number({ minimum: 0 }),
  location: Type.String(),
  startTime: Type.String({ format: 'date-time' }),
  endTime: Type.String({ format: 'date-time' }),
  createdBy: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
})

export type Activity = Static<typeof activitySchema>