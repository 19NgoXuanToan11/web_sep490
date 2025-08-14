import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui/drawer'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useToast } from '@/shared/ui/use-toast'
import { Loader2, Package, Upload, X } from 'lucide-react'
import { useInventoryStore } from '../store/inventoryStore'
import type { Product } from '@/shared/lib/localData'
import { productFormSchema } from '../model/schemas'
import type { ProductFormData } from '../model/schemas'

interface ProductDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingProduct?: Product | null
  onClose: () => void
}

export function ProductDrawer({ open, onOpenChange, editingProduct, onClose }: ProductDrawerProps) {
  const { createProduct, updateProduct, getCategories, loadingStates } = useInventoryStore()
  const { toast } = useToast()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)

  const isEditing = !!editingProduct
  const categories = getCategories()

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema.omit({ imageFile: true })),
    defaultValues: {
      sku: editingProduct?.sku || '',
      name: editingProduct?.name || '',
      category: editingProduct?.category || '',
      price: editingProduct?.price || 0,
    },
  })

  React.useEffect(() => {
    if (editingProduct) {
      form.reset({
        sku: editingProduct.sku,
        name: editingProduct.name,
        category: editingProduct.category,
        price: editingProduct.price,
      })
      setPreviewImage(editingProduct.imageUrl || null)
    } else {
      form.reset({
        sku: '',
        name: '',
        category: '',
        price: 0,
      })
      setPreviewImage(null)
    }
  }, [editingProduct, form])

  const isLoading =
    loadingStates[isEditing ? `update-product-${editingProduct?.id}` : 'create-product']?.isLoading

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: 'File Too Large',
          description: 'Image must be smaller than 5MB',
          variant: 'destructive',
        })
        return
      }

      const reader = new FileReader()
      reader.onload = e => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: Omit<ProductFormData, 'imageFile'>) => {
    try {
      const imageFile = fileInputRef.current?.files?.[0]
      const formData = { ...data, imageFile }

      if (isEditing && editingProduct) {
        await updateProduct(editingProduct.id, {
          sku: data.sku,
          name: data.name,
          category: data.category,
          price: data.price,
          ...(imageFile && { imageUrl: URL.createObjectURL(imageFile) }),
        })
        toast({
          title: 'Product Updated',
          description: `${data.name} has been updated successfully.`,
          variant: 'success',
        })
      } else {
        await createProduct(formData as ProductFormData)
        toast({
          title: 'Product Created',
          description: `${data.name} has been created successfully.`,
          variant: 'success',
        })
      }
      handleClose()
    } catch (error) {
      toast({
        title: isEditing ? 'Update Failed' : 'Creation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    form.reset()
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-md mx-auto">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </DrawerTitle>
          <DrawerDescription>
            {isEditing
              ? 'Update product information and inventory details.'
              : 'Add a new product to your inventory catalog.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-2 space-y-6 max-h-96 overflow-y-auto">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    Choose Image
                  </Button>
                  {previewImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewImage(null)}
                      className="w-full mt-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" placeholder="e.g., Cherry Tomatoes" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" placeholder="e.g., TOM-CHE-001" {...form.register('sku')} />
              {form.formState.errors.sku && (
                <p className="text-sm text-destructive">{form.formState.errors.sku.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={form.watch('category')}
                onValueChange={value => form.setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Add New Category</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register('price', { valueAsNumber: true })}
              />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
              )}
            </div>
          </form>
        </div>

        <DrawerFooter className="flex-row gap-2">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
