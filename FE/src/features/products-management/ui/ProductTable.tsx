import React from 'react'
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
import { formatDate } from '@/shared/lib/date-utils'

type ProductTableMode = 'manager' | 'staff'

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
    totalCount,
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
  const [openDropdownId, setOpenDropdownId] = React.useState<number | null>(null)

  const handleStatusToggle = async (product: Product) => {
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
        description:
          error instanceof Error ? error.message : 'Không thể cập nhật trạng thái sản phẩm',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (product: Product) => {
    setOpenDropdownId(null)
    onEditProduct?.(product)
  }

  const handleView = (product: Product) => {
    setOpenDropdownId(null)
    onViewProduct?.(product)
  }

  const handleDelete = (product: Product) => {
    setOpenDropdownId(null)
    onDeleteProduct?.(product)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  // Use centralized date formatting utility from date-utils

  const getStatusBadge = (status: string) => {
    return status === 'Active' ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoạt động</Badge>
    ) : (
      <Badge variant="outline" className="text-gray-600">
        Vô hiệu
      </Badge>
    )
  }

  const getQuantityBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Hết hàng</Badge>
    } else if (quantity < 10) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Sắp hết</Badge>
    }
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{quantity}</Badge>
  }

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)
  const hasSelection = !isReadOnly && selectedProductIds.length > 0

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
      { }
      {!isReadOnly && hasSelection && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-700">
            Đã chọn {selectedProductIds.length} sản phẩm
          </span>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Bỏ chọn
          </Button>
        </div>
      )}

      { }
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16">STT</TableHead>
              {!isReadOnly && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedProductIds.length === products.length}
                    onChange={() =>
                      selectedProductIds.length === products.length
                        ? clearSelection()
                        : selectAllProducts()
                    }
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
              <TableHead className="font-semibold">Danh mục</TableHead>
              <TableHead className="font-semibold">Mùa vụ</TableHead>
              <TableHead className="font-semibold text-center">Giá</TableHead>
              <TableHead className="font-semibold text-center">Số lượng</TableHead>
              <TableHead className="font-semibold text-center">Trạng thái</TableHead>
              <TableHead className="font-semibold">Cập nhật</TableHead>
              {!isReadOnly && <TableHead className="w-16"></TableHead>}
              {isReadOnly && (
                <TableHead className="w-24 text-center font-semibold">Chi tiết</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => {
              const isSelected = !isReadOnly && selectedProductIds.includes(product.productId)
              const ordinalNumber = (currentPage - 1) * pageSize + index + 1

              return (
                <TableRow
                  key={product.productId}
                  className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <TableCell className="text-center">{ordinalNumber}</TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProductSelection(product.productId)}
                        className="rounded"
                      />
                    </TableCell>
                  )}

                  <TableCell>
                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{product.productName}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.productDescription}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm">{product.categoryName || 'Chưa phân loại'}</span>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm">{product.cropName || '-'}</span>
                  </TableCell>

                  <TableCell className="text-center font-medium">
                    {formatPrice(product.price)}
                  </TableCell>

                  <TableCell className="text-center">
                    {getQuantityBadge(product.quantity)}
                  </TableCell>

                  <TableCell className="text-center">
                    {isReadOnly ? (
                      <div className="flex flex-col items-center gap-1">
                        {product.status === 'Active' ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                        {getStatusBadge(product.status)}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStatusToggle(product)}
                          className="inline-flex items-center"
                        >
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

                  <TableCell className="text-sm text-gray-500">
                    {formatDate(product.updatedAt)}
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
                              handleView(product)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleEdit(product)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDelete(product)
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(product)}
                        className="text-blue-600"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
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

      { }
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
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPagination(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                )
              })}
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
