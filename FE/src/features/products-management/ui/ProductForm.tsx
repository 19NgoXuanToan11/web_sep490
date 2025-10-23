import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useToast } from '@/shared/ui/use-toast'
import { Loader2, Upload, X } from 'lucide-react'
import { productSchema, type ProductFormData } from '../model/schemas'
import { useProductStore } from '../store/productStore'
import type { Product } from '@/shared/api/productService'

interface ProductFormProps {
  editingProduct?: Product | null
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

export function ProductForm({ editingProduct, onSuccess, onCancel, className }: ProductFormProps) {
  const { categories, isCreating, isUpdating, createProduct, updateProduct, fetchCategories } =
    useProductStore()
  const { toast } = useToast()
  const [imagePreview, setImagePreview] = React.useState<string | null>(
    editingProduct?.imageUrl || null
  )

  const isEditMode = !!editingProduct
  const isSubmitting = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: isEditMode
      ? {
          productName: editingProduct.productName,
          productDescription: editingProduct.productDescription,
          sku: editingProduct.sku,
          price: editingProduct.price,
          categoryId: editingProduct.categoryId,
          imageUrl: editingProduct.imageUrl || '',
          quantity: editingProduct.quantity,
        }
      : {
          productName: '',
          productDescription: '',
          sku: '',
          price: 0,
          categoryId: 0,
          imageUrl: '',
          quantity: 0,
        },
  })

  // Load categories on mount
  React.useEffect(() => {
    fetchCategories().catch(error => {
      console.error('Error loading categories:', error)
      toast({
        title: 'Lỗi tải danh mục',
        description: 'Không thể tải danh sách danh mục',
        variant: 'destructive',
      })
    })
  }, [fetchCategories, toast])

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditMode && editingProduct) {
        await updateProduct(editingProduct.productId, {
          productName: data.productName,
          productDescription: data.productDescription,
          sku: data.sku,
          price: data.price,
          categoryId: data.categoryId,
          imageUrl: data.imageUrl,
        })

        toast({
          title: 'Cập nhật thành công',
          description: `Sản phẩm ${data.productName} đã được cập nhật`,
          variant: 'success',
        })
      } else {
        await createProduct(data)

        toast({
          title: 'Tạo thành công',
          description: `Sản phẩm ${data.productName} đã được tạo`,
          variant: 'success',
        })

        reset() // Reset form after successful creation
        setImagePreview(null)
      }

      onSuccess?.()
    } catch (error) {
      toast({
        title: isEditMode ? 'Cập nhật thất bại' : 'Tạo thất bại',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      })
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'File không hợp lệ',
          description: 'Vui lòng chọn file hình ảnh',
          variant: 'destructive',
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File quá lớn',
          description: 'Kích thước file không được vượt quá 5MB',
          variant: 'destructive',
        })
        return
      }

      const reader = new FileReader()
      reader.onload = e => {
        const result = e.target?.result as string
        setImagePreview(result)
        setValue('imageUrl', result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setValue('imageUrl', '')
  }

  const generateSKU = () => {
    const productName = watch('productName')
    if (productName) {
      const sku =
        productName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 10) +
        '-' +
        Date.now().toString().slice(-4)
      setValue('sku', sku)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
      {/* Product Name */}
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

      {/* Product Description */}
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

      {/* SKU */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="sku">SKU *</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateSKU}
            className="text-blue-600 hover:text-blue-700"
          >
            Tự động tạo
          </Button>
        </div>
        <Input
          id="sku"
          {...register('sku')}
          placeholder="VD: PRODUCT-1234"
          className={`font-mono ${errors.sku ? 'border-red-500' : ''}`}
        />
        {errors.sku && <p className="text-sm text-red-600">{errors.sku.message}</p>}
        <p className="text-xs text-gray-500">
          SKU chỉ được chứa chữ in hoa, số, dấu gạch ngang và gạch dưới
        </p>
      </div>

      {/* Price and Category Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Giá sản phẩm (VND) *</Label>
          <Input
            id="price"
            type="number"
            {...register('price', { valueAsNumber: true })}
            placeholder="0"
            min="0"
            step="1000"
            className={errors.price ? 'border-red-500' : ''}
          />
          {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
        </div>

        {/* Category */}
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

      {/* Quantity */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Số lượng ban đầu</Label>
        <Input
          id="quantity"
          type="number"
          {...register('quantity', { valueAsNumber: true })}
          placeholder="0"
          min="0"
          className={errors.quantity ? 'border-red-500' : ''}
        />
        {errors.quantity && <p className="text-sm text-red-600">{errors.quantity.message}</p>}
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label htmlFor="image">Hình ảnh sản phẩm</Label>

        {imagePreview ? (
          <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="image"
            className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
          >
            <Upload className="h-6 w-6 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Tải lên</span>
          </label>
        )}

        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        <p className="text-xs text-gray-500">Hỗ trợ: JPG, PNG, GIF. Tối đa 5MB.</p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-6">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditMode ? 'Đang cập nhật...' : 'Đang tạo...'}
            </>
          ) : isEditMode ? (
            'Cập nhật sản phẩm'
          ) : (
            'Tạo sản phẩm'
          )}
        </Button>

        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Hủy
          </Button>
        )}
      </div>
    </form>
  )
}
