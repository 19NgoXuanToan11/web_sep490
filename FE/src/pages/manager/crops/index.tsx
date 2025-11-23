import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Textarea } from '@/shared/ui/textarea'
import { Plus, Edit, Trash2, Search, RefreshCw } from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import {
  cropService,
  type Crop,
  type CropRequest,
  type CropProductRequest,
  type CreateCropWithProductRequest,
} from '@/shared/api/cropService'
import { categoryService, type Category } from '@/shared/api/categoryService'
import {
  uploadImageToCloudinary,
  CloudinaryUploadError,
} from '@/shared/lib/cloudinary'

type CreateCropFormState = {
  cropName: string
  description: string
  origin: string
  categoryId: number | ''
  productName: string
  productPrice: number
  productDescription: string
  productImageFile: File | null
  productImagePreview: string | null
}

const createInitialFormState = (): CreateCropFormState => ({
  cropName: '',
  description: '',
  origin: '',
  categoryId: '',
  productName: '',
  productPrice: 0,
  productDescription: '',
  productImageFile: null,
  productImagePreview: null,
})

export default function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [, setTotalCrops] = useState(0)
  const pageSize = 10

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null)

  const [categories, setCategories] = useState<Category[]>([])

  // Unified form state for both crop (request1) and product (request2)
  const [formData, setFormData] = useState<CreateCropFormState>(() => createInitialFormState())

  const { toast } = useToast()

  const loadCrops = async () => {
    try {
      setLoading(true)
      const response = await cropService.getAllCrops(currentPage, pageSize)
      setCrops(response.items)
      setTotalCrops(response.totalItemCount)
      setTotalPages(Math.ceil(response.totalItemCount / pageSize))
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách cây trồng',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const searchCrops = async () => {
    try {
      setLoading(true)
      const response = await cropService.searchCrop(
        searchTerm || undefined,
        statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
        currentPage,
        pageSize
      )

      if (response.data && response.data.items) {
        setCrops(response.data.items)
        setTotalCrops(response.data.totalItemCount)
        setTotalPages(Math.ceil(response.data.totalItemCount / pageSize))
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tìm kiếm cây trồng',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAllCategories()
      setCategories(data)
    } catch {
      // ignore for now, crop creation will validate category selection
    }
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setFormData(prev => {
      if (prev.productImagePreview) {
        URL.revokeObjectURL(prev.productImagePreview)
      }
      return {
        ...prev,
        productImageFile: file,
        productImagePreview: file ? URL.createObjectURL(file) : null,
      }
    })
    event.target.value = ''
  }

  const handleRemoveImage = () => {
    setFormData(prev => {
      if (prev.productImagePreview) {
        URL.revokeObjectURL(prev.productImagePreview)
      }
      return {
        ...prev,
        productImageFile: null,
        productImagePreview: null,
      }
    })
  }

  const handleCreateCrop = async () => {
    try {
      if (
        !formData.cropName ||
        !formData.description ||
        !formData.origin ||
        !formData.productName ||
        !formData.productPrice ||
        !formData.categoryId
      ) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng điền đầy đủ thông tin bắt buộc cho cây trồng và sản phẩm',
          variant: 'destructive',
        })
        return
      }

      // Step 1: Upload image to Cloudinary if image exists
      let imageUrl: string | undefined
      if (formData.productImageFile) {
        try {
          toast({
            title: 'Đang tải lên hình ảnh...',
            description: 'Vui lòng đợi trong giây lát',
          })
          imageUrl = await uploadImageToCloudinary({
            file: formData.productImageFile,
            onProgress: _percent => {
            },
          })
        } catch (error) {
          if (error instanceof CloudinaryUploadError) {
            toast({
              title: 'Lỗi tải lên hình ảnh',
              description: error.message || 'Không thể tải lên hình ảnh lên Cloudinary',
              variant: 'destructive',
            })
            return
          }
          throw error
        }
      }

      // Step 2: Prepare JSON payload with Cloudinary URL
      const request1: CropRequest = {
        cropName: formData.cropName,
        description: formData.description,
        origin: formData.origin,
        categoryId: Number(formData.categoryId),
      }

      const request2: CropProductRequest = {
        productName: formData.productName,
        price: Number(formData.productPrice),
        description: formData.productDescription || undefined,
        images: imageUrl, // Add Cloudinary URL to request2.images
      }

      const payload: CreateCropWithProductRequest = {
        request1,
        request2,
      }

      // Step 3: Send JSON payload to backend
      await cropService.createCrop(payload)
      toast({
        title: 'Thành công',
        description: 'Đã tạo cây trồng và sản phẩm mới',
      })

      setCreateDialogOpen(false)
      resetForm()
      loadCrops()
    } catch (error) {
      console.error('Error creating crop:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Không thể tạo cây trồng mới'
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handleUpdateCrop = async () => {
    if (!editingCrop) return

    try {
      const updateData: CropRequest = {
        cropName: formData.cropName,
        description: formData.description,
        origin: formData.origin,
        categoryId: formData.categoryId as number,
      }

      await cropService.updateCrop(editingCrop.cropId, updateData)
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin cây trồng',
      })

      setEditDialogOpen(false)
      setEditingCrop(null)
      resetForm()
      loadCrops()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật cây trồng',
        variant: 'destructive',
      })
    }
  }

  const handleChangeStatus = async (cropId: number) => {
    try {
      await cropService.changeStatus(cropId)
      toast({
        title: 'Thành công',
        description: 'Đã thay đổi trạng thái cây trồng',
      })
      loadCrops()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể thay đổi trạng thái cây trồng',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData(prev => {
      if (prev.productImagePreview) {
        URL.revokeObjectURL(prev.productImagePreview)
      }
      return createInitialFormState()
    })
  }

  const handleEditClick = (crop: Crop) => {
    setEditingCrop(crop)
    setFormData(prev => ({
      ...prev,
      cropName: crop.cropName,
      description: crop.description,
      origin: crop.origin || '',
    }))
    setEditDialogOpen(true)
  }

  const getStatusVariant = (status: string | undefined) => {
    if (!status) return 'outline'
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  useEffect(() => {
    loadCrops()
  }, [currentPage])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    const previewUrl = formData.productImagePreview
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [formData.productImagePreview])

  return (
    <ManagerLayout>
      <div className="p-6">
        <div className="space-y-8">
          { }
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Cây Trồng</h1>
            <p className="text-gray-600 mt-2">
              Quản lý thông tin cây trồng, lên kế hoạch gieo trồng và theo dõi chu kỳ phát triển.
            </p>
          </div>

          { }
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nhập tên cây trồng..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select
                    value={statusFilter || undefined}
                    onValueChange={value => setStatusFilter(value || '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                      <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button onClick={searchCrops} variant="outline" className="flex-1 md:flex-none">
                    <Search className="h-4 w-4 mr-2" />
                    Tìm kiếm
                  </Button>
                  <Button onClick={loadCrops} variant="outline" className="flex-1 md:flex-none">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm mới
                  </Button>
                  <Button onClick={() => setCreateDialogOpen(true)} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm cây trồng
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          { }
          <div className="border rounded-lg bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên cây trồng</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : crops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Không có cây trồng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  crops.map(crop => (
                    <TableRow key={crop.cropId}>
                      <TableCell className="font-medium">{crop.cropName}</TableCell>
                      <TableCell className="max-w-xs truncate">{crop.description}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(crop.status)}>
                          {crop.status === 'ACTIVE' ? 'Hoạt động' : crop.status === 'INACTIVE' ? 'Tạm dừng' : 'Không xác định'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(crop)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangeStatus(crop.cropId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          { }
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-600">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      </div>

      { }
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl overflow-hidden p-0 flex flex-col max-h-[90vh]">
          <div className="flex flex-col flex-1 min-h-0">
            <DialogHeader className="px-6 pt-6 flex-shrink-0">
              <DialogTitle>Thêm Cây Trồng & Sản Phẩm Mới</DialogTitle>
              <DialogDescription>
                Điền thông tin cây trồng và sản phẩm.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="crop" className="flex flex-1 flex-col min-h-0">
              <div className="px-6 pt-4 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="crop">Thông tin cây trồng</TabsTrigger>
                  <TabsTrigger value="product">Thông tin sản phẩm</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
                <TabsContent value="crop" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cropName">Tên cây trồng *</Label>
                      <Input
                        id="cropName"
                        value={formData.cropName}
                        onChange={e => setFormData({ ...formData, cropName: e.target.value })}
                        placeholder="Nhập tên cây trồng"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Mô tả *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Nhập mô tả cây trồng"
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="origin">Nguồn gốc *</Label>
                        <Input
                          id="origin"
                          value={formData.origin}
                          onChange={e => setFormData({ ...formData, origin: e.target.value })}
                          placeholder="Ví dụ: Đà Lạt, Việt Nam"
                        />
                      </div>
                      <div>
                        <Label>Danh mục *</Label>
                        <Select
                          value={formData.categoryId ? String(formData.categoryId) : ''}
                          onValueChange={value =>
                            setFormData({
                              ...formData,
                              categoryId: value ? Number(value) : '',
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn danh mục" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>
                                {cat.categoryName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="product" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="productName">Tên sản phẩm *</Label>
                      <Input
                        id="productName"
                        value={formData.productName}
                        onChange={e => setFormData({ ...formData, productName: e.target.value })}
                        placeholder="Nhập tên sản phẩm"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="productPrice">Giá bán *</Label>
                        <Input
                          id="productPrice"
                          type="number"
                          min={0}
                          value={formData.productPrice}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              productPrice: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="Nhập giá bán (VNĐ)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="productImages">Hình ảnh</Label>
                        <Input
                          id="productImages"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                        {formData.productImagePreview && (
                          <div className="mt-2 space-y-1.5 rounded-md border border-dashed p-2">
                            <div className="relative w-full aspect-video max-h-32 overflow-hidden rounded-md bg-gray-50">
                              <img
                                src={formData.productImagePreview}
                                alt="Xem trước hình ảnh sản phẩm"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600 px-0.5">
                              <span className="truncate flex-1 mr-2">
                                {formData.productImageFile?.name}
                                {formData.productImageFile
                                  ? ` • ${Math.round(formData.productImageFile.size / 1024)}KB`
                                  : ''}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs flex-shrink-0"
                                onClick={handleRemoveImage}
                              >
                                Xoá ảnh
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="productDescription">Mô tả sản phẩm</Label>
                      <Textarea
                        id="productDescription"
                        value={formData.productDescription}
                        onChange={e =>
                          setFormData({ ...formData, productDescription: e.target.value })
                        }
                        placeholder="Nhập mô tả sản phẩm"
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <DialogFooter className="border-t px-6 py-3 flex-shrink-0 bg-background">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateCrop}>Tạo cây trồng & sản phẩm</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      { }
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Cây Trồng</DialogTitle>
            <DialogDescription>Cập nhật thông tin cây trồng</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCropName">Tên cây trồng *</Label>
              <Input
                id="editCropName"
                value={formData.cropName}
                onChange={e => setFormData({ ...formData, cropName: e.target.value })}
                placeholder="Nhập tên cây trồng"
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Mô tả *</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập mô tả cây trồng"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="editOrigin">Nguồn gốc *</Label>
              <Input
                id="editOrigin"
                value={formData.origin}
                onChange={e => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Ví dụ: Đà Lạt, Việt Nam"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateCrop}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  )
}
