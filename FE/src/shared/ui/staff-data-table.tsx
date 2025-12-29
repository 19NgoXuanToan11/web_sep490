import * as React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Package, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Pagination } from './pagination'

export interface StaffDataTableColumn<T> {
    id: string
    header: React.ReactNode
    headerClassName?: string
    cellClassName?: string
    render: (item: T, index: number, ordinal: number) => React.ReactNode
}

export interface StaffDataTableProps<T> {
    data: T[]
    columns: StaffDataTableColumn<T>[]
    getRowKey: (item: T, index: number) => React.Key
    currentPage?: number
    pageSize?: number
    totalPages?: number
    onPageChange?: (page: number) => void
    className?: string
    emptyTitle?: string
    emptyDescription?: string
    renderExpandedContent?: (item: T, index: number, ordinal: number) => React.ReactNode
    canExpand?: (item: T) => boolean
}

export function StaffDataTable<T>({
    data,
    columns,
    getRowKey,
    currentPage = 1,
    pageSize = data.length || 10,
    totalPages = 1,
    onPageChange,
    className,
    emptyTitle = 'Không có dữ liệu',
    emptyDescription = 'Không có bản ghi nào để hiển thị.',
    renderExpandedContent,
    canExpand,
}: StaffDataTableProps<T>) {
    const ordinalBase = React.useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize])
    const [expandedRows, setExpandedRows] = React.useState<Set<React.Key>>(new Set())

    const handlePageChange = (page: number) => {
        if (!onPageChange) return
        if (page < 1 || page > totalPages) return
        onPageChange(page)
    }

    const toggleRow = (key: React.Key) => {
        setExpandedRows(prev => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    const isRowExpanded = (key: React.Key) => expandedRows.has(key)

    return (
        <div className={cn(className)}>
            <div className="border rounded-lg overflow-hidden mt-4">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            {renderExpandedContent && (
                                <TableHead className="w-12"></TableHead>
                            )}
                            <TableHead className="w-16 text-center">STT</TableHead>
                            {columns.map(column => (
                                <TableHead key={column.id} className={cn('font-semibold', column.headerClassName)}>
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, index) => {
                            const ordinal = ordinalBase + index + 1
                            const rowKey = getRowKey(item, index)
                            const isExpandable = canExpand ? canExpand(item) : false
                            const isExpanded = isRowExpanded(rowKey)

                            return (
                                <React.Fragment key={rowKey}>
                                    <TableRow className="hover:bg-gray-50">
                                        {renderExpandedContent && (
                                            <TableCell className="w-12">
                                                {isExpandable ? (
                                                    <button
                                                        onClick={() => toggleRow(rowKey)}
                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                        aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 text-gray-600" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-gray-600" />
                                                        )}
                                                    </button>
                                                ) : null}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-center">{ordinal}</TableCell>
                                        {columns.map(column => (
                                            <TableCell key={column.id} className={column.cellClassName}>
                                                {column.render(item, index, ordinal)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {isExpandable && isExpanded && renderExpandedContent && (
                                        <TableRow>
                                            <TableCell colSpan={columns.length + 2} className="p-0 bg-gray-50">
                                                <div className="p-4">
                                                    {renderExpandedContent(item, index, ordinal)}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </TableBody>
                </Table>

                {data.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyTitle}</h3>
                        <p className="text-gray-500">{emptyDescription}</p>
                    </div>
                )}
            </div>

            {onPageChange && totalPages > 1 && (
                <div className="flex items-center justify-end mt-6 pr-4 sm:pr-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    )
}


