import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Badge } from '@/shared/ui/badge'
import { ProductForm } from './ProductForm'
import type { Product } from '@/shared/api/productService'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  editingProduct?: Product | null
  mode: 'create' | 'edit' | 'view'
}

export function ProductModal({ isOpen, onClose, editingProduct, mode }: ProductModalProps) {
  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Tạo sản phẩm mới'
      case 'edit':
        return 'Chỉnh sửa sản phẩm'
      case 'view':
        return 'Chi tiết sản phẩm'
      default:
        return 'Sản phẩm'
    }
  }

  const getDescription = () => {
    switch (mode) {
      case 'create':
        return 'Điền thông tin để tạo sản phẩm mới'
      case 'edit':
        return 'Cập nhật thông tin sản phẩm'
      case 'view':
        return 'Xem thông tin chi tiết sản phẩm'
      default:
        return ''
    }
  }

  const handleSuccess = () => {
    onClose()
  }

  if (mode === 'view' && editingProduct) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogDescription>{getDescription()}</DialogDescription>
          </DialogHeader>

          <ProductViewContent product={editingProduct} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <ProductForm editingProduct={editingProduct} onSuccess={handleSuccess} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

interface ProductViewContentProps {
  product: Product
}

function ProductViewContent({ product }: ProductViewContentProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    return status === 'Active' ? (
      <Badge variant="default">Hoạt động</Badge>
    ) : (
      <Badge variant="secondary">Vô hiệu</Badge>
    )
  }

  const getQuantityStatus = (quantity: number) => {
    if (quantity === 0) {
      return { text: 'Hết hàng', variant: 'destructive' as const }
    } else if (quantity < 10) {
      return { text: 'Sắp hết', variant: 'warning' as const }
    }
    return { text: 'Còn hàng', variant: 'default' as const }
  }

  const quantityStatus = getQuantityStatus(product.quantity)

  return (
    <div className="space-y-6">
      { }
      <div className="flex flex-col sm:flex-row gap-6">
        { }
        <div className="flex-shrink-0">
          <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        { }
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{product.productName}</h3>
            <p className="text-gray-600 mt-1">{product.productDescription}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">Trạng thái</span>
            <div className="mt-1">{getStatusBadge(product.status)}</div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">Giá bán</span>
            <p className="text-3xl font-bold text-blue-600">{formatPrice(product.price)}</p>
          </div>
        </div>
      </div>

      { }
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        { }
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Thông tin kho</h4>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center gap-6">
              <span className="text-sm font-medium text-gray-500">Số lượng tồn kho</span>
              <div className="flex flex-col items-center gap-3 min-w-[120px]">
                <span className="text-4xl font-extrabold leading-none text-gray-900">
                  {product.quantity}
                </span>
                <Badge
                  className="w-full justify-center py-2 text-sm font-semibold rounded-full"
                  variant={quantityStatus.variant}
                >
                  {quantityStatus.text}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        { }
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Thông tin khác</h4>

          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Danh mục</span>
              <p className="text-gray-900">{product.categoryName || 'Chưa phân loại'}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Ngày tạo</span>
              <p className="text-gray-900">{formatDate(product.createdAt)}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Cập nhật lần cuối</span>
              <p className="text-gray-900">{formatDate(product.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      { }
      {product.productDescription && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Mô tả chi tiết</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{product.productDescription}</p>
          </div>
        </div>
      )}
    </div>
  )
}
