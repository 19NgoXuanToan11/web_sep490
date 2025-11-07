import React from 'react'
import { Button } from '@/shared/ui/button'
import { useToast } from '@/shared/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Plus, Trash2, RefreshCw, Package, AlertTriangle, CheckCircle } from 'lucide-react'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { ProductTable } from '@/features/products-management/ui/ProductTable'
import { ProductFilters } from '@/features/products-management/ui/ProductFilters'
import { ProductModal } from '@/features/products-management/ui/ProductModal'
import { useProductStore } from '@/features/products-management/store/productStore'
import type { Product } from '@/shared/api/productService'

export function StaffProductsPage() {
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

    React.useEffect(() => {
        fetchAllProducts().catch(error => {
            console.error('Failed to fetch products:', error)
            toast({
                title: 'Lỗi tải dữ liệu',
                description: 'Không thể tải danh sách sản phẩm. Vui lòng thử lại.',
                variant: 'destructive',
            })
        })
    }, [])

    const handleRefreshProducts = async () => {
        try {
            await fetchAllProducts()
            toast({
                title: 'Làm mới thành công',
                description: 'Danh sách sản phẩm đã được cập nhật.',
            })
        } catch (error) {
            toast({
                title: 'Lỗi làm mới',
                description: 'Không thể làm mới danh sách sản phẩm.',
                variant: 'destructive',
            })
        }
    }

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

    const confirmDeleteProduct = async () => {
        if (!deleteConfirm.product) return

        try {
            await deleteProduct(deleteConfirm.product.productId)
            toast({
                title: 'Xóa thành công',
                description: `Đã xóa sản phẩm "${deleteConfirm.product.productName}"`,
            })
            setDeleteConfirm({ isOpen: false, product: null })
            await fetchAllProducts()
        } catch (error) {
            toast({
                title: 'Lỗi xóa sản phẩm',
                description: 'Không thể xóa sản phẩm. Vui lòng thử lại.',
                variant: 'destructive',
            })
        }
    }

    const handleModalClose = () => {
        setModalState({
            isOpen: false,
            mode: 'create',
            product: null,
        })
    }

    const handleModalSuccess = async () => {
        handleModalClose()
        await fetchAllProducts()
        toast({
            title: modalState.mode === 'create' ? 'Tạo mới thành công' : 'Cập nhật thành công',
            description:
                modalState.mode === 'create'
                    ? 'Sản phẩm mới đã được thêm vào kho'
                    : 'Thông tin sản phẩm đã được cập nhật',
        })
    }

    const handleBulkDelete = async () => {
        if (selectedProductIds.length === 0) {
            toast({
                title: 'Chưa chọn sản phẩm',
                description: 'Vui lòng chọn ít nhất một sản phẩm để xóa.',
                variant: 'destructive',
            })
            return
        }

        try {
            await Promise.all(selectedProductIds.map(id => deleteProduct(id)))
            toast({
                title: 'Xóa thành công',
                description: `Đã xóa ${selectedProductIds.length} sản phẩm`,
            })
            clearSelection()
            await fetchAllProducts()
        } catch (error) {
            toast({
                title: 'Lỗi xóa sản phẩm',
                description: 'Không thể xóa một số sản phẩm. Vui lòng thử lại.',
                variant: 'destructive',
            })
        }
    }

    return (
        <StaffLayout>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý sản phẩm</h1>
                        <p className="text-gray-600">Quản lý kho sản phẩm nông nghiệp</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleRefreshProducts} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                        <Button onClick={handleCreateProduct}>
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm sản phẩm
                        </Button>
                        {selectedProductIds.length > 0 && (
                            <Button variant="destructive" onClick={handleBulkDelete}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa ({selectedProductIds.length})
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Tổng sản phẩm</CardTitle>
                            <Package className="h-5 w-5 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                {hasActiveFilters() ? 'Kết quả lọc' : 'Tổng số trong kho'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Đang hoạt động</CardTitle>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                            <p className="text-xs text-gray-500 mt-1">Sản phẩm đang bán</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Hết hàng</CardTitle>
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
                            <p className="text-xs text-gray-500 mt-1">Cần nhập thêm</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <ProductFilters />
                </div>

                {/* Product Table */}
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

                {/* Modals */}
                <ProductModal
                    isOpen={modalState.isOpen}
                    onClose={handleModalClose}
                    editingProduct={modalState.product}
                    mode={modalState.mode}
                />

                {/* Delete Confirmation Dialog */}
                {deleteConfirm.isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <Card className="max-w-md w-full mx-4">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    Xác nhận xóa
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4">
                                    Bạn có chắc chắn muốn xóa sản phẩm "{deleteConfirm.product?.productName}"?
                                </p>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteConfirm({ isOpen: false, product: null })}
                                    >
                                        Hủy
                                    </Button>
                                    <Button variant="destructive" onClick={confirmDeleteProduct}>
                                        Xóa
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </StaffLayout>
    )
}

export default StaffProductsPage

