import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { Pagination } from '@/shared/ui/pagination'
import {
  Search,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import {
  ManagementPageHeader,
  StaffFilterBar,
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
  if (!isActive) return <Badge className="h-7 items-center whitespace-nowrap" variant="destructive">Tạm dừng</Badge>
  return <Badge className="h-7 items-center whitespace-nowrap" variant="success">Hoạt động</Badge>
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
  onView: (requirement: CropRequirementRow) => void
}

const RequirementActionMenu: React.FC<RequirementActionMenuProps> = React.memo(
  ({ requirement, isUpdatingStatus, onToggleStatus, onEdit, onView }) => {
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

type SortOption = 'newest' | 'cropName' | 'stage'

export default function CropsPage() {
  const [requirements, setRequirements] = useState<CropRequirementView[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active') // Mặc định chỉ hiển thị Active
  const [stageFilter, setStageFilter] = useState<'all' | PlantStage>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest') // Mặc định sắp xếp mới nhất
  const [pageIndex, setPageIndex] = useState(1)
  const [newlyCreatedIds, setNewlyCreatedIds] = useState<Set<number>>(new Set()) // Track items mới tạo
  const previousMaxIdRef = useRef<number>(0) // Track max ID trước khi reload
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

  // Sắp xếp requirements theo tùy chọn của user
  const sortedRequirements = useMemo(() => {
    const sorted = [...filteredRequirements]

    switch (sortBy) {
      case 'newest':
        // Mới nhất lên đầu: Active trước, sau đó sort theo ID giảm dần
        return sorted.sort((a, b) => {
          // Ưu tiên Active trước
          if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1
          }
          // Sau đó sort theo ID giảm dần (mới nhất lên đầu)
          const aId = a.cropRequirementId || 0
          const bId = b.cropRequirementId || 0
          return bId - aId
        })

      case 'cropName':
        // Sắp xếp theo tên cây trồng (A-Z)
        return sorted.sort((a, b) => {
          const nameA = (a.cropName || '').toLowerCase()
          const nameB = (b.cropName || '').toLowerCase()
          // Nếu cùng tên, ưu tiên Active và mới nhất
          if (nameA === nameB) {
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
            return (b.cropRequirementId || 0) - (a.cropRequirementId || 0)
          }
          return nameA.localeCompare(nameB, 'vi')
        })

      case 'stage':
        // Sắp xếp theo giai đoạn (theo thứ tự phát triển)
        const stageOrder = ['Germination', 'Seedling', 'Vegetative', 'Harvest']
        return sorted.sort((a, b) => {
          const aStage = a.plantStage || ''
          const bStage = b.plantStage || ''
          const aIndex = stageOrder.indexOf(aStage)
          const bIndex = stageOrder.indexOf(bStage)

          // Nếu cùng giai đoạn, ưu tiên Active và mới nhất
          if (aIndex === bIndex) {
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
            return (b.cropRequirementId || 0) - (a.cropRequirementId || 0)
          }

          // Nếu không có trong order, đẩy xuống cuối
          if (aIndex === -1) return 1
          if (bIndex === -1) return -1
          return aIndex - bIndex
        })

      default:
        return sorted
    }
  }, [filteredRequirements, sortBy])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedRequirements.length / pageSize))
  }, [sortedRequirements.length, pageSize])

  const paginatedRequirements = useMemo(() => {
    const start = (pageIndex - 1) * pageSize
    return sortedRequirements.slice(start, start + pageSize)
  }, [sortedRequirements, pageIndex, pageSize])

  // Nhóm requirements theo crop name (sau khi đã paginate để giữ nguyên pagination logic)
  // Giữ nguyên thứ tự xuất hiện đầu tiên của mỗi crop trong sorted list
  const groupedRequirements = useMemo(() => {
    const groups = new Map<string, CropRequirementRow[]>()
    const groupOrder: string[] = [] // Lưu thứ tự xuất hiện đầu tiên của mỗi crop

    paginatedRequirements.forEach(req => {
      const key = req.cropName || 'Khác'
      if (!groups.has(key)) {
        groups.set(key, [])
        groupOrder.push(key) // Lưu thứ tự xuất hiện đầu tiên
      }
      groups.get(key)!.push(req)
    })

    // Giữ nguyên thứ tự xuất hiện đầu tiên, không sort lại
    return groupOrder.map(key => [key, groups.get(key)!] as [string, CropRequirementRow[]])
  }, [paginatedRequirements])

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

      // Tìm max ID mới sau khi reload
      const currentMaxId = Math.max(...data.map(r => r.cropRequirementId || 0), 0)

      // Nếu có ID mới lớn hơn ID trước đó, highlight nó
      if (currentMaxId > previousMaxIdRef.current && previousMaxIdRef.current > 0) {
        setNewlyCreatedIds(new Set([currentMaxId]))
        // Scroll to top để user thấy item mới
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      }

      // Cập nhật max ID reference
      previousMaxIdRef.current = currentMaxId

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

  const openCreateDialog = (crop?: CropRequirementRow) => {
    handleResetForm()
    setFormMode('create')
    setFormData(prev => ({ ...prev, cropId: crop?.cropId ?? '' }))
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
        // Lưu max ID hiện tại trước khi tạo mới
        const currentMaxId = Math.max(...requirements.map(r => r.cropRequirementId || 0), 0)
        previousMaxIdRef.current = currentMaxId

        // For create mode, use the selected cropId from dropdown
        await cropRequirementService.create(formData.cropId as number, payload, formData.plantStage)
        toast({ title: 'Thành công', description: 'Đã thêm yêu cầu cây trồng mới' })
        setFormDialogOpen(false)
        handleResetForm()

        // Reload - loadRequirements sẽ tự động highlight item mới
        await loadRequirements()
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
  }, [searchTerm, statusFilter, stageFilter, sortBy])

  // Auto-remove highlight sau 5 giây
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
            <div className="w-full sm:w-48">
              <Select value={sortBy} onValueChange={value => setSortBy(value as SortOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="cropName">Tên cây trồng</SelectItem>
                  <SelectItem value="stage">Giai đoạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto flex justify-end">
              <Button
                size="sm"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 flex items-center gap-2"
                onClick={() => openCreateDialog()}
              >
                Tạo
              </Button>
            </div>
          </StaffFilterBar>

          {/* Simplified Crop List - Card-based Layout with Progressive Disclosure */}
              {loading || cropsLoading ? (
            <Card>
              <CardContent className="p-12">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                  <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                </div>
              </CardContent>
            </Card>
          ) : paginatedRequirements.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {searchTerm || stageFilter !== 'all'
                    ? 'Không tìm thấy yêu cầu nào'
                    : statusFilter === 'active'
                      ? 'Chưa có kế hoạch đang hoạt động'
                      : statusFilter === 'inactive'
                        ? 'Chưa có kế hoạch tạm dừng'
                        : 'Chưa có yêu cầu cây trồng'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {searchTerm || stageFilter !== 'all'
                      ? 'Không có yêu cầu phù hợp với điều kiện lọc hiện tại.'
                    : statusFilter === 'active'
                      ? 'Hãy tạo kế hoạch cây trồng mới hoặc kích hoạt các kế hoạch đã tạm dừng.'
                      : statusFilter === 'inactive'
                        ? 'Hãy tạm dừng một số kế hoạch để thấy chúng ở đây.'
                        : 'Hãy tạo yêu cầu cây trồng đầu tiên.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Grouped Card Layout - Grouped by Crop Name */}
              <div className="space-y-6">
                {groupedRequirements.map(([cropName, items]) => {
                  return (
                    <div key={cropName} className="space-y-3">
                      {/* Section Header */}
                      <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">{cropName}</h3>
                          </div>

                      {/* Cards Grid for this Crop */}
                      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {items.map((req) => {
                          const isNewlyCreated = req.cropRequirementId ? newlyCreatedIds.has(req.cropRequirementId) : false
                          return (
                            <Card
                              key={`${req.cropId}-${req.cropRequirementId ?? 'na'}`}
                              className={cn(
                                "hover:shadow-md transition-all cursor-pointer",
                                isNewlyCreated && "ring-2 ring-green-500 bg-green-50/50 shadow-lg"
                              )}
                              onClick={() => {
                                if (req.cropRequirementId) {
                                  openDetail(req)
                                } else {
                                  openCreateDialog(req)
                                }
                              }}
                            >
                              <CardContent className="p-4">
                                {/* Stage & Status - Primary Information (Crop name đã ở header) */}
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge className="h-6 items-center whitespace-nowrap text-xs" variant="outline">
                              {stageLabel(req.plantStage)}
                            </Badge>
                            {getStatusBadge(req.isActive)}
                                      {isNewlyCreated && (
                                        <Badge className="h-6 items-center whitespace-nowrap text-xs bg-green-500 text-white">
                                          Mới
                                        </Badge>
                                      )}
                          </div>
                                  </div>
                            {req.cropRequirementId ? (
                                    <div onClick={(e) => e.stopPropagation()}>
                              <RequirementActionMenu
                                requirement={req}
                                isUpdatingStatus={statusUpdatingId === req.cropRequirementId}
                                onToggleStatus={handleToggleRequirementStatus}
                                onEdit={openEditRequirement}
                                onView={openDetail}
                              />
                                    </div>
                            ) : (
                              <DropdownMenu modal={false}>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
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
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      openCreateDialog(req)
                                    }}
                                    className="cursor-pointer focus:bg-gray-100"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    Tạo yêu cầu
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                        </div>
                    </div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Chi tiết yêu cầu cây trồng</DialogTitle>
          </DialogHeader>

          {detailRequirement && (
            <div className="space-y-6">
              {/* Cluster 1: Basic Crop Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin cây trồng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                      <Label className="text-sm font-medium text-gray-700">Tên cây trồng</Label>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {detailRequirement.cropName}
                  </p>
                    </div>
                  {detailCrop?.origin && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Xuất xứ</Label>
                        <p className="mt-1 text-sm text-gray-800">{detailCrop.origin}</p>
                      </div>
                  )}
                  </div>
                  {detailCrop?.description && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Mô tả</Label>
                      <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {detailCrop.description}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <div>
                      <Label className="text-xs text-gray-500">Trạng thái cây trồng</Label>
                    <div className="mt-1">
                        {detailCrop?.status && (
                      <Badge variant={detailCrop.status.toUpperCase() === 'ACTIVE' ? 'success' : 'destructive'}>
                        {detailCrop.status.toUpperCase() === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                  )}
                </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cluster 2: Growth Stage & Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Giai đoạn phát triển</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                <div>
                      <Label className="text-sm font-medium text-gray-700">Giai đoạn hiện tại</Label>
                      <div className="mt-2">
                        <Badge className="h-8 px-3 text-sm" variant="outline">
                      {stageLabel(detailRequirement.plantStage)}
                    </Badge>
                  </div>
                </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Trạng thái kế hoạch</Label>
                      <div className="mt-2">
                        {getStatusBadge(detailRequirement.isActive)}
              </div>
                    </div>
                    {detailRequirement.estimatedDate && (
                <div>
                        <Label className="text-sm font-medium text-gray-700">Thời gian dự kiến</Label>
                        <p className="mt-2 text-sm font-semibold text-gray-900">
                          {detailRequirement.estimatedDate} ngày
                        </p>
                </div>
              )}
                  </div>
                </CardContent>
              </Card>

              {/* Cluster 3: Environmental Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Yêu cầu môi trường</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Label className="text-xs text-gray-500">Độ ẩm</Label>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">
                        {formatNumber(detailRequirement.moisture, '%')}
                      </p>
                  </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Label className="text-xs text-gray-500">Nhiệt độ</Label>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">
                        {formatNumber(detailRequirement.temperature, '°C')}
                      </p>
                </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Label className="text-xs text-gray-500">Ánh sáng</Label>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">
                        {formatNumber(detailRequirement.lightRequirement, 'lux')}
                      </p>
                  </div>
                </div>
                </CardContent>
              </Card>

              {/* Cluster 4: Care & Maintenance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chăm sóc & Bảo dưỡng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {detailRequirement.wateringFrequency && (
                <div>
                        <Label className="text-sm font-medium text-gray-700">Tần suất tưới</Label>
                        <p className="mt-1 text-sm text-gray-800">{detailRequirement.wateringFrequency} lần/ngày</p>
                </div>
                    )}
                    {detailRequirement.fertilizer && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Phân bón</Label>
                        <p className="mt-1 text-sm text-gray-800">{detailRequirement.fertilizer}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cluster 5: Additional Notes */}
              {detailRequirement.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ghi chú & Lưu ý</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {detailRequirement.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </ManagerLayout>
  )
}
