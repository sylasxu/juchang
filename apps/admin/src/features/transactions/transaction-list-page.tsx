import { useState, useMemo } from 'react';
import { 
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Eye,
  RotateCcw,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination, DataTableToolbar } from '@/components/data-table';
import { cn } from '@/lib/utils';
import { TransactionBulkActions } from './components/transaction-bulk-actions';

// 交易状态映射
const statusMap = {
  pending: { label: '待支付', variant: 'secondary' as const },
  paid: { label: '已支付', variant: 'default' as const },
  failed: { label: '支付失败', variant: 'destructive' as const },
  refunded: { label: '已退款', variant: 'outline' as const },
};

// 产品类型映射
const productTypeMap = {
  boost: '强力召唤',
  pin_plus: '黄金置顶',
  fast_pass: '优先入场券',
  ai_report: 'AI深度风控报告',
  ai_pack: 'AI额度包',
  pro_monthly: 'Pro会员(月费)',
};

interface Transaction {
  id: string;
  userId: string;
  productType: string;
  productName: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  outTradeNo: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  userInfo: {
    id: string;
    nickname?: string;
    phoneNumber?: string;
  };
  relatedActivityInfo?: {
    id: string;
    title: string;
  };
}

// 模拟数据
const mockTransactions: Transaction[] = [
  {
    id: '1',
    userId: 'user1',
    productType: 'boost',
    productName: '强力召唤',
    amount: 1000,
    status: 'paid',
    outTradeNo: 'TXN20241216001',
    transactionId: 'wx_pay_123456',
    paidAt: '2024-12-16T10:30:00Z',
    createdAt: '2024-12-16T10:25:00Z',
    userInfo: {
      id: 'user1',
      nickname: '张三',
      phoneNumber: '138****1234',
    },
    relatedActivityInfo: {
      id: 'activity1',
      title: '周末聚餐活动',
    },
  },
  {
    id: '2',
    userId: 'user2',
    productType: 'pin_plus',
    productName: '黄金置顶',
    amount: 500,
    status: 'pending',
    outTradeNo: 'TXN20241216002',
    createdAt: '2024-12-16T11:00:00Z',
    userInfo: {
      id: 'user2',
      nickname: '李四',
      phoneNumber: '139****5678',
    },
  },
  {
    id: '3',
    userId: 'user3',
    productType: 'fast_pass',
    productName: '优先入场券',
    amount: 300,
    status: 'failed',
    outTradeNo: 'TXN20241216003',
    createdAt: '2024-12-16T12:00:00Z',
    userInfo: {
      id: 'user3',
      nickname: '王五',
      phoneNumber: '137****9012',
    },
  },
  {
    id: '4',
    userId: 'user4',
    productType: 'ai_pack',
    productName: 'AI额度包',
    amount: 2000,
    status: 'refunded',
    outTradeNo: 'TXN20241216004',
    transactionId: 'wx_pay_789012',
    paidAt: '2024-12-16T13:00:00Z',
    createdAt: '2024-12-16T12:55:00Z',
    userInfo: {
      id: 'user4',
      nickname: '赵六',
      phoneNumber: '136****3456',
    },
  },
];



export function TransactionListPage() {
  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ 
    pageIndex: 0, 
    pageSize: 10 
  });

  // 表格列定义
  const columns: ColumnDef<Transaction>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
            className="rounded border border-input"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            className="rounded border border-input"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'outTradeNo',
        header: '订单号',
        cell: ({ row }) => (
          <div className="font-mono text-sm">
            {row.getValue('outTradeNo')}
          </div>
        ),
      },
      {
        accessorKey: 'userInfo',
        header: '用户信息',
        cell: ({ row }) => {
          const userInfo = row.getValue('userInfo') as Transaction['userInfo'];
          return (
            <div className="space-y-1">
              <div className="font-medium">{userInfo.nickname || '未设置昵称'}</div>
              <div className="text-sm text-muted-foreground">{userInfo.phoneNumber}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'productName',
        header: '产品',
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{row.getValue('productName')}</div>
            <div className="text-sm text-muted-foreground">
              {productTypeMap[row.original.productType as keyof typeof productTypeMap]}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: '金额',
        cell: ({ row }) => {
          const amount = row.getValue('amount') as number;
          return (
            <div className="font-medium">
              ¥{(amount / 100).toFixed(2)}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ row }) => {
          const status = row.getValue('status') as keyof typeof statusMap;
          const statusInfo = statusMap[status];
          return (
            <Badge variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: '创建时间',
        cell: ({ row }) => {
          const date = new Date(row.getValue('createdAt'));
          return (
            <div className="text-sm">
              {format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
            </div>
          );
        },
      },
      {
        accessorKey: 'paidAt',
        header: '支付时间',
        cell: ({ row }) => {
          const paidAt = row.getValue('paidAt') as string | undefined;
          if (!paidAt) return <span className="text-muted-foreground">-</span>;
          const date = new Date(paidAt);
          return (
            <div className="text-sm">
              {format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            {row.original.status === 'paid' && (
              <Button variant="ghost" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  // 创建表格实例
  const table = useReactTable({
    data: mockTransactions,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue) => {
      const outTradeNo = String(row.getValue('outTradeNo')).toLowerCase();
      const userInfo = row.getValue('userInfo') as Transaction['userInfo'];
      const nickname = String(userInfo.nickname || '').toLowerCase();
      const phoneNumber = String(userInfo.phoneNumber || '').toLowerCase();
      const searchValue = String(filterValue).toLowerCase();

      return outTradeNo.includes(searchValue) || 
             nickname.includes(searchValue) || 
             phoneNumber.includes(searchValue);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // 状态筛选选项
  const statusOptions = Object.entries(statusMap).map(([value, { label }]) => ({
    label,
    value,
  }));

  // 产品类型筛选选项
  const productTypeOptions = Object.entries(productTypeMap).map(([value, label]) => ({
    label,
    value,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      {/* 页面标题 - 完全复制 tasks 页面的布局 */}
      <div className='flex flex-wrap items-end justify-between gap-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>交易管理</h2>
          <p className='text-muted-foreground'>
            管理平台所有交易记录，支持筛选、搜索和退款处理
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建交易
          </Button>
        </div>
      </div>

      {/* 数据表格 - 完全复制 tasks 页面的结构 */}
      <div className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16', // Add margin bottom to the table on mobile when the toolbar is visible
        'flex flex-1 flex-col gap-4'
      )}>
        <DataTableToolbar
          table={table}
          searchPlaceholder='搜索订单号、用户昵称或手机号...'
          filters={[
            {
              columnId: 'status',
              title: '交易状态',
              options: statusOptions,
            },
            {
              columnId: 'productType',
              title: '产品类型',
              options: productTypeOptions,
            },
          ]}
        />
        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          header.column.columnDef.meta?.className,
                          header.column.columnDef.meta?.thClassName
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.columnDef.meta?.className,
                          cell.column.columnDef.meta?.tdClassName
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='h-24 text-center'
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} className='mt-auto' />
        <TransactionBulkActions table={table} />
      </div>
    </div>
  );
}