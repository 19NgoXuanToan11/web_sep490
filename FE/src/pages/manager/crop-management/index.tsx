import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { ManagementPageHeader, StaffFilterBar, StaffDataTable, type StaffDataTableColumn } from '@/shared/ui'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import {
  Search,
  Upload,
  Loader2,
  X,
  MoreHorizontal,
} from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import {
  cropService,
  type Crop,
  type CropRequest,
  type CreateCropWithProductRequest,
  type PaginatedCrops,
  type CropResponse,
  type CropRequirement,
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

// Helper function to translate plant stage to Vietnamese
const translatePlantStage = (stage: string | null | undefined): string => {
  if (!stage) return ''
  const stageMap: Record<string, string> = {
    'Germination': 'Nảy mầm',
    'Seedling': 'Cây con',
    'Vegetative': 'Sinh trưởng',
    'Harvest': 'Thu hoạch',
  }
  return stageMap[stage] || stage
}

// Component riêng cho Action Menu để tránh re-render issues
interface CropActionMenuProps {
  crop: Crop
  onViewDetails: (crop: Crop) => void
  onEdit: (crop: Crop) => void
}

const CropActionMenu: React.FC<CropActionMenuProps> = React.memo(({ crop, onViewDetails, onEdit }) => {
  const [open, setOpen] = useState(false)

  const handleViewDetails = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
    setTimeout(() => {
      onViewDetails(crop)
    }, 0)
  }, [crop, onViewDetails])

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
    setTimeout(() => {
      onEdit(crop)
    }, 0)
  }, [crop, onEdit])


  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
        sideOffset={5}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuItem
          onClick={handleViewDetails}
          className="cursor-pointer focus:bg-gray-100"
          onSelect={(e) => e.preventDefault()}
        >
          Xem chi tiết
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleEdit}
          className="cursor-pointer focus:bg-gray-100"
          onSelect={(e) => e.preventDefault()}
        >
          Chỉnh sửa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

CropActionMenu.displayName = 'CropActionMenu'

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

  const openDetailsDialog = useCallback((crop: Crop) => {
    setSelectedCropForDetails(crop)
    setDetailsDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((crop: Crop) => {
    setSelectedCrop(crop)
    populateForm(crop)
    setFormMode('edit')
    loadCategories()
    setFormDialogOpen(true)
  }, [])


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
        <ManagementPageHeader
          title="Quản lý cây trồng"
          description="Quản lý toàn bộ thông tin cây trồng, sản phẩm và trạng thái hoạt động."
          actions={
            <Button variant="outline" onClick={handleRefresh} size="sm">
              Làm mới
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tổng cây trồng</p>
                  <p className="text-2xl font-semibold mt-1">{stats.total}</p>
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
              </div>
              <p className="text-sm text-gray-500 mt-2">Cây trồng đã tạm dừng</p>
            </CardContent>
          </Card>
        </div>

        <StaffFilterBar>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700" size="sm">
              Tạo
            </Button>
          </div>
        </StaffFilterBar>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
              </div>
            ) : (
              <StaffDataTable<Crop>
                className="px-4 sm:px-6 pb-6"
                data={crops}
                getRowKey={(crop) => crop.cropId}
                currentPage={currentPage}
                pageSize={pageSize}
                totalPages={totalPages}
                onPageChange={(newPage) => {
                  setCurrentPage(newPage)
                  if (isSearchMode) {
                    loadCrops(newPage, true)
                  }
                }}
                emptyTitle="Không tìm thấy cây trồng nào"
                emptyDescription={
                  searchTerm || statusFilter !== 'all'
                    ? 'Không có cây trồng nào phù hợp với điều kiện lọc hiện tại.'
                    : 'Hãy tạo cây trồng đầu tiên.'
                }
                canExpand={(crop) => {
                  return !!(crop.cropRequirement && crop.cropRequirement.length > 0)
                }}
                renderExpandedContent={(crop) => {
                  if (!crop.cropRequirement || crop.cropRequirement.length === 0) {
                    return null
                  }

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Yêu cầu cây trồng ({crop.cropRequirement.length})
                        </h4>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {crop.cropRequirement.map((requirement: CropRequirement) => (
                          <Card key={requirement.cropRequirementId} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="font-semibold">
                                    {translatePlantStage(requirement.plantStage)}
                                  </Badge>
                                  {requirement.estimatedDate && (
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <span>Ước tính: {requirement.estimatedDate} ngày</span>
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {requirement.temperature !== undefined && requirement.temperature !== null && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-600">Nhiệt độ:</span>
                                      <span className="font-medium">{requirement.temperature}°C</span>
                                    </div>
                                  )}

                                  {requirement.moisture !== undefined && requirement.moisture !== null && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-600">Độ ẩm:</span>
                                      <span className="font-medium">{requirement.moisture}</span>
                                    </div>
                                  )}

                                  {requirement.lightRequirement !== undefined && requirement.lightRequirement !== null && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-600">Ánh sáng:</span>
                                      <span className="font-medium">{requirement.lightRequirement}</span>
                                    </div>
                                  )}

                                  {requirement.wateringFrequency && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-600">Tưới nước:</span>
                                      <span className="font-medium">{requirement.wateringFrequency}</span>
                                    </div>
                                  )}
                                </div>

                                {requirement.fertilizer && (
                                  <div className="pt-2 border-t">
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Phân bón:</span> {requirement.fertilizer}
                                    </p>
                                  </div>
                                )}

                                {requirement.notes && (
                                  <div className="pt-2 border-t">
                                    <p className="text-sm text-gray-600 italic">
                                      <span className="font-medium">Ghi chú:</span> {requirement.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                }}
                columns={[
                  {
                    id: 'cropName',
                    header: 'Cây trồng',
                    render: (crop) => (
                      <p className="font-semibold">{crop.cropName}</p>
                    ),
                  },
                  {
                    id: 'description',
                    header: 'Mô tả',
                    render: (crop) => (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {crop.description || '—'}
                      </p>
                    ),
                  },
                  {
                    id: 'origin',
                    header: 'Xuất xứ',
                    render: (crop) => (
                      <p className="text-sm text-gray-600">
                        {crop.origin || '—'}
                      </p>
                    ),
                  },
                  {
                    id: 'status',
                    header: 'Trạng thái',
                    render: (crop) => (
                      <Badge
                        variant={isActiveStatus(crop.status) ? 'default' : 'secondary'}
                      >
                        {isActiveStatus(crop.status) ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    ),
                  },
                  {
                    id: 'actions',
                    header: '',
                    render: (crop) => (
                      <CropActionMenu
                        crop={crop}
                        onViewDetails={openDetailsDialog}
                        onEdit={openEditDialog}
                      />
                    ),
                  },
                ] satisfies StaffDataTableColumn<Crop>[]}
              />
            )}
          </CardContent>
        </Card>
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
            <DialogTitle>{formMode === 'create' ? 'Tạo cây trồng mới' : 'Chỉnh sửa cây trồng'}</DialogTitle>
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
              {isSubmitting ? 'Đang lưu...' : formMode === 'create' ? 'Tạo' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết cây trồng</DialogTitle>
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

