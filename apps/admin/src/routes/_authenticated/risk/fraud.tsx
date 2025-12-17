import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { FraudDetection } from '@/features/risk-management/components/fraud-detection'

const fraudSearchSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
  fraudType: z.array(z.enum(['fake_profile', 'payment_fraud', 'activity_manipulation', 'review_fraud'])).optional(),
  status: z.array(z.enum(['detected', 'confirmed', 'false_positive', 'investigating'])).optional(),
  detectionMethod: z.array(z.enum(['rule_based', 'ml_model', 'manual_review'])).optional(),
  confidenceMin: z.number().min(0).max(100).optional(),
  confidenceMax: z.number().min(0).max(100).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default('detectedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const Route = createFileRoute('/_authenticated/risk/fraud')({
  validateSearch: fraudSearchSchema,
  component: FraudDetection,
})