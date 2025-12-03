import * as React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Button } from './button'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface StaffDataTableColumn<T> {
    /** Unique column key */
    id: string
    /** Header label or custom node */
    header: React.ReactNode
    /** Optional custom class for header cell */
    headerClassName?: string
    /** Optional custom class for body cell */
    cellClassName?: string
    /** Render function for cell content */
    render: (item: T, index: number, ordinal: number) => React.ReactNode
}

export interface StaffDataTableProps<T> {
    /** Dữ liệu hiển thị trong bảng */
    data: T[]
    /** Cấu hình các cột */
    columns: StaffDataTableColumn<T>[]
    /** Lấy key duy nhất cho mỗi dòng */
    getRowKey: (item: T, index: number) => React.Key
    /** Số trang hiện tại (bắt đầu từ 1) */
    currentPage?: number
    /** Kích thước trang */
    pageSize?: number
    /** Tổng số trang */
    totalPages?: number
    /** Đổi trang */
    onPageChange?: (page: number) => void
    /** Lớp CSS bổ sung cho wrapper */
    className?: string
    /** Tiêu đề khi không có dữ liệu */
    emptyTitle?: string
    /** Mô tả khi không có dữ liệu */
    emptyDescription?: string
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
}: StaffDataTableProps<T>) {
    const ordinalBase = React.useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize])

    const handlePageChange = (page: number) => {
        if (!onPageChange) return
        if (page < 1 || page > totalPages) return
        onPageChange(page)
    }

    const pageNumbers = React.useMemo(
        () => Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1),
        [totalPages],
    )

    return (
        <div className={cn(className)}>
            <div className="border rounded-lg overflow-hidden mt-4">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
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
                            return (
                                <TableRow key={getRowKey(item, index)} className="hover:bg-gray-50">
                                    <TableCell className="text-center">{ordinal}</TableCell>
                                    {columns.map(column => (
                                        <TableCell key={column.id} className={column.cellClassName}>
                                            {column.render(item, index, ordinal)}
                                        </TableCell>
                                    ))}
                                </TableRow>
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
                <div className="flex items-center justify-end mt-6">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Trước
                        </Button>

                        <div className="flex items-center gap-1">
                            {pageNumbers.map(page => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                    className="w-10"
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Sau
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}


