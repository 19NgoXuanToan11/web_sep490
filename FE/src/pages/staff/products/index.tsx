import React from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { RefreshCw, Package } from 'lucide-react'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { ProductTable } from '@/features/products-management/ui/ProductTable'
import { ProductFilters } from '@/features/products-management/ui/ProductFilters'
import { ProductModal } from '@/features/products-management/ui/ProductModal'
import { UpdateProductInfoModal } from '@/features/products-management/ui/UpdateProductInfoModal'
import { ChangeProductStatusModal } from '@/features/products-management/ui/ChangeProductStatusModal'
import { useProductStore } from '@/features/products-management/store/productStore'
import type { Product } from '@/shared/api/productService'
import { ManagementPageHeader } from '@/shared/ui/management-page-header'
import { showErrorToast } from '@/shared/lib/toast-manager'

export function StaffProductsPage() {
    const { products = [], filteredProducts = [], allProducts = [], totalCount = 0, fetchAllProducts, isLoading, filters } =
        useProductStore()

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
        const baseProductsForStats = hasActiveFilters() ? filteredProducts : allProducts
        return {
            total: hasActiveFilters() ? filteredProducts.length : (totalCount || allProducts.length),
            active: baseProductsForStats.filter(p => p.status === 'Active').length,
            outOfStock: baseProductsForStats.filter(p => p.quantity === 0).length,
            deactivated: baseProductsForStats.filter(p => p.status !== 'Active').length,
        }
    }

    const stats = getFilteredStats()

    const [modalState, setModalState] = React.useState<{
        isOpen: boolean
        product?: Product | null
    }>({
        isOpen: false,
        product: null,
    })

    const [updateInfoModal, setUpdateInfoModal] = React.useState<{
        isOpen: boolean
        product?: Product | null
    }>({
        isOpen: false,
        product: null,
    })

    const [changeStatusModal, setChangeStatusModal] = React.useState<{
        isOpen: boolean
        product?: Product | null
    }>({
        isOpen: false,
        product: null,
    })


    React.useEffect(() => {
        fetchAllProducts().catch((err) => {
            showErrorToast(err)
        })
    }, [fetchAllProducts])

    const handleRefreshProducts = async () => {
        try {
            await fetchAllProducts()
        } catch (error) {
            showErrorToast(error)
        }
    }

    const handleViewProduct = (product: Product) => {
        setModalState({
            isOpen: true,
            product,
        })
    }

    const handleModalClose = () => {
        setModalState({
            isOpen: false,
            product: null,
        })
    }

    const handleUpdateProductInfo = (product: Product) => {
        setUpdateInfoModal({
            isOpen: true,
            product,
        })
    }

    const handleUpdateInfoModalClose = () => {
        setUpdateInfoModal({
            isOpen: false,
            product: null,
        })
    }

    const handleChangeProductStatus = (product: Product) => {
        setChangeStatusModal({
            isOpen: true,
            product,
        })
    }

    const handleChangeStatusModalClose = () => {
        setChangeStatusModal({
            isOpen: false,
            product: null,
        })
    }

    return (
        <StaffLayout>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ManagementPageHeader
                    className="mb-8"
                    title="Quản lý sản phẩm"
                    description="Nhân viên có thể tra cứu thông tin sản phẩm để phục vụ vận hành và dịch vụ khách hàng"
                    actions={
                        <Button variant="outline" onClick={handleRefreshProducts} disabled={isLoading}>
                            Làm mới
                        </Button>
                    }
                />

                { }
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Tổng sản phẩm</CardTitle>
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
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                            <p className="text-xs text-gray-500 mt-1">Sản phẩm đang bán</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Hết hàng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
                            <p className="text-xs text-gray-500 mt-1">Cần nhập thêm</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Vô hiệu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.deactivated}</div>
                            <p className="text-xs text-gray-500 mt-1">Sản phẩm bị vô hiệu</p>
                        </CardContent>
                    </Card>
                </div>

                { }
                <div className="mb-6">
                    <ProductFilters />
                </div>

                { }
                <Card>
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
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                                    <p className="text-gray-500 mb-4">
                                        Không có sản phẩm nào phù hợp với bộ lọc hiện tại. Thử thay đổi điều kiện lọc.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8 space-y-4">
                                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">Không có sản phẩm</h3>
                                    <p className="text-gray-500">
                                        Danh mục sản phẩm được tạo và cập nhật bởi Quản lý. Liên hệ Manager nếu cần bổ sung
                                        dữ liệu.
                                    </p>
                                </div>
                            )
                        ) : (
                            <ProductTable
                                onViewProduct={handleViewProduct}
                                onUpdateProductInfo={handleUpdateProductInfo}
                                onChangeProductStatus={handleChangeProductStatus}
                                mode="staff"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            <ProductModal
                isOpen={modalState.isOpen}
                onClose={handleModalClose}
                editingProduct={modalState.product}
                mode="view"
            />

            {updateInfoModal.product && (
                <UpdateProductInfoModal
                    isOpen={updateInfoModal.isOpen}
                    onClose={handleUpdateInfoModalClose}
                    product={updateInfoModal.product}
                />
            )}

            {changeStatusModal.product && (
                <ChangeProductStatusModal
                    isOpen={changeStatusModal.isOpen}
                    onClose={handleChangeStatusModalClose}
                    product={changeStatusModal.product}
                />
            )}

        </StaffLayout>
    )
}

export default StaffProductsPage

