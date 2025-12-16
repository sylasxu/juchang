import { createFileRoute } from '@tanstack/react-router';
import { RevenueAnalyticsPage } from '@/features/transactions/revenue-analytics-page';

export const Route = createFileRoute('/_authenticated/transactions/revenue')({
  component: RevenueAnalyticsPage,
});