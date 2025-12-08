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
import { Textarea } from '@/shared/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useToast } from '@/shared/ui/use-toast'
import { Loader2, Upload, X } from 'lucide-react'
import { useProductStore } from '../store/productStore'
import type { Product } from '@/shared/api/productService'
import { uploadImageToCloudinary, CloudinaryUploadError } from '@/shared/lib/cloudinary'

const updateProductInfoSchema = z.object({
  productName: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  productDescription: z.string().min(1, 'Mô tả sản phẩm là bắt buộc'),
  price: z.number().min(10000, 'Giá sản phẩm phải lớn hơn 10,000 VND'),
  categoryId: z.number().min(1, 'Vui lòng chọn danh mục'),
  imageUrl: z.string().optional(),
})

type UpdateProductInfoFormData = z.infer<typeof updateProductInfoSchema>

interface UpdateProductInfoModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
}

export function UpdateProductInfoModal({ isOpen, onClose, product: initialProduct }: UpdateProductInfoModalProps) {
  const { categories, isUpdating, updateProduct, fetchCategories } = useProductStore()
  const { toast } = useToast()
  // Use state to track current product, so it can be updated after successful update
  const [currentProduct, setCurrentProduct] = React.useState<Product>(initialProduct)
  const [imagePreview, setImagePreview] = React.useState<string | null>(
    currentProduct?.imageUrl || null
  )
  const [imageExplicitlyRemoved, setImageExplicitlyRemoved] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const abortControllerRef = React.useRef<AbortController | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UpdateProductInfoFormData>({
    resolver: zodResolver(updateProductInfoSchema),
    defaultValues: {
      productName: currentProduct.productName,
      productDescription: currentProduct.productDescription,
      price: currentProduct.price,
      categoryId: currentProduct.categoryId,
      imageUrl: currentProduct.imageUrl || '',
    },
  })

  // Update currentProduct when initialProduct changes
  React.useEffect(() => {
    setCurrentProduct(initialProduct)
  }, [initialProduct])

  React.useEffect(() => {
    if (isOpen) {
      reset({
        productName: currentProduct.productName,
        productDescription: currentProduct.productDescription,
        price: currentProduct.price,
        categoryId: currentProduct.categoryId,
        imageUrl: currentProduct.imageUrl || '',
      })
      setImagePreview(currentProduct.imageUrl || null)
      setImageExplicitlyRemoved(false)
      setIsUploading(false)
      setUploadProgress(0)
      // Cancel any ongoing upload when modal opens
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      fetchCategories().catch(() => {
        toast({
          title: 'Lỗi tải danh mục',
          description: 'Không thể tải danh sách danh mục',
          variant: 'destructive',
        })
      })
    } else {
      // Clean up when modal closes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [isOpen, currentProduct, reset, fetchCategories, toast])

  const onSubmit = async (data: UpdateProductInfoFormData) => {
    try {
      // Validate productId
      if (!currentProduct.productId || currentProduct.productId === 0) {
        toast({
          title: 'Lỗi dữ liệu',
          description: 'Không tìm thấy ID sản phẩm. Vui lòng thử lại.',
          variant: 'destructive',
        })
        return
      }

      // Preserve original values for description and imageUrl if they're empty or unchanged
      // This prevents data loss when fields are not edited
      const productDescription = data.productDescription?.trim() || currentProduct.productDescription

      // For imageUrl: preserve original if empty and not explicitly removed, otherwise use form value
      let imageUrl: string | undefined
      if (data.imageUrl?.trim()) {
        // User uploaded a new image - use the Cloudinary URL
        imageUrl = data.imageUrl.trim()
      } else if (imageExplicitlyRemoved) {
        // User explicitly removed the image - send empty string to delete
        imageUrl = ''
      } else {
        // User didn't change the image - don't send imageUrl (undefined means no change)
        imageUrl = undefined
      }

      // Ensure all required fields are valid before sending
      if (!data.productName?.trim()) {
        toast({
          title: 'Lỗi validation',
          description: 'Tên sản phẩm không được để trống',
          variant: 'destructive',
        })
        return
      }

      if (!data.price || data.price < 10000) {
        toast({
          title: 'Lỗi validation',
          description: 'Giá sản phẩm phải lớn hơn hoặc bằng 10,000 VND',
          variant: 'destructive',
        })
        return
      }

      if (!data.categoryId || data.categoryId < 1) {
        toast({
          title: 'Lỗi validation',
          description: 'Vui lòng chọn danh mục hợp lệ',
          variant: 'destructive',
        })
        return
      }

      const updatedProduct = await updateProduct(currentProduct.productId, {
        productName: data.productName.trim(),
        productDescription: productDescription || undefined, // Send undefined if no description
        price: Number(data.price),
        categoryId: Number(data.categoryId),
        imageUrl: imageUrl, // Send imageUrl (can be string, empty string, or undefined)
      })

      // Update currentProduct with the updated product data
      setCurrentProduct(updatedProduct)

      toast({
        title: 'Cập nhật thành công',
        description: `Thông tin sản phẩm ${data.productName} đã được cập nhật`,
        variant: 'success',
      })

      // Close modal after successful update
      onClose()
    } catch (error) {
      toast({
        title: 'Cập nhật thất bại',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật sản phẩm',
        variant: 'destructive',
      })
    }
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'File không hợp lệ',
        description: 'Vui lòng chọn file hình ảnh',
        variant: 'destructive',
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File quá lớn',
        description: 'Kích thước file không được vượt quá 5MB',
        variant: 'destructive',
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Cancel any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadImageToCloudinary({
        file,
        folder: 'sep490/products',
        onProgress: setUploadProgress,
        signal: abortControllerRef.current.signal,
      })

      setImagePreview(cloudinaryUrl)
      setValue('imageUrl', cloudinaryUrl)
      setImageExplicitlyRemoved(false) // Reset flag when new image is uploaded
      toast({
        title: 'Thành công',
        description: 'Đã tải ảnh lên thành công',
        variant: 'success',
      })
    } catch (error) {
      if (error instanceof CloudinaryUploadError) {
        if (error.message.includes('aborted')) {
          // Upload was cancelled, don't show error
          return
        }
        toast({
          title: 'Tải ảnh lên thất bại',
          description: error.message || 'Có lỗi xảy ra khi tải ảnh lên',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Tải ảnh lên thất bại',
          description: 'Có lỗi xảy ra khi tải ảnh lên',
          variant: 'destructive',
        })
      }
      setImagePreview(null)
      setValue('imageUrl', '')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      abortControllerRef.current = null
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = () => {
    // Cancel any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setImagePreview(null)
    setValue('imageUrl', '')
    setImageExplicitlyRemoved(true)
    setUploadProgress(0)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật thông tin sản phẩm</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="productName">Tên sản phẩm *</Label>
            <Input
              id="productName"
              {...register('productName')}
              placeholder="Nhập tên sản phẩm"
              className={errors.productName ? 'border-red-500' : ''}
            />
            {errors.productName && <p className="text-sm text-red-600">{errors.productName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="productDescription">Mô tả sản phẩm *</Label>
            <Textarea
              id="productDescription"
              {...register('productDescription')}
              placeholder="Nhập mô tả chi tiết về sản phẩm"
              rows={4}
              className={errors.productDescription ? 'border-red-500' : ''}
            />
            {errors.productDescription && (
              <p className="text-sm text-red-600">{errors.productDescription.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Giá sản phẩm (VND) *</Label>
              <Input
                id="price"
                type="number"
                {...register('price', { valueAsNumber: true })}
                placeholder="0"
                min="10000"
                step="1000"
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Danh mục *</Label>
              <Select
                value={watch('categoryId')?.toString() || ''}
                onValueChange={value => setValue('categoryId', parseInt(value))}
              >
                <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                      {category.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-sm text-red-600">{errors.categoryId.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Hình ảnh sản phẩm</Label>

            {imagePreview ? (
              <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                {!isUploading && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <label
                htmlFor="image"
                className={`flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
                  }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-6 w-6 text-gray-400 mb-2 animate-spin" />
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Tải lên</span>
                  </>
                )}
              </label>
            )}

            <input
              id="image"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isUploading}
              className="hidden"
            />
            {isUploading && uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6">
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

