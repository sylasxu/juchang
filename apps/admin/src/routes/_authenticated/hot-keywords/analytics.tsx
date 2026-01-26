import { createFileRoute } from '@tanstack/react-router'
import { HotKeywordsAnalytics } from '@/features/hot-keywords/components/hot-keywords-analytics'

export const Route = createFileRoute('/_authenticated/hot-keywords/analytics')({
  component: HotKeywordsAnalytics,
})
