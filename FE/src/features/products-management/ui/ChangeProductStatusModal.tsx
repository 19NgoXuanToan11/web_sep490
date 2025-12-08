import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { useToast } from '@/shared/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { useProductStore } from '../store/productStore'
import type { Product } from '@/shared/api/productService'

interface ChangeProductStatusModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
}

export function ChangeProductStatusModal({ isOpen, onClose, product }: ChangeProductStatusModalProps) {
  const { isUpdating, changeProductStatus, fetchAllProducts } = useProductStore()
  const { toast } = useToast()

  const currentStatus = product.status
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
  const statusText = newStatus === 'Active' ? 'kích hoạt' : 'vô hiệu hóa'

  const handleConfirm = async () => {
    try {
      await changeProductStatus(product.productId)
      await fetchAllProducts()

      toast({
        title: 'Cập nhật thành công',
        description: `Đã ${statusText} sản phẩm ${product.productName}`,
        variant: 'success',
      })

      onClose()
    } catch (error) {
      toast({
        title: 'Cập nhật thất bại',
        description: error instanceof Error ? error.message : 'Không thể thay đổi trạng thái sản phẩm',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thay đổi trạng thái sản phẩm</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{product.productName}</p>
              <p className="text-sm text-gray-500">
                Trạng thái hiện tại: <span className="font-medium">{currentStatus === 'Active' ? 'Hoạt động' : 'Vô hiệu'}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Trạng thái mới: <span className="font-medium">{newStatus === 'Active' ? 'Hoạt động' : 'Vô hiệu'}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isUpdating}
            className="flex-1"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Cập nhật'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

