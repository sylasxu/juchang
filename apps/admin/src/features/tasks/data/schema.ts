import { Type, type Static } from '@sinclair/typebox'

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  status: Type.String(),
  label: Type.String(),
  priority: Type.String(),
})

export type Task = Static<typeof taskSchema>
