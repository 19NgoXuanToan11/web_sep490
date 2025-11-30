import { useState, useEffect, useMemo, useRef } from 'react'
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
import {
  Plus,
  Edit,
  Search,
  RefreshCw,
  BarChart2,
  Package,
  Filter,
  Eye,
  ToggleLeft,
  ToggleRight,
  Upload,
  Loader2,
  X,
} from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import {
  cropService,
  type Crop,
  type CropRequest,
  type CreateCropWithProductRequest,
  type PaginatedCrops,
  type CropResponse,
} from '@/shared/api/cropService'
import { categoryService, type Category } from '@/shared/api/categoryService'
import { uploadImageToCloudinary, CloudinaryUploadError } from '@/shared/lib/cloudinary'

interface CropFormData {
  cropName: string
  description: string
  origin: string
  categoryId: number | ''
  productName: string
  price: number | ''
  productDescription: string
  images: string
}

const INITIAL_FORM_STATE: CropFormData = {
  cropName: '',
  description: '',
  origin: '',
  categoryId: '',
  productName: '',
  price: '',
  productDescription: '',
  images: '',
}

// Helper function to check if crop is active (handles all case variations)
const isActiveStatus = (status: string | undefined | null): boolean => {
  if (!status) return false
  const normalized = status.toUpperCase()
  return normalized === 'ACTIVE'
}

