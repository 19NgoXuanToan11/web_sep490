import React, { useCallback, useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { useToast } from '@/shared/ui/use-toast'
import {
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Package,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { useProductStore } from '../store/productStore'
import type { Product } from '@/shared/api/productService'

type ProductTableMode = 'manager' | 'staff'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
})

const formatPrice = (price: number) => currencyFormatter.format(price)

const getStatusBadge = (status: string) => {
  if (status === 'Active') {
    return <Badge variant="default">Hoạt động</Badge>
  }

  return <Badge variant="secondary">Vô hiệu</Badge>
}

const getQuantityBadge = (quantity: number) => {
  if (quantity === 0) {
    return <Badge variant="destructive">Hết hàng</Badge>
  }

  if (quantity < 10) {
    return <Badge variant="warning">Sắp hết</Badge>
  }

  return <Badge variant="secondary">{quantity}</Badge>
}

interface ProductRowProps {
  product: Product
  ordinalNumber: number
  isReadOnly: boolean
  isSelected: boolean
  onToggleSelection: (productId: number) => void
  onToggleStatus: (product: Product) => void
  onViewProduct?: (product: Product) => void
  onEditProduct?: (product: Product) => void
  onDeleteProduct?: (product: Product) => void
  openDropdownId: number | null
  setOpenDropdownId: React.Dispatch<React.SetStateAction<number | null>>
}

const ProductRow = React.memo(
  ({
    product,
    ordinalNumber,
    isReadOnly,
    isSelected,
    onToggleSelection,
    onToggleStatus,
    onViewProduct,
    onEditProduct,
    onDeleteProduct,
    openDropdownId,
    setOpenDropdownId,
  }: ProductRowProps) => {
    return (
      <TableRow key={product.productId} className={`hover:bg-gray-50 ${isSelected ? 'bg-green-50' : ''}`}>
        <TableCell className="text-center">{ordinalNumber}</TableCell>
        {!isReadOnly && (
          <TableCell>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(product.productId)}
              className="rounded"
            />
          </TableCell>
        )}

        <TableCell>
          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.productName} className="w-full h-full object-cover" />
            ) : (
              <Package className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </TableCell>

        <TableCell>
          <div>
            <div className="font-medium text-gray-900">{product.productName}</div>
            <div className="text-sm text-gray-500 truncate max-w-xs">{product.productDescription}</div>
          </div>
        </TableCell>

        <TableCell>
          <span className="text-sm">{product.cropName || '-'}</span>
        </TableCell>

        <TableCell className="text-center font-medium">{formatPrice(product.price)}</TableCell>

        <TableCell className="text-center">{getQuantityBadge(product.quantity)}</TableCell>

        <TableCell className="text-center">
          {isReadOnly ? (
            <div className="flex justify-center">{getStatusBadge(product.status)}</div>
          ) : (
            <>
              <button onClick={() => onToggleStatus(product)} className="inline-flex items-center">
                {product.status === 'Active' ? (
                  <ToggleRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-gray-400" />
                )}
              </button>
              <div className="mt-1">{getStatusBadge(product.status)}</div>
            </>
          )}
        </TableCell>

        {!isReadOnly && (
          <TableCell>
            <DropdownMenu
              open={openDropdownId === product.productId}
              onOpenChange={open => {
                setOpenDropdownId(open ? product.productId : null)
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    onViewProduct?.(product)
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    onEditProduct?.(product)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDeleteProduct?.(product)
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )}

        {isReadOnly && (
          <TableCell className="text-center">
            <Button variant="ghost" size="sm" onClick={() => onViewProduct?.(product)} className="text-green-600">
              <Eye className="h-4 w-4 mr-2" />
              Xem
            </Button>
          </TableCell>
        )}
      </TableRow>
    )
  },
)

interface ProductTableProps {
  onEditProduct?: (product: Product) => void
  onViewProduct?: (product: Product) => void
  onDeleteProduct?: (product: Product) => void
  className?: string
  mode?: ProductTableMode
}

