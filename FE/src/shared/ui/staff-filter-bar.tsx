import React from 'react'
import { cn } from '@/shared/lib/utils'

interface StaffFilterBarProps {
    children: React.ReactNode
    className?: string
}

/**
 * Thanh filter/search chung cho các màn quản lý của Staff.
 * Đảm nhận phần khung giao diện (nền xám, viền, padding, layout responsive).
 * Nội dung bên trong (ô tìm kiếm, combobox, nút...) được truyền qua children.
 */
export const StaffFilterBar: React.FC<StaffFilterBarProps> = ({ children, className }) => {
    return (
        <div
            className={cn(
                'bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6',
                className
            )}
        >
            <div className="flex flex-col sm:flex-row gap-4">
                {children}
            </div>
        </div>
    )
}

export default StaffFilterBar