export default function CropManagementPage() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize] = useState(10)
  const [isSearchMode, setIsSearchMode] = useState(false)

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formData, setFormData] = useState<CropFormData>(INITIAL_FORM_STATE)
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedCropForDetails, setSelectedCropForDetails] = useState<Crop | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const { toast } = useToast()

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)
      const data = await categoryService.getAllCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách danh mục',
        variant: 'destructive',
      })
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadCrops = async (page: number = 1, useSearch: boolean = false) => {
    try {
      setLoading(true)
      let response: PaginatedCrops | CropResponse

      if (useSearch && (searchTerm || statusFilter !== 'all')) {
        const status = statusFilter === 'all' ? undefined : statusFilter === 'active' ? 'ACTIVE' : 'INACTIVE'
        const searchResponse = await cropService.searchCrop(searchTerm || undefined, status, page, pageSize)

        // Handle search response structure
        if (searchResponse.data && Array.isArray(searchResponse.data.items)) {
          setCrops(searchResponse.data.items)
          setTotalItems(searchResponse.data.totalItemCount || 0)
        } else if (Array.isArray(searchResponse.data)) {
          setCrops(searchResponse.data)
          setTotalItems(searchResponse.data.length)
        } else {
          setCrops([])
          setTotalItems(0)
        }
        setIsSearchMode(true)
      } else {
        response = await cropService.getAllCrops(page, pageSize)
        setCrops(response.items || [])
        setTotalItems(response.totalItemCount || 0)
        setIsSearchMode(false)
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể tải danh sách cây trồng',
        variant: 'destructive',
      })
      setCrops([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  const handleResetForm = () => {
    setFormData(INITIAL_FORM_STATE)
    setSelectedCrop(null)
    setImagePreview(null)
    setUploadProgress(0)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  const populateForm = (crop: Crop) => {
    setFormData({
      cropName: crop.cropName || '',
      description: crop.description || '',
      origin: crop.origin || '',
      categoryId: '', // Will need to be set from crop data if available
      productName: '',
      price: '',
      productDescription: '',
      images: '',
    })
  }

  const openCreateDialog = () => {
    handleResetForm()
    setFormMode('create')
    loadCategories()
    setFormDialogOpen(true)
  }

  const openEditDialog = (crop: Crop) => {
    setSelectedCrop(crop)
    populateForm(crop)
    setFormMode('edit')
    loadCategories()
    setFormDialogOpen(true)
  }

  const handleSubmitForm = async () => {
    if (!formData.cropName.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập tên cây trồng',
        variant: 'destructive',
      })
      return
    }

    if (formMode === 'create') {
      if (!formData.categoryId) {
        toast({
          title: 'Thiếu thông tin',
          description: 'Vui lòng chọn danh mục',
          variant: 'destructive',
        })
        return
      }
      if (!formData.productName.trim()) {
        toast({
          title: 'Thiếu thông tin',
          description: 'Vui lòng nhập tên sản phẩm',
          variant: 'destructive',
        })
        return
      }
      if (!formData.price || Number(formData.price) <= 0) {
        toast({
          title: 'Thiếu thông tin',
          description: 'Vui lòng nhập giá sản phẩm hợp lệ',
          variant: 'destructive',
        })
        return
      }
    }

    try {
      setIsSubmitting(true)

      if (formMode === 'create') {
        const payload: CreateCropWithProductRequest = {
          request1: {
            cropName: formData.cropName,
            description: formData.description || undefined,
            origin: formData.origin,
            categoryId: formData.categoryId as number,
          },
          request2: {
            productName: formData.productName,
            price: Number(formData.price),
            description: formData.productDescription || undefined,
            images: formData.images || undefined,
          },
        }

        await cropService.createCrop(payload)
        toast({ title: 'Thành công', description: 'Đã tạo cây trồng mới' })
        setFormDialogOpen(false)
        handleResetForm()
        loadCrops(currentPage, isSearchMode)
      } else if (selectedCrop) {
        const payload: CropRequest = {
          cropName: formData.cropName,
          description: formData.description || undefined,
          origin: formData.origin,
          categoryId: formData.categoryId as number || 0,
        }

        await cropService.updateCrop(selectedCrop.cropId, payload)
        toast({ title: 'Thành công', description: 'Đã cập nhật cây trồng' })
        setFormDialogOpen(false)
        handleResetForm()
        loadCrops(currentPage, isSearchMode)
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể lưu cây trồng',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangeStatus = async (cropId: number) => {
    try {
      await cropService.changeStatus(cropId)
      toast({ title: 'Thành công', description: 'Đã thay đổi trạng thái cây trồng' })
      loadCrops(currentPage, isSearchMode)
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể thay đổi trạng thái',
        variant: 'destructive',
      })
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadCrops(1, true)
  }

  const handleRefresh = async () => {
    setSearchTerm('')
    setStatusFilter('all')
    setCurrentPage(1)
    await loadCrops(1, false)
  }

  const openDetailsDialog = (crop: Crop) => {
    setSelectedCropForDetails(crop)
    setDetailsDialogOpen(true)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'File không hợp lệ',
        description: 'Vui lòng chọn file hình ảnh (JPG, PNG, GIF, etc.)',
        variant: 'destructive',
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate file size (5MB max)
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

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result as string
      setImagePreview(result)
    }
    reader.readAsDataURL(file)

    // Upload to Cloudinary
    setIsUploading(true)
    setUploadProgress(0)

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      const cloudinaryUrl = await uploadImageToCloudinary({
        file,
        folder: 'sep490/products',
        onProgress: setUploadProgress,
        signal: abortControllerRef.current.signal,
      })

      setFormData(prev => ({ ...prev, images: cloudinaryUrl }))
      setImagePreview(cloudinaryUrl)
      toast({
        title: 'Thành công',
        description: 'Đã tải ảnh lên thành công',
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
      setFormData(prev => ({ ...prev, images: '' }))
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveImage = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setImagePreview(null)
    setFormData(prev => ({ ...prev, images: '' }))
    setUploadProgress(0)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const stats = useMemo(() => {
    const total = totalItems
    const active = crops.filter(crop => isActiveStatus(crop.status)).length
    const inactive = crops.filter(crop => !isActiveStatus(crop.status)).length

    return {
      total,
      active,
      inactive,
    }
  }, [crops, totalItems])

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  useEffect(() => {
    loadCrops(1, false)
    loadCategories()
  }, [])

  useEffect(() => {
    if (!isSearchMode) {
      loadCrops(currentPage, false)
    }
  }, [currentPage])

  return (
    <ManagerLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cây Trồng</h1>
          <p className="text-gray-600 mt-2">
            Quản lý toàn bộ thông tin cây trồng, sản phẩm và trạng thái hoạt động.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tổng cây trồng</p>
                  <p className="text-2xl font-semibold mt-1">{stats.total}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3 text-green-600">
                  <BarChart2 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {stats.active} đang hoạt động • {stats.inactive} tạm dừng
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Đang hoạt động</p>
                  <p className="text-2xl font-semibold mt-1 text-green-600">{stats.active}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Cây trồng đang được sử dụng</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tạm dừng</p>
                  <p className="text-2xl font-semibold mt-1 text-gray-600">{stats.inactive}</p>
                </div>
                <div className="rounded-full bg-orange-100 p-3 text-orange-600">
                  <Filter className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Cây trồng đã tạm dừng</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-600">Tìm kiếm theo tên</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nhập tên cây trồng..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label className="text-sm font-medium text-gray-600">Trạng thái</Label>
                <Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Tạm dừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Làm mới
                </Button>
                <Button variant="outline" onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Tìm kiếm
                </Button>
                <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm mới
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">STT</TableHead>
                <TableHead>Tên cây trồng</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Xuất xứ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : crops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Không tìm thấy cây trồng nào
                  </TableCell>
                </TableRow>
              ) : (
                crops.map((crop, index) => (
                  <TableRow key={crop.cropId}>
                    <TableCell className="text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{crop.cropName}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {crop.description || '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600">{crop.origin || '—'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isActiveStatus(crop.status) ? 'default' : 'secondary'}
                      >
                        {isActiveStatus(crop.status) ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailsDialog(crop)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(crop)} title="Chỉnh sửa">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangeStatus(crop.cropId)}
                          title={isActiveStatus(crop.status) ? 'Tạm dừng' : 'Kích hoạt'}
                        >
                          {isActiveStatus(crop.status) ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPage = Math.max(1, currentPage - 1)
                setCurrentPage(newPage)
                if (isSearchMode) {
                  loadCrops(newPage, true)
                }
              }}
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
              onClick={() => {
                const newPage = Math.min(totalPages, currentPage + 1)
                setCurrentPage(newPage)
                if (isSearchMode) {
                  loadCrops(newPage, true)
                }
              }}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={formDialogOpen}
        onOpenChange={open => {
          if (!open) {
            // Cancel any ongoing upload when closing
            if (abortControllerRef.current) {
              abortControllerRef.current.abort()
              abortControllerRef.current = null
            }
            handleResetForm()
          }
          setFormDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formMode === 'create' ? 'Thêm cây trồng mới' : 'Cập nhật cây trồng'}</DialogTitle>
            <DialogDescription>
              {formMode === 'create'
                ? 'Nhập thông tin cây trồng và sản phẩm liên quan'
                : 'Cập nhật thông tin cây trồng'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tên cây trồng *</Label>
                <Input
                  value={formData.cropName}
                  onChange={e => setFormData(prev => ({ ...prev, cropName: e.target.value }))}
                  className="mt-1"
                  placeholder="Ví dụ: Rau cải xanh"
                />
              </div>
              <div>
                <Label>Xuất xứ *</Label>
                <Input
                  value={formData.origin}
                  onChange={e => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                  className="mt-1"
                  placeholder="Ví dụ: Việt Nam"
                />
              </div>
            </div>

            <div>
              <Label>Mô tả</Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả về cây trồng..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Danh mục *</Label>
              <Select
                value={formData.categoryId ? String(formData.categoryId) : ''}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    categoryId: value ? Number(value) : '',
                  }))
                }
                disabled={loadingCategories}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingCategories ? 'Đang tải...' : 'Chọn danh mục'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.categoryId} value={String(category.categoryId)}>
                      {category.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formMode === 'create' && (
              <>
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Thông tin sản phẩm</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tên sản phẩm *</Label>
                      <Input
                        value={formData.productName}
                        onChange={e => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                        className="mt-1"
                        placeholder="Tên sản phẩm"
                      />
                    </div>
                    <div>
                      <Label>Giá *</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.price}
                        onChange={e => {
                          const value = e.target.value
                          setFormData(prev => ({ ...prev, price: value === '' ? '' : Number(value) }))
                        }}
                        className="mt-1"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Mô tả sản phẩm</Label>
                  <Textarea
                    rows={3}
                    value={formData.productDescription}
                    onChange={e => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
                    placeholder="Mô tả về sản phẩm..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Hình ảnh</Label>
                  <div className="mt-1 space-y-2">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          {!isUploading && (
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              title="Xóa ảnh"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        {isUploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                            <div className="text-center text-white">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                              <p className="text-xs">{uploadProgress}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                      >
                        <Upload className="h-6 w-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Tải lên</span>
                      </label>
                    )}
                    <Input
                      ref={fileInputRef}
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isUploading || isSubmitting}
                      className="hidden"
                    />
                    {!imagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isSubmitting}
                        className="flex items-center gap-2"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải lên... {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Chọn ảnh
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleSubmitForm} disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : formMode === 'create' ? 'Tạo mới' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết cây trồng</DialogTitle>
            <DialogDescription>Thông tin chi tiết về cây trồng</DialogDescription>
          </DialogHeader>

          {selectedCropForDetails && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Tên cây trồng</h3>
                  <p className="text-lg font-semibold text-gray-900">{selectedCropForDetails.cropName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Trạng thái</h3>
                  <Badge
                    variant={isActiveStatus(selectedCropForDetails.status) ? 'default' : 'secondary'}
                    className="text-base"
                  >
                    {isActiveStatus(selectedCropForDetails.status) ? 'Hoạt động' : 'Tạm dừng'}
                  </Badge>
                </div>
              </div>

              {selectedCropForDetails.description && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Mô tả</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedCropForDetails.description}</p>
                </div>
              )}

              {selectedCropForDetails.origin && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Xuất xứ</h3>
                  <p className="text-gray-900">{selectedCropForDetails.origin}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  )
}

