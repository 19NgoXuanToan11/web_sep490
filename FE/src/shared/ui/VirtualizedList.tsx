import React, { memo, useMemo } from 'react'

import { FixedSizeList } from 'react-window'

interface VirtualizedListProps<T> {
    items: T[]
    height: number
    itemHeight: number
    renderItem: (props: { index: number; style: React.CSSProperties; data: T[] }) => React.ReactElement
    className?: string
}

export const VirtualizedList = memo(<T,>({
    items,
    height,
    itemHeight,
    renderItem,
    className
}: VirtualizedListProps<T>) => {
    const ItemRenderer = useMemo(() => {
        return ({ index, style }: { index: number; style: React.CSSProperties }) => {
            return renderItem({ index, style, data: items })
        }
    }, [items, renderItem])

    if (items.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-gray-500">
                Không có dữ liệu
            </div>
        )
    }

    return (
        <div className={className}>
            <FixedSizeList
                height={height}
                itemCount={items.length}
                itemSize={itemHeight}
                itemData={items}
            >
                {ItemRenderer}
            </FixedSizeList>
        </div>
    )
}) as <T>(props: VirtualizedListProps<T>) => React.ReactElement