export function ProductTable({
  onEditProduct,
  onViewProduct,
  onDeleteProduct,
  className,
  mode = 'manager',
}: ProductTableProps) {
  const {
    products,
    isLoading,
    currentPage,
    pageSize,
    totalPages,
    selectedProductIds,
    toggleProductSelection,
    selectAllProducts,
    clearSelection,
    setPagination,
    changeProductStatus,
  } = useProductStore()

  const isReadOnly = mode === 'staff'
  const { toast } = useToast()
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)

  const hasSelection = useMemo(
    () => !isReadOnly && selectedProductIds.length > 0,
    [isReadOnly, selectedProductIds],
  )

  const allSelected = useMemo(
    () => products.length > 0 && selectedProductIds.length === products.length,
    [products, selectedProductIds],
  )

  const pageNumbers = useMemo(
    () => Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1),
    [totalPages],
  )

  const handleStatusToggle = useCallback(
    async (product: Product) => {
      if (isReadOnly) return

      try {
        const newStatus = product.status === 'Active' ? 'Inactive' : 'Active'
        await changeProductStatus(product.productId, newStatus)

        toast({
          title: 'Cập nhật thành công',
          description: `Đã ${newStatus === 'Active' ? 'kích hoạt' : 'vô hiệu hóa'} sản phẩm ${product.productName}`,
          variant: 'success',
        })
      } catch (error) {
        toast({
          title: 'Cập nhật thất bại',
          description: error instanceof Error ? error.message : 'Không thể cập nhật trạng thái sản phẩm',
          variant: 'destructive',
        })
      }
    },
    [changeProductStatus, isReadOnly, toast],
  )

  const handleDropdownAction = useCallback(
    (callback?: (product: Product) => void) => {
      if (!callback) return undefined
      return (product: Product) => {
        setOpenDropdownId(null)
        callback(product)
      }
    },
    [setOpenDropdownId],
  )

  const viewProductHandler = useMemo(
    () => handleDropdownAction(onViewProduct),
    [handleDropdownAction, onViewProduct],
  )
  const editProductHandler = useMemo(
    () => handleDropdownAction(onEditProduct),
    [handleDropdownAction, onEditProduct],
  )
  const deleteProductHandler = useMemo(
    () => handleDropdownAction(onDeleteProduct),
    [handleDropdownAction, onDeleteProduct],
  )

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      clearSelection()
      return
    }

    selectAllProducts()
  }, [allSelected, clearSelection, selectAllProducts])

  const ordinalBase = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize])

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {!isReadOnly && hasSelection && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-green-700">
            Đã chọn {selectedProductIds.length} sản phẩm
          </span>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Bỏ chọn
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16">STT</TableHead>
              {!isReadOnly && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </TableHead>
              )}
              <TableHead className="w-16"></TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Sản phẩm
                </div>
              </TableHead>
              <TableHead className="font-semibold">Mùa vụ</TableHead>
              <TableHead className="font-semibold text-center">Giá</TableHead>
              <TableHead className="font-semibold text-center">Số lượng</TableHead>
              <TableHead className="font-semibold text-center">Trạng thái</TableHead>
              {!isReadOnly && <TableHead className="w-16"></TableHead>}
              {isReadOnly && (
                <TableHead className="w-24 text-center font-semibold">Chi tiết</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => {
              const isSelected = !isReadOnly && selectedProductIds.includes(product.productId)
              const ordinalNumber = ordinalBase + index + 1

              return (
                <ProductRow
                  key={product.productId}
                  product={product}
                  ordinalNumber={ordinalNumber}
                  isReadOnly={isReadOnly}
                  isSelected={isSelected}
                  onToggleSelection={toggleProductSelection}
                  onToggleStatus={handleStatusToggle}
                  onViewProduct={viewProductHandler}
                  onEditProduct={editProductHandler}
                  onDeleteProduct={deleteProductHandler}
                  openDropdownId={openDropdownId}
                  setOpenDropdownId={setOpenDropdownId}
                />
              )
            })}
          </TableBody>
        </Table>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có sản phẩm</h3>
            <p className="text-gray-500">
              Chưa có sản phẩm nào được tạo. Hãy thêm sản phẩm đầu tiên.
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end mt-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(currentPage - 1)}
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
                  onClick={() => setPagination(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(currentPage + 1)}
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
