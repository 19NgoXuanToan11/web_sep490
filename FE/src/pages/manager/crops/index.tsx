import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
import { Textarea } from '@/shared/ui/textarea'
import {
  Search,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import {
  ManagementPageHeader,
  StaffFilterBar,
  StaffDataTable,
  type StaffDataTableColumn,
} from '@/shared/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  cropRequirementService,
  type CropRequirementView,
  type CropRequirementPayload,
  type PlantStage,
} from '@/shared/api/cropRequirementService'
import { cropService, type Crop, type CropRequirement } from '@/shared/api/cropService'

type RequirementFormState = {
  cropId: number | ''
  plantStage: PlantStage | ''
  estimatedDate: string
  moisture: string
  temperature: string
  fertilizer: string
  lightRequirement: string
  wateringFrequency: string
  notes: string
}

// Map UI labels to the 4 enum values that backend accepts (Domain.Enum.PlantStage)
const PLANT_STAGE_OPTIONS: { value: PlantStage; label: string; description: string }[] = [
  {
    value: 'Germination',
    label: 'Gieo hạt',
    description: 'Chuẩn bị đất và gieo giống (0–7 ngày)',
  },
  {
    value: 'Seedling',
    label: 'Nảy mầm',
    description: 'Theo dõi độ ẩm và sự phát triển mầm (8–18 ngày)',
  },
  {
    value: 'Vegetative',
    label: 'Tăng trưởng lá',
    description: 'Phát triển thân, lá – tăng cường ánh sáng và dinh dưỡng (19–35 ngày)',
  },
  {
    value: 'Harvest',
    label: 'Thu hoạch',
    description: 'Sẵn sàng thu hoạch và đánh giá chất lượng (36–37 ngày)',
  },
]

const INITIAL_FORM_STATE: RequirementFormState = {
  cropId: '',
  plantStage: '',
  estimatedDate: '',
  moisture: '',
  temperature: '',
  fertilizer: '',
  lightRequirement: '',
  wateringFrequency: '',
  notes: '',
}

const formatNumber = (value?: number | null, unit?: string) => {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toFixed(1)}${unit ? ` ${unit}` : ''}`
}

const stageLabel = (stage?: string | null) => {
  if (!stage) return 'Chưa xác định'
  const match = PLANT_STAGE_OPTIONS.find(option => option.value === stage)
  return match ? match.label : stage
}

const toNullableNumber = (value: string | number | '') =>
  value === '' ? null : Number(value)

const getStatusBadge = (isActive: boolean | undefined | null) => {
  if (!isActive) return <Badge variant="destructive">Tạm dừng</Badge>
  return <Badge variant="success">Hoạt động</Badge>
}

type CropRequirementRow = {
  cropId: number
  cropName: string
  description?: string | null
  origin?: string | null
  cropStatus?: string | null
  cropRequirementId?: number
  plantStage?: string | null
  estimatedDate?: number | null
  moisture?: number | null
  temperature?: number | null
  fertilizer?: string | null
  lightRequirement?: number | null
  wateringFrequency?: string | null
  notes?: string | null
  isActive?: boolean | null
}

// Component riêng cho Action Menu
interface RequirementActionMenuProps {
  requirement: CropRequirementView | CropRequirement | CropRequirementRow
  isUpdatingStatus: boolean
  onToggleStatus: (requirement: CropRequirementView | CropRequirement | CropRequirementRow) => void
  onEdit: (requirement: CropRequirementView | CropRequirement | CropRequirementRow) => void
  onDelete: (requirement: CropRequirementView | CropRequirement | CropRequirementRow) => void
  onView: (requirement: CropRequirementRow) => void
}

const RequirementActionMenu: React.FC<RequirementActionMenuProps> = React.memo(
  ({ requirement, isUpdatingStatus, onToggleStatus, onEdit, onDelete, onView }) => {
    const [open, setOpen] = useState(false)
    const isActive = requirement.isActive ?? true

    const handleView = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        setTimeout(() => {
          onView(requirement as CropRequirementRow)
        }, 0)
      },
      [requirement, onView]
    )

    const handleToggleStatus = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        setTimeout(() => {
          onToggleStatus(requirement)
        }, 0)
      },
      [requirement, onToggleStatus]
    )

    const handleEdit = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        setTimeout(() => {
          onEdit(requirement)
        }, 0)
      },
      [requirement, onEdit]
    )

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        setTimeout(() => {
          onDelete(requirement)
        }, 0)
      },
      [requirement, onDelete]
    )

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
            onClick={handleView}
            className="cursor-pointer focus:bg-gray-100"
            onSelect={(e) => e.preventDefault()}
          >
            Xem chi tiết
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleToggleStatus}
            className="cursor-pointer focus:bg-gray-100"
            onSelect={(e) => e.preventDefault()}
            disabled={isUpdatingStatus}
          >
            {isActive ? 'Tạm dừng' : 'Kích hoạt'}
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
  }
)

RequirementActionMenu.displayName = 'RequirementActionMenu'

export default function CropsPage() {
  const [requirements, setRequirements] = useState<CropRequirementView[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [stageFilter, setStageFilter] = useState<'all' | PlantStage>('all')
  const [pageIndex, setPageIndex] = useState(1)
  const pageSize = 10

  const [crops, setCrops] = useState<Crop[]>([])
  const [cropsLoading, setCropsLoading] = useState(false)

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formData, setFormData] = useState<RequirementFormState>(INITIAL_FORM_STATE)
  const [selectedRequirement, setSelectedRequirement] = useState<CropRequirementView | CropRequirementRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableCrops, setAvailableCrops] = useState<Crop[]>([])
  const [loadingCrops, setLoadingCrops] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRequirementForDelete, setSelectedRequirementForDelete] =
    useState<CropRequirementView | CropRequirementRow | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [detailRequirement, setDetailRequirement] = useState<CropRequirementRow | null>(null)
  const [detailCrop, setDetailCrop] = useState<Crop | null>(null)

  const { toast } = useToast()

  // Đồng bộ crop + requirement để hiển thị đầy đủ dữ liệu (kể cả crop chưa có requirement)
  const requirementRows: CropRequirementRow[] = useMemo(() => {
    const cropMap = new Map<number, Crop>()
    crops.forEach(crop => cropMap.set(crop.cropId, crop))

    const rowsFromReq = requirements.map(req => {
      const crop = cropMap.get(req.cropId)
      return {
        cropId: req.cropId,
        cropName: crop?.cropName || req.cropName || 'Chưa có tên',
        description: crop?.description,
        origin: crop?.origin,
        cropStatus: crop?.status || null,
        cropRequirementId: req.cropRequirementId,
        plantStage: req.plantStage,
        estimatedDate: req.estimatedDate,
        moisture: req.moisture,
        temperature: req.temperature,
        fertilizer: req.fertilizer,
        lightRequirement: req.lightRequirement,
        wateringFrequency: req.wateringFrequency,
        notes: req.notes,
        isActive: req.isActive ?? true,
      } as CropRequirementRow
    })

    // Thêm dòng placeholder cho crop chưa có requirement
    const rowsFromCrops: CropRequirementRow[] = crops
      .filter(crop => !crop.cropRequirement || crop.cropRequirement.length === 0)
      .map(crop => ({
        cropId: crop.cropId,
        cropName: crop.cropName,
        description: crop.description,
        origin: crop.origin,
        cropStatus: crop.status,
        cropRequirementId: undefined,
        plantStage: null,
        estimatedDate: null,
        moisture: null,
        temperature: null,
        fertilizer: null,
        lightRequirement: null,
        wateringFrequency: null,
        notes: null,
        isActive: crop.status?.toUpperCase() === 'ACTIVE',
      }))

    return [...rowsFromReq, ...rowsFromCrops]
  }, [crops, requirements])

  const stats = useMemo(() => {
    const total = requirementRows.length
    const active = requirementRows.filter(item => item.isActive).length
    const average = (key: keyof CropRequirementRow) => {
      const values = requirementRows
        .map(item => item[key] as number | null | undefined)
        .filter((value): value is number => typeof value === 'number')
      if (!values.length) return null
      return values.reduce((sum, value) => sum + value, 0) / values.length
    }
    const stageDistribution = PLANT_STAGE_OPTIONS.map(option => {
      const count = requirementRows.filter(item => item.plantStage === option.value).length
      return { ...option, count, percent: total ? Math.round((count / total) * 100) : 0 }
    })

    return {
      total,
      active,
      inactive: total - active,
      moisture: average('moisture'),
      temperature: average('temperature'),
      light: average('lightRequirement'),
      stageDistribution,
    }
  }, [requirementRows])

  const filteredRequirements = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return requirementRows.filter(req => {
      if (!req) return false

      if (statusFilter !== 'all') {
        const active = req.isActive ?? false
        if (statusFilter === 'active' && !active) return false
        if (statusFilter === 'inactive' && active) return false
      }

      if (stageFilter !== 'all' && req.plantStage !== stageFilter) return false

      if (normalizedSearch) {
        const cropName = (req.cropName || '').toLowerCase()
        const notes = (req.notes || '').toLowerCase()
        if (!cropName.includes(normalizedSearch) && !notes.includes(normalizedSearch)) {
          return false
        }
      }

      return true
    })
  }, [requirementRows, searchTerm, statusFilter, stageFilter])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRequirements.length / pageSize))
  }, [filteredRequirements.length, pageSize])

  const paginatedRequirements = useMemo(() => {
    const start = (pageIndex - 1) * pageSize
    return filteredRequirements.slice(start, start + pageSize)
  }, [filteredRequirements, pageIndex, pageSize])

  const handleResetForm = () => {
    setFormData(INITIAL_FORM_STATE)
    setSelectedRequirement(null)
  }

  const handlePageChange = (page: number) => {
    setPageIndex(page)
  }

  const loadRequirements = async () => {
    try {
      setLoading(true)
      const response = await cropRequirementService.getAll()
      const data = Array.isArray(response.data) ? response.data : []
      setRequirements(data)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu yêu cầu cây trồng',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCrops = async () => {
    try {
      setCropsLoading(true)
      const response = await cropService.getAllCrops(1, 1000)
      setCrops(response.items || [])
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách cây trồng',
        variant: 'destructive',
      })
    } finally {
      setCropsLoading(false)
    }
  }

  const loadAvailableCrops = async () => {
    try {
      setLoadingCrops(true)
      // Load all crops (not just active) to get complete status information
      const response = await cropService.getAllCrops(1, 1000) // Load a large page size to get all crops
      setAvailableCrops(response.items || [])
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách cây trồng',
        variant: 'destructive',
      })
    } finally {
      setLoadingCrops(false)
    }
  }

  const openCreateDialog = () => {
    handleResetForm()
    setFormMode('create')
    loadAvailableCrops()
    setFormDialogOpen(true)
  }

  const mapFormToPayload = (): CropRequirementPayload => ({
    estimatedDate: toNullableNumber(formData.estimatedDate),
    moisture: toNullableNumber(formData.moisture),
    temperature: toNullableNumber(formData.temperature),
    fertilizer: formData.fertilizer || null,
    lightRequirement: toNullableNumber(formData.lightRequirement),
    wateringFrequency: formData.wateringFrequency || null,
    notes: formData.notes || null,
  })

  const mapRequirementToForm = (requirement: CropRequirementView | CropRequirement | CropRequirementRow): RequirementFormState => ({
    cropId: requirement.cropId,
    plantStage: (requirement.plantStage as PlantStage) || '',
    estimatedDate:
      requirement.estimatedDate === null || requirement.estimatedDate === undefined
        ? ''
        : String(requirement.estimatedDate),
    moisture:
      requirement.moisture === null || requirement.moisture === undefined
        ? ''
        : String(requirement.moisture),
    temperature:
      requirement.temperature === null || requirement.temperature === undefined
        ? ''
        : String(requirement.temperature),
    fertilizer: requirement.fertilizer || '',
    lightRequirement:
      requirement.lightRequirement === null || requirement.lightRequirement === undefined
        ? ''
        : String(requirement.lightRequirement),
    wateringFrequency: requirement.wateringFrequency || '',
    notes: requirement.notes || '',
  })

  const handleSubmitForm = async () => {
    if (formMode === 'create' && !formData.cropId) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng chọn cây trồng',
        variant: 'destructive',
      })
      return
    }
    if (!formData.plantStage) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng chọn giai đoạn phát triển',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      const payload = mapFormToPayload()
      if (formMode === 'create') {
        // For create mode, use the selected cropId from dropdown
        await cropRequirementService.create(formData.cropId as number, payload, formData.plantStage)
        toast({ title: 'Thành công', description: 'Đã thêm yêu cầu cây trồng mới' })
        setFormDialogOpen(false)
        handleResetForm()
        loadRequirements()
      } else if (selectedRequirement) {
        const requirementId = selectedRequirement.cropRequirementId
        if (!requirementId) {
          toast({
            title: 'Thiếu ID',
            description: 'Không tìm thấy ID yêu cầu để cập nhật',
            variant: 'destructive',
          })
          return
        }
        // For edit mode, use the cropId from the selected requirement implicitly
        await cropRequirementService.update(
          requirementId,
          payload,
          formData.plantStage
        )
        toast({ title: 'Thành công', description: 'Đã cập nhật yêu cầu cây trồng' })
        setFormDialogOpen(false)
        handleResetForm()
        loadRequirements()
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu yêu cầu cây trồng',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditRequirement = (requirement: CropRequirementView | CropRequirement | CropRequirementRow) => {
    if (!requirement.cropRequirementId) {
      toast({
        title: 'Chưa có yêu cầu',
        description: 'Vui lòng tạo yêu cầu trước khi chỉnh sửa.',
      })
      return
    }
    setFormMode('edit')
    setSelectedRequirement(requirement as CropRequirementView)
    setFormData(mapRequirementToForm(requirement))
    setFormDialogOpen(true)
  }

  const confirmDeleteRequirement = (requirement: CropRequirementView | CropRequirement | CropRequirementRow) => {
    if (!requirement.cropRequirementId) {
      toast({
        title: 'Chưa có yêu cầu',
        description: 'Không thể xoá vì chưa có yêu cầu.',
        variant: 'destructive',
      })
      return
    }
    setSelectedRequirementForDelete(requirement as CropRequirementView)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleRequirementStatus = async (requirement: CropRequirementView | CropRequirement | CropRequirementRow) => {
    if (!requirement.cropRequirementId) {
      toast({
        title: 'Chưa có yêu cầu',
        description: 'Không thể đổi trạng thái vì chưa có yêu cầu.',
        variant: 'destructive',
      })
      return
    }
    const isActive = requirement.isActive ?? true
    try {
      setStatusUpdatingId(requirement.cropRequirementId ?? null)
      await cropRequirementService.updateStatus(requirement.cropRequirementId as number)
      toast({
        title: 'Thành công',
        description: isActive ? 'Đã tạm dừng yêu cầu cây trồng' : 'Đã kích hoạt yêu cầu cây trồng',
      })
      await loadRequirements()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái yêu cầu cây trồng',
        variant: 'destructive',
      })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const openDetail = (requirement: CropRequirementRow) => {
    setDetailRequirement(requirement)
    const crop = crops.find(c => c.cropId === requirement.cropId) || null
    setDetailCrop(crop)
    setDetailDialogOpen(true)
  }

  const handleDeleteRequirement = async () => {
    if (!selectedRequirementForDelete) return
    if (!selectedRequirementForDelete.cropRequirementId) {
      toast({
        title: 'Chưa có yêu cầu',
        description: 'Không thể xoá vì chưa có yêu cầu.',
        variant: 'destructive',
      })
      return
    }

    try {
      await cropRequirementService.remove(selectedRequirementForDelete.cropRequirementId)
      toast({ title: 'Đã xoá', description: 'Yêu cầu cây trồng đã bị xoá' })
      setIsDeleteDialogOpen(false)
      setSelectedRequirementForDelete(null)
      loadRequirements()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xoá yêu cầu cây trồng',
        variant: 'destructive',
      })
    }
  }

  const handleRefresh = async () => {
    await Promise.all([loadRequirements(), loadAvailableCrops(), loadCrops()])
  }

  useEffect(() => {
    loadRequirements()
    loadAvailableCrops()
    loadCrops()
  }, [])

  useEffect(() => {
    setPageIndex(1)
  }, [searchTerm, statusFilter, stageFilter])

  return (
    <ManagerLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <ManagementPageHeader
            title="Theo dõi cây trồng"
            description="Theo dõi và quản lý giai đoạn phát triển của cây trồng"
            actions={
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  Làm mới
                </Button>
              </div>
            }
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng kế hoạch</p>
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
                    <p className="text-sm text-gray-500">Độ ẩm trung bình</p>
                    <p className="text-2xl font-semibold mt-1">{formatNumber(stats.moisture, '%')}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Theo dõi độ ẩm để đảm bảo nảy mầm đều</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Ánh sáng trung bình</p>
                    <p className="text-2xl font-semibold mt-1">{formatNumber(stats.light, 'lux')}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Giữ ánh sáng ổn định cho các giai đoạn tăng trưởng</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Nhiệt độ trung bình</p>
                    <p className="text-2xl font-semibold mt-1">{formatNumber(stats.temperature, '°C')}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Cảnh báo sớm khi nhiệt độ vượt ngưỡng</p>
              </CardContent>
            </Card>
          </div>

          <StaffFilterBar>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nhập tên cây trồng hoặc ghi chú..."
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
            <div className="w-full sm:w-56">
              <Select value={stageFilter} onValueChange={value => setStageFilter(value as typeof stageFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả giai đoạn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {PLANT_STAGE_OPTIONS.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={openCreateDialog} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                Tạo
              </Button>
            </div>
          </StaffFilterBar>

          <Card>
            <CardContent className="p-0">
              {loading || cropsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                  <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <StaffDataTable<CropRequirementRow>
                  className="px-4 sm:px-6 pb-6"
                  data={paginatedRequirements}
                  getRowKey={(req) => `${req.cropId}-${req.cropRequirementId ?? 'na'}`}
                  currentPage={pageIndex}
                  pageSize={pageSize}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  emptyTitle="Không tìm thấy yêu cầu nào"
                  emptyDescription={
                    searchTerm || statusFilter !== 'all' || stageFilter !== 'all'
                      ? 'Không có yêu cầu phù hợp với điều kiện lọc hiện tại.'
                      : 'Hãy tạo yêu cầu cây trồng đầu tiên.'
                  }
                  columns={[
                    {
                      id: 'cropName',
                      header: 'Cây trồng',
                      render: (req: CropRequirementRow) => (
                        <div>
                          <div className="font-semibold text-gray-900">{req.cropName || 'Chưa có tên'}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            {req.origin && <span>Xuất xứ: <span className="font-medium text-gray-800">{req.origin}</span></span>}
                          </div>
                          {req.description && (
                            <div className="mt-1 text-sm text-gray-700 line-clamp-2">{req.description}</div>
                          )}
                        </div>
                      ),
                    },
                    {
                      id: 'stage',
                      header: 'Giai đoạn & Trạng thái',
                      render: (req: CropRequirementRow) => (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge variant="outline">{stageLabel(req.plantStage)}</Badge>
                            {getStatusBadge(req.isActive)}
                          </div>
                          <div className="flex items-center">
                            {req.cropRequirementId ? (
                              <RequirementActionMenu
                                requirement={req}
                                isUpdatingStatus={statusUpdatingId === req.cropRequirementId}
                                onToggleStatus={handleToggleRequirementStatus}
                                onEdit={openEditRequirement}
                                onDelete={confirmDeleteRequirement}
                                onView={openDetail}
                              />
                            ) : (
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openCreateDialog()}>
                                Tạo
                              </Button>
                            )}
                          </div>
                        </div>
                      ),
                    },
                  ] satisfies StaffDataTableColumn<CropRequirementRow>[]}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={formDialogOpen} onOpenChange={open => {
        setFormDialogOpen(open)
        if (!open) handleResetForm()
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Tạo yêu cầu cây trồng mới' : 'Chỉnh sửa yêu cầu cây trồng'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {formMode === 'create' && (
              <div>
                <Label>Cây trồng *</Label>
                <Select
                  value={formData.cropId ? String(formData.cropId) : ''}
                  onValueChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      cropId: value ? Number(value) : '',
                    }))
                  }
                  disabled={loadingCrops}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={loadingCrops ? 'Đang tải...' : 'Chọn cây trồng'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCrops.map(crop => (
                      <SelectItem key={crop.cropId} value={String(crop.cropId)}>
                        {crop.cropName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Giai đoạn *</Label>
                <Select
                  value={formData.plantStage || ''}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, plantStage: value as PlantStage }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn giai đoạn" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANT_STAGE_OPTIONS.map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Độ ẩm (%)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.moisture}
                  onChange={e => setFormData(prev => ({ ...prev, moisture: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Thời gian ước tính (ngày)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.estimatedDate}
                  onChange={e => setFormData(prev => ({ ...prev, estimatedDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Cường độ ánh sáng (lux)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.lightRequirement}
                  onChange={e => setFormData(prev => ({ ...prev, lightRequirement: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nhiệt độ (°C)</Label>
                <Input
                  type="number"
                  value={formData.temperature}
                  onChange={e => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tần suất tưới</Label>
                <Input
                  placeholder="Ví dụ: 2 lần / ngày"
                  value={formData.wateringFrequency}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, wateringFrequency: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Phân bón</Label>
                <Input
                  value={formData.fertilizer}
                  onChange={e => setFormData(prev => ({ ...prev, fertilizer: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Ghi chú</Label>
              <Textarea
                rows={4}
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Các lưu ý chăm sóc, cảnh báo sâu bệnh..."
                className="mt-1"
              />
            </div>
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

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu cây trồng</DialogTitle>
          </DialogHeader>

          {detailRequirement && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Cây trồng</Label>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {detailRequirement.cropName}
                  </p>
                  {detailCrop?.origin && (
                    <p className="text-sm text-gray-600 mt-1">Xuất xứ: {detailCrop.origin}</p>
                  )}
                  {detailCrop?.status && (
                    <div className="mt-1">
                      <Badge variant={detailCrop.status.toUpperCase() === 'ACTIVE' ? 'success' : 'destructive'}>
                        {detailCrop.status.toUpperCase() === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Giai đoạn hiện tại</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline">{stageLabel(detailRequirement.plantStage)}</Badge>
                    {getStatusBadge(detailRequirement.isActive)}
                  </div>
                </div>
              </div>

              {detailCrop?.description && (
                <div>
                  <Label className="text-sm text-gray-600">Mô tả cây trồng</Label>
                  <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{detailCrop.description}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Yêu cầu môi trường</Label>
                  <div className="text-sm text-gray-800 space-y-1">
                    <div>Độ ẩm: <span className="font-semibold">{detailRequirement.moisture ?? '—'}%</span></div>
                    <div>Nhiệt độ: <span className="font-semibold">{detailRequirement.temperature ?? '—'}°C</span></div>
                    <div>Ánh sáng: <span className="font-semibold">{detailRequirement.lightRequirement ?? '—'} lux</span></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Chăm sóc</Label>
                  <div className="text-sm text-gray-800 space-y-1">
                    <div>Tần suất tưới (ngày): <span className="font-semibold">{detailRequirement.wateringFrequency || '—'}</span></div>
                    <div>Phân bón: <span className="font-semibold">{detailRequirement.fertilizer || '—'}</span></div>
                    <div>Thời gian dự kiến: <span className="font-semibold">{detailRequirement.estimatedDate ?? '—'} ngày</span></div>
                  </div>
                </div>
              </div>

              {detailRequirement.notes && (
                <div>
                  <Label className="text-sm text-gray-600">Ghi chú</Label>
                  <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{detailRequirement.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </ManagerLayout>
  )
}
