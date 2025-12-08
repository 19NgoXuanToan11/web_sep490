import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useToast } from '@/shared/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { useProductStore } from '../store/productStore'
import type { Product } from '@/shared/api/productService'

const updateQuantitySchema = z.object({
  quantity: z.number().min(0, 'Số lượng không được âm').int('Số lượng phải là số nguyên'),
})

type UpdateQuantityFormData = z.infer<typeof updateQuantitySchema>

interface UpdateProductQuantityModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
}

export function UpdateProductQuantityModal({ isOpen, onClose, product }: UpdateProductQuantityModalProps) {
  const { isUpdating, changeProductQuantity, fetchAllProducts } = useProductStore()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateQuantityFormData>({
    resolver: zodResolver(updateQuantitySchema),
    defaultValues: {
      quantity: product.quantity,
    },
  })

  React.useEffect(() => {
    if (isOpen) {
      reset({
        quantity: product.quantity,
      })
    }
  }, [isOpen, product, reset])

  const onSubmit = async (data: UpdateQuantityFormData) => {
    try {
      await changeProductQuantity(product.productId, data.quantity)
      await fetchAllProducts()

      toast({
        title: 'Cập nhật thành công',
        description: `Số lượng sản phẩm ${product.productName} đã được cập nhật thành ${data.quantity}`,
        variant: 'success',
      })

      onClose()
    } catch (error) {
      toast({
        title: 'Cập nhật thất bại',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật số lượng',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cập nhật số lượng sản phẩm</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="quantity">Số lượng tồn kho *</Label>
            <Input
              id="quantity"
              type="number"
              {...register('quantity', { valueAsNumber: true })}
              placeholder="0"
              min="0"
              step="1"
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && <p className="text-sm text-red-600">{errors.quantity.message}</p>}
            <p className="text-sm text-gray-500">
              Số lượng hiện tại: <span className="font-medium">{product.quantity}</span>
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Sản phẩm:</span> {product.productName}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isUpdating} className="flex-1">
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật'
              )}
            </Button>

            <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating}>
              Hủy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

