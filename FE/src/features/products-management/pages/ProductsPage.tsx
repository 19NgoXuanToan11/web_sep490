import React from 'react'
import { Button } from '@/shared/ui/button'
import { useToast } from '@/shared/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Plus, Trash2, RefreshCw, Package, AlertTriangle, CheckCircle } from 'lucide-react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { ProductTable } from '../ui/ProductTable'
import { ProductFilters } from '../ui/ProductFilters'
import { ProductModal } from '../ui/ProductModal'
import { useProductStore } from '../store/productStore'
import type { Product } from '@/shared/api/productService'

export function ProductsPage() {
  const {
    products = [],
    filteredProducts = [],
    selectedProductIds,
    clearSelection,
    fetchAllProducts,
    deleteProduct,
    isLoading,
    filters,
  } = useProductStore()

  const { toast } = useToast()

  // Helper functions
  const hasActiveFilters = () => {
    return !!(
      filters.search ||
      filters.categoryId ||
      filters.status ||
      filters.minPrice ||
      filters.maxPrice
    )
  }

  const getFilteredStats = () => {
    const baseProducts = hasActiveFilters() ? filteredProducts : products
    return {
      total: hasActiveFilters() ? filteredProducts.length : products.length,
      active: baseProducts.filter(p => p.status === 'Active').length,
      outOfStock: baseProducts.filter(p => p.quantity === 0).length,
    }
  }

  const stats = getFilteredStats()

  const [modalState, setModalState] = React.useState<{
    isOpen: boolean
    mode: 'create' | 'edit' | 'view'
    product?: Product | null
  }>({
    isOpen: false,
    mode: 'create',
    product: null,
  })

  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    isOpen: boolean
    product?: Product | null
  }>({
    isOpen: false,
    product: null,
  })

  // Load products on mount
  React.useEffect(() => {
    fetchAllProducts().catch(error => {
      console.error('Error loading products:', error)
      toast({
        title: 'Lỗi tải dữ liệu',
        description: 'Không thể tải danh sách sản phẩm',
        variant: 'destructive',
      })
    })
  }, [fetchAllProducts, toast])

  const handleCreateProduct = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      product: null,
    })
  }

  const handleEditProduct = (product: Product) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      product,
    })
  }

  const handleViewProduct = (product: Product) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      product,
    })
  }

  const handleDeleteProduct = (product: Product) => {
    setDeleteConfirm({
      isOpen: true,
      product,
    })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.product) return

    try {
      await deleteProduct(deleteConfirm.product.productId)

      toast({
        title: 'Xóa thành công',
        description: `Đã xóa sản phẩm ${deleteConfirm.product.productName}`,
        variant: 'success',
      })

      setDeleteConfirm({ isOpen: false, product: null })
    } catch (error) {
      toast({
        title: 'Xóa thất bại',
        description: error instanceof Error ? error.message : 'Không thể xóa sản phẩm',
        variant: 'destructive',
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return

    try {
      // Delete selected products
      await Promise.all(selectedProductIds.map(id => deleteProduct(id)))

      toast({
        title: 'Xóa thành công',
        description: `Đã xóa ${selectedProductIds.length} sản phẩm`,
        variant: 'success',
      })

      clearSelection()
    } catch (error) {
      toast({
        title: 'Xóa thất bại',
        description: error instanceof Error ? error.message : 'Không thể xóa sản phẩm',
        variant: 'destructive',
      })
    }
  }

  const handleRefresh = async () => {
    try {
      await fetchAllProducts()
      toast({
        title: 'Tải lại thành công',
        description: 'Đã cập nhật danh sách sản phẩm',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Lỗi tải dữ liệu',
        description: 'Không thể tải lại danh sách sản phẩm',
        variant: 'destructive',
      })
    }
  }

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      product: null,
    })
  }

  return (
    <ManagerLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
              <p className="text-gray-600">Quản lý thông tin sản phẩm, giá cả và tồn kho</p>
            </div>
            <div className="flex gap-2">
              {/* Bulk actions */}
              {selectedProductIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa ({selectedProductIds.length})
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Tải lại
              </Button>

              <Button
                onClick={handleCreateProduct}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                Thêm sản phẩm
              </Button>
            </div>
          </div>

          {/* Filters */}
          <ProductFilters />

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hết hàng</p>
                    <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm</CardTitle>
              <CardDescription>Danh sách tất cả sản phẩm trong kho</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Đang tải sản phẩm...</span>
                </div>
              ) : products?.length === 0 ? (
                hasActiveFilters() ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Không tìm thấy sản phẩm
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Không có sản phẩm nào phù hợp với bộ lọc hiện tại. Thử thay đổi điều kiện lọc.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có sản phẩm</h3>
                    <p className="text-gray-500 mb-4">Hãy thêm sản phẩm đầu tiên vào kho.</p>
                    <Button onClick={handleCreateProduct}>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm sản phẩm
                    </Button>
                  </div>
                )
              ) : (
                <ProductTable
                  onEditProduct={handleEditProduct}
                  onViewProduct={handleViewProduct}
                  onDeleteProduct={handleDeleteProduct}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        editingProduct={modalState.product}
        mode={modalState.mode}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.isOpen && deleteConfirm.product && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa sản phẩm</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa sản phẩm "{deleteConfirm.product.productName}"? Hành động
              này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm({ isOpen: false, product: null })}
              >
                Hủy
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  )
}
