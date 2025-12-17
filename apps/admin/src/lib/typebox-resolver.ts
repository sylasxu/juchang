import { type TSchema } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

// Simple TypeBox resolver for react-hook-form
// This bypasses complex type issues by using a simpler approach
export function typeboxResolver<T extends TSchema>(schema: T) {
  return (values: any) => {
    try {
      // Validate the values against the schema
      const isValid = Value.Check(schema, values)
      
      if (isValid) {
        return {
          values: values,
          errors: {},
        }
      }

      // Get validation errors
      const errors = [...Value.Errors(schema, values)]
      const fieldErrors: Record<string, any> = {}

      errors.forEach((error) => {
        const path = error.path.replace(/^\//, '').replace(/\//g, '.')
        if (path) {
          fieldErrors[path] = {
            type: 'validation',
            message: error.message,
          }
        }
      })

      return {
        values: {},
        errors: fieldErrors,
      }
    } catch (error) {
      return {
        values: {},
        errors: {
          root: {
            type: 'validation',
            message: 'Validation failed',
          },
        },
      }
    }
  }
}