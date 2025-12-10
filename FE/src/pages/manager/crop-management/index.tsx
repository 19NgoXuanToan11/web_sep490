import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { ManagementPageHeader, StaffFilterBar } from '@/shared/ui'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'
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
import { Pagination } from '@/shared/ui/pagination'
import {
  Search,
  Upload,
  Loader2,
  X,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import {
  cropService,
  type Crop,
  type CropRequest,
  type CreateCropWithProductRequest,
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


// Component riêng cho Action Menu để tránh re-render issues
interface CropActionMenuProps {
  crop: Crop
  onViewDetails: (crop: Crop) => void
  onEdit: (crop: Crop) => void
  onChangeStatus: (crop: Crop) => void
}

const CropActionMenu: React.FC<CropActionMenuProps> = React.memo(({ crop, onViewDetails, onEdit, onChangeStatus }) => {
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

  const handleChangeStatus = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
    setTimeout(() => {
      onChangeStatus(crop)
    }, 0)
  }, [crop, onChangeStatus])

  const isActive = isActiveStatus(crop.status)

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
        <DropdownMenuItem
          onClick={handleChangeStatus}
          className={`cursor-pointer focus:bg-gray-100 ${isActive ? 'text-red-600' : 'text-green-600'}`}
          onSelect={(e) => e.preventDefault()}
        >
          {isActive ? 'Tạm dừng' : 'Kích hoạt'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

CropActionMenu.displayName = 'CropActionMenu'

type SortOption = 'newest' | 'cropName' | 'status'

export default function CropManagementPage() {
  const [allCrops, setAllCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [pageIndex, setPageIndex] = useState(1)
  const [pageSize] = useState(10)
  const [newlyCreatedIds, setNewlyCreatedIds] = useState<Set<number>>(new Set())
  const previousMaxIdRef = useRef<number>(0)

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

  const loadCrops = async () => {
    try {
      setLoading(true)
      // Load all crops for client-side filtering/sorting
      const response = await cropService.getAllCrops(1, 1000)
      const loadedCrops = response.items || []

      // Track newly created crops
      const currentMaxId = Math.max(...loadedCrops.map(c => c.cropId), 0)
      if (currentMaxId > previousMaxIdRef.current && previousMaxIdRef.current > 0) {
        setNewlyCreatedIds(new Set([currentMaxId]))
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      }
      previousMaxIdRef.current = currentMaxId

      setAllCrops(loadedCrops)
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể tải danh sách cây trồng',
        variant: 'destructive',
      })
      setAllCrops([])
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
        await loadCrops()
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
        await loadCrops()
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


  const handleRefresh = async () => {
    setSearchTerm('')
    setStatusFilter('all')
    setSortBy('newest')
    setPageIndex(1)
    await loadCrops()
  }

  const handlePageChange = (page: number) => {
    setPageIndex(page)
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

  const handleChangeStatus = useCallback(async (crop: Crop) => {
    try {
      // Determine new status: 
      // CropStatus enum: ACTIVE = 0, INACTIVE = 1
      // If currently ACTIVE (0), change to INACTIVE (1), otherwise change to ACTIVE (0)
      const currentIsActive = isActiveStatus(crop.status)
      const newStatus = currentIsActive ? 1 : 0 // 0 = ACTIVE, 1 = INACTIVE

      await cropService.changeStatus(crop.cropId, newStatus)

      toast({
        title: 'Thành công',
        description: `Đã ${currentIsActive ? 'tạm dừng' : 'kích hoạt'} cây trồng "${crop.cropName}"`,
      })

      // Reload crops to reflect the status change
      await loadCrops()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể cập nhật trạng thái cây trồng',
        variant: 'destructive',
      })
    }
  }, [toast])

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

  // Client-side filtering
  const filteredCrops = useMemo(() => {
    return allCrops.filter(crop => {
      const matchesSearch = !searchTerm ||
        crop.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (crop.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (crop.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && isActiveStatus(crop.status)) ||
        (statusFilter === 'inactive' && !isActiveStatus(crop.status))

      return matchesSearch && matchesStatus
    })
  }, [allCrops, searchTerm, statusFilter])

  // Client-side sorting
  const sortedCrops = useMemo(() => {
    const sorted = [...filteredCrops]

    switch (sortBy) {
      case 'newest':
        // Sort by cropId descending (assuming higher ID = newer)
        return sorted.sort((a, b) => b.cropId - a.cropId)
      case 'cropName':
        return sorted.sort((a, b) => a.cropName.localeCompare(b.cropName))
      case 'status':
        return sorted.sort((a, b) => {
          const aActive = isActiveStatus(a.status)
          const bActive = isActiveStatus(b.status)
          if (aActive !== bActive) return aActive ? -1 : 1
          return a.cropName.localeCompare(b.cropName)
        })
      default:
        return sorted
    }
  }, [filteredCrops, sortBy])

  // Pagination
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedCrops.length / pageSize))
  }, [sortedCrops.length, pageSize])

  const paginatedCrops = useMemo(() => {
    const start = (pageIndex - 1) * pageSize
    return sortedCrops.slice(start, start + pageSize)
  }, [sortedCrops, pageIndex, pageSize])

  const stats = useMemo(() => {
    const total = allCrops.length
    const active = allCrops.filter(crop => isActiveStatus(crop.status)).length
    const inactive = allCrops.filter(crop => !isActiveStatus(crop.status)).length

    return {
      total,
      active,
      inactive,
    }
  }, [allCrops])

  useEffect(() => {
    loadCrops()
    loadCategories()
  }, [])

  useEffect(() => {
    setPageIndex(1)
  }, [searchTerm, statusFilter, sortBy])

  // Auto-remove highlight after 5 seconds
  useEffect(() => {
    if (newlyCreatedIds.size > 0) {
      const timer = setTimeout(() => {
        setNewlyCreatedIds(new Set())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [newlyCreatedIds])

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
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select value={sortBy} onValueChange={value => setSortBy(value as SortOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="cropName">Tên cây trồng</SelectItem>
                <SelectItem value="status">Trạng thái</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-auto flex justify-end">
            <Button onClick={openCreateDialog} className="w-full sm:w-auto bg-green-600 hover:bg-green-700" size="sm">
              Tạo
            </Button>
          </div>
        </StaffFilterBar>

        {/* Card-based Layout */}
        {loading ? (
          <Card>
            <CardContent className="p-12">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
              </div>
            </CardContent>
          </Card>
        ) : paginatedCrops.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-lg font-semibold text-gray-900">
                {(() => {
                  if (searchTerm) return 'Không tìm thấy cây trồng nào'
                  if (statusFilter === 'active') return 'Chưa có cây trồng đang hoạt động'
                  if (statusFilter === 'inactive') return 'Chưa có cây trồng tạm dừng'
                  return 'Chưa có cây trồng'
                })()}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {(() => {
                  if (searchTerm) return 'Không có cây trồng nào phù hợp với điều kiện tìm kiếm.'
                  if (statusFilter === 'active') return 'Hãy tạo cây trồng mới hoặc kích hoạt các cây trồng đã tạm dừng.'
                  if (statusFilter === 'inactive') return 'Hãy tạm dừng một số cây trồng để thấy chúng ở đây.'
                  return 'Hãy tạo cây trồng đầu tiên.'
                })()}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {paginatedCrops.map((crop) => {
                const isNewlyCreated = newlyCreatedIds.has(crop.cropId)
                return (
                  <Card
                    key={crop.cropId}
                    className={cn(
                      "hover:shadow-md transition-all cursor-pointer",
                      isNewlyCreated && "ring-2 ring-green-500 bg-green-50/50 shadow-lg"
                    )}
                    onClick={() => openDetailsDialog(crop)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate mb-2">
                            {crop.cropName}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge
                              variant={isActiveStatus(crop.status) ? 'success' : 'destructive'}
                              className="h-6 items-center whitespace-nowrap text-xs"
                            >
                              {isActiveStatus(crop.status) ? 'Hoạt động' : 'Tạm dừng'}
                            </Badge>
                            {isNewlyCreated && (
                              <Badge className="h-6 items-center whitespace-nowrap text-xs bg-green-500 text-white">
                                Mới
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <CropActionMenu
                            crop={crop}
                            onViewDetails={openDetailsDialog}
                            onEdit={openEditDialog}
                            onChangeStatus={handleChangeStatus}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={pageIndex}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
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
                    variant={isActiveStatus(selectedCropForDetails.status) ? 'success' : 'destructive'}
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

