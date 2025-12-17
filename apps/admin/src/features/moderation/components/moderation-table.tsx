import { useEffect, useState } from 'react'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/data-table/pagination'
import { useModerationContext } from './moderation-provider'
import { useModerationQueue } from '@/hooks/use-moderation'
import { moderationColumns } from './moderation-columns'
import { ModerationTableToolbar } from './moderation-table-toolbar'
import { ModerationBulkActions } from './moderation-bulk-actions'

export function ModerationTable() {
  const { filters, setFilters, selectedItems, setSelectedItems } = useModerationContext()
  const { data: queueData, isLoading } = useModerationQueue(filters)

  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // Convert our filters to table state
  const globalFilter = filters.search || ''
  const columnFilters = [
    ...(filters.status ? [{ id: 'status', value: filters.status }] : []),
    ...(filters.priority ? [{ id: 'priority', value: filters.priority }] : []),
    ...(filters.type ? [{ id: 'type', value: filters.type }] : []),
  ]

  const table = useReactTable({
    data: queueData?.data || [],
    columns: moderationColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: (filters.page || 1) - 1,
        pageSize: filters.limit || 20,
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater)
      // Update selected items in context
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater
      const selectedIds = Object.keys(newSelection).filter(key => newSelection[key])
      setSelectedItems(selectedIds)
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' 
        ? updater({ pageIndex: (filters.page || 1) - 1, pageSize: filters.limit || 20 })
        : updater
      
      setFilters({
        ...filters,
        page: newPagination.pageIndex + 1,
        limit: newPagination.pageSize
      })
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      const title = String(row.getValue('title')).toLowerCase()
      const description = String(row.original.description || '').toLowerCase()
      const reportReason = String(row.original.reportReason || '').toLowerCase()
      const searchValue = String(filterValue).toLowerCase()

      return title.includes(searchValue) || 
             description.includes(searchValue) || 
             reportReason.includes(searchValue)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    pageCount: queueData ? Math.ceil(queueData.total / (filters.limit || 20)) : 0,
  })

  return (
    <div className={cn('flex flex-1 flex-col gap-4')}>
      <ModerationTableToolbar 
        filters={filters}
        onFiltersChange={(newFilters) => setFilters({ ...filters, ...newFilters, page: 1 })}
      />
      
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={moderationColumns.length}
                  className='h-24 text-center'
                >
                  加载中...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                  colSpan={moderationColumns.length}
                  className='h-24 text-center'
                >
                  暂无审核项目
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination 
        table={table} 
        className='mt-auto'
      />
      
      <ModerationBulkActions table={table} />
    </div>
  )
}