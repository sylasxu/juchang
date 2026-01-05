import { useEffect, useMemo, useState } from 'react'
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type Table as TanStackTable,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { createSelectColumn } from './select-column'

export interface FacetedFilterConfig {
  columnId: string
  title: string
  options: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
}

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  pageCount: number
  search: Record<string, unknown>
  navigate: NavigateFn
  getRowId?: (row: TData) => string
  searchPlaceholder?: string
  emptyMessage?: string
  enableRowSelection?: boolean
  enableSorting?: boolean
  enableColumnVisibility?: boolean
  facetedFilters?: FacetedFilterConfig[]
  toolbarActions?: React.ReactNode
  bulkActions?: (table: TanStackTable<TData>) => React.ReactNode
  onSelectedRowsChange?: (rows: TData[]) => void
}


export function DataTable<TData>({
  data,
  columns,
  pageCount: externalPageCount,
  search,
  navigate,
  getRowId,
  searchPlaceholder = '搜索...',
  emptyMessage = '暂无数据',
  enableRowSelection = true,
  enableSorting = true,
  enableColumnVisibility = true,
  facetedFilters = [],
  toolbarActions,
  bulkActions,
  onSelectedRowsChange,
}: DataTableProps<TData>) {
  // Auto-add select column when row selection is enabled
  const columnsWithSelect = useMemo(() => {
    if (!enableRowSelection) return columns
    // Check if select column already exists
    const hasSelectColumn = columns.some((col) => col.id === 'select')
    if (hasSelectColumn) return columns
    return [createSelectColumn<TData>(), ...columns]
  }, [columns, enableRowSelection])
  // Local UI-only states
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // Sync selected rows to parent
  useEffect(() => {
    if (onSelectedRowsChange) {
      const selectedIndices = Object.keys(rowSelection).filter(key => rowSelection[key])
      const selectedData = selectedIndices.map(index => data[parseInt(index)]).filter(Boolean)
      onSelectedRowsChange(selectedData)
    }
  }, [rowSelection, data, onSelectedRowsChange])

  // Build columnFilters config from facetedFilters
  const columnFiltersConfig = facetedFilters.map((f) => ({
    columnId: f.columnId,
    searchKey: f.columnId,
    type: 'array' as const,
  }))

  // Synced with URL states
  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: columnFiltersConfig,
  })

  const table = useReactTable({
    data,
    columns: columnsWithSelect,
    pageCount: externalPageCount ?? -1,
    getRowId,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection,
    enableSorting,
    enableHiding: enableColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  })

  const pageCount = externalPageCount ?? 1
  useEffect(() => {
    ensurePageInRange(pageCount)
  }, [pageCount, ensurePageInRange])

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder={searchPlaceholder}
        filters={facetedFilters}
      />
      {toolbarActions && (
        <div className='flex items-center gap-2'>
          {toolbarActions}
        </div>
      )}

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
                  colSpan={columnsWithSelect.length}
                  className='h-24 text-center'
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} className='mt-auto' />

      {bulkActions?.(table)}
    </div>
  )
}
