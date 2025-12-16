import { createFileRoute } from '@tanstack/react-router';
import { TransactionListPage } from '@/features/transactions/transaction-list-page';

export const Route = createFileRoute('/_authenticated/transactions/')({
  component: TransactionListPage,
});