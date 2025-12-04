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
  Droplets,
  Sun,
  Thermometer,
  MoreHorizontal,
} from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import {
  StaffDataTable,
  type StaffDataTableColumn,
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
import { cropService, type Crop } from '@/shared/api/cropService'

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

const PLANT_STAGE_OPTIONS: { value: PlantStage; label: string; description: string }[] = [
  { value: 'Sowing', label: 'Gieo hạt', description: 'Chuẩn bị đất và gieo giống' },
  { value: 'Germination', label: 'Nảy mầm', description: 'Theo dõi độ ẩm đất' },
  { value: 'CotyledonLeaves', label: 'Ra lá mầm', description: 'Bắt đầu bổ sung dinh dưỡng' },
  { value: 'TrueLeavesGrowth', label: 'Phát triển lá thật', description: 'Tăng cường ánh sáng' },
  { value: 'VigorousGrowth', label: 'Tăng trưởng mạnh', description: 'Theo dõi độ ẩm/ánh sáng' },
  { value: 'ReadyForHarvest', label: 'Sẵn sàng thu hoạch', description: 'Kiểm tra chất lượng' },
  { value: 'PostHarvest', label: 'Sau thu hoạch', description: 'Chuẩn bị vụ mới' },
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

// Component riêng cho Action Menu
interface RequirementActionMenuProps {
  requirement: CropRequirementView
  onView: (requirement: CropRequirementView) => void
  onEdit: (requirement: CropRequirementView) => void
  onDelete: (requirement: CropRequirementView) => void
}

const RequirementActionMenu: React.FC<RequirementActionMenuProps> = React.memo(
  ({ requirement, onView, onEdit, onDelete }) => {
    const [open, setOpen] = useState(false)

    const handleView = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        setTimeout(() => {
          onView(requirement)
        }, 0)
      },
      [requirement, onView]
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
            onClick={handleEdit}
            className="cursor-pointer focus:bg-gray-100"
            onSelect={(e) => e.preventDefault()}
          >
            Chỉnh sửa
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            className="cursor-pointer focus:bg-gray-100 text-red-600 focus:text-red-600"
            onSelect={(e) => e.preventDefault()}
          >
            Xóa
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
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formData, setFormData] = useState<RequirementFormState>(INITIAL_FORM_STATE)
  const [selectedRequirement, setSelectedRequirement] = useState<CropRequirementView | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableCrops, setAvailableCrops] = useState<Crop[]>([])
  const [loadingCrops, setLoadingCrops] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedRequirementForDetails, setSelectedRequirementForDetails] =
    useState<CropRequirementView | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRequirementForDelete, setSelectedRequirementForDelete] =
    useState<CropRequirementView | null>(null)

  const { toast } = useToast()

  // Helper function to check if crop is active (handles all case variations)
  const isActiveStatus = (status: string | undefined | null): boolean => {
    if (!status) return false
    const normalized = status.toUpperCase()
    return normalized === 'ACTIVE'
  }

  // Merge cropName and cropStatus from availableCrops into requirements based on cropId
  const requirementsWithCropName = useMemo(() => {
    if (!availableCrops.length) return requirements

    // Create maps for quick lookup
    const cropMap = new Map<number, { name: string; status: string }>()
    availableCrops.forEach(crop => {
      cropMap.set(crop.cropId, { name: crop.cropName, status: crop.status || '' })
    })

    // Merge cropName and use crop status to determine isActive
    return requirements.map(requirement => {
      const cropInfo = cropMap.get(requirement.cropId)
      const cropStatus = cropInfo?.status || ''
      // Use crop status if available, otherwise fall back to requirement.isActive
      const effectiveIsActive = cropInfo ? isActiveStatus(cropStatus) : requirement.isActive

      return {
        ...requirement,
        cropName: requirement.cropName || cropInfo?.name || null,
        isActive: effectiveIsActive,
      }
    })
  }, [requirements, availableCrops])

  const filteredRequirements = useMemo(() => {
    return requirementsWithCropName.filter(item => {
      const matchesSearch =
        !searchTerm ||
        item.cropName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? item.isActive : !item.isActive)

      const matchesStage = stageFilter === 'all' || item.plantStage === stageFilter

      return matchesSearch && matchesStatus && matchesStage
    })
  }, [requirementsWithCropName, searchTerm, statusFilter, stageFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRequirements.length / pageSize))

  const paginatedRequirements = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRequirements.slice(start, start + pageSize)
  }, [filteredRequirements, currentPage])

  const stats = useMemo(() => {
    const total = requirementsWithCropName.length
    const active = requirementsWithCropName.filter(item => item.isActive).length
    const average = (key: keyof CropRequirementView) => {
      const values = requirementsWithCropName
        .map(item => item[key] as number | null | undefined)
        .filter((value): value is number => typeof value === 'number')
      if (!values.length) return null
      return values.reduce((sum, value) => sum + value, 0) / values.length
    }
    const stageDistribution = PLANT_STAGE_OPTIONS.map(option => {
      const count = requirementsWithCropName.filter(item => item.plantStage === option.value).length
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
  }, [requirementsWithCropName])

  const handleResetForm = () => {
    setFormData(INITIAL_FORM_STATE)
    setSelectedRequirement(null)
  }

  const populateForm = (requirement: CropRequirementView) => {
    setFormData({
      cropId: requirement.cropId,
      plantStage: (requirement.plantStage as PlantStage) || '',
      estimatedDate: requirement.estimatedDate?.toString() ?? '',
      moisture: requirement.moisture?.toString() ?? '',
      temperature: requirement.temperature?.toString() ?? '',
      fertilizer: requirement.fertilizer ?? '',
      lightRequirement: requirement.lightRequirement?.toString() ?? '',
      wateringFrequency: requirement.wateringFrequency ?? '',
      notes: requirement.notes ?? '',
    })
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

  const openEditDialog = (requirement: CropRequirementView) => {
    setSelectedRequirement(requirement)
    populateForm(requirement)
    setFormMode('edit')
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
        // For edit mode, use the cropId from the selected requirement implicitly
        await cropRequirementService.update(
          selectedRequirement.cropRequirementId,
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

  const openDeleteDialog = useCallback((requirement: CropRequirementView) => {
    setSelectedRequirementForDelete(requirement)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDeleteRequirement = async () => {
    if (!selectedRequirementForDelete) return

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

  const openDetailsDialog = (requirement: CropRequirementView) => {
    setSelectedRequirementForDetails(requirement)
    setDetailsDialogOpen(true)
  }

  const handleRefresh = async () => {
    await Promise.all([loadRequirements(), loadAvailableCrops()])
  }

  useEffect(() => {
    loadRequirements()
    loadAvailableCrops()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
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
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Theo dõi giai đoạn</h3>
              <div className="space-y-3">
                {stats.stageDistribution.map(stage => (
                  <div key={stage.value}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{stage.label}</span>
                      <span className="text-gray-500">{stage.count} ({stage.percent}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${stage.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                  <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <StaffDataTable<CropRequirementView>
                  className="px-4 sm:px-6 pb-6"
                  data={paginatedRequirements}
                  getRowKey={(requirement) => requirement.cropRequirementId}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  emptyTitle="Không tìm thấy yêu cầu nào"
                  emptyDescription={
                    searchTerm || statusFilter !== 'all' || stageFilter !== 'all'
                      ? 'Không có yêu cầu nào phù hợp với điều kiện lọc hiện tại.'
                      : 'Hãy tạo yêu cầu cây trồng đầu tiên.'
                  }
                  columns={[
                    {
                      id: 'cropAndStage',
                      header: 'Cây trồng & giai đoạn',
                      render: (requirement) => (
                        <div>
                          <p className="font-semibold">{requirement.cropName ?? 'Không xác định'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={requirement.isActive ? 'default' : 'secondary'}>
                              {requirement.isActive ? 'Hoạt động' : 'Tạm dừng'}
                            </Badge>
                            <Badge variant="outline">{stageLabel(requirement.plantStage)}</Badge>
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: 'estimatedDate',
                      header: 'Thời gian dự kiến',
                      render: (requirement) => (
                        <p className="font-medium">
                          {requirement.estimatedDate ? `${requirement.estimatedDate} ngày` : 'Chưa đặt'}
                        </p>
                      ),
                    },
                    {
                      id: 'actions',
                      header: '',
                      render: (requirement) => (
                        <RequirementActionMenu
                          requirement={requirement}
                          onView={openDetailsDialog}
                          onEdit={openEditDialog}
                          onDelete={openDeleteDialog}
                        />
                      ),
                    },
                  ] satisfies StaffDataTableColumn<CropRequirementView>[]}
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

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết chỉ số môi trường</DialogTitle>
          </DialogHeader>

          {selectedRequirementForDetails && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Cây trồng</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedRequirementForDetails.cropName ?? 'Không xác định'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Giai đoạn</h3>
                  <Badge variant="outline" className="text-base">
                    {stageLabel(selectedRequirementForDetails.plantStage)}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chỉ số môi trường</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                            <Droplets className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Độ ẩm</p>
                            <p className="text-xl font-semibold text-gray-900">
                              {formatNumber(selectedRequirementForDetails.moisture, '%')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-yellow-100 p-2 text-yellow-600">
                            <Sun className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Ánh sáng</p>
                            <p className="text-xl font-semibold text-gray-900">
                              {formatNumber(selectedRequirementForDetails.lightRequirement, 'lux')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-orange-100 p-2 text-orange-600">
                            <Thermometer className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Nhiệt độ</p>
                            <p className="text-xl font-semibold text-gray-900">
                              {formatNumber(selectedRequirementForDetails.temperature, '°C')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-green-100 p-2 text-green-600">
                            <Droplets className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Tần suất tưới</p>
                            <p className="text-xl font-semibold text-gray-900">
                              {selectedRequirementForDetails.wateringFrequency || 'Chưa đặt'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin bổ sung</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Thời gian dự kiến</h4>
                    <p className="text-gray-900">
                      {selectedRequirementForDetails.estimatedDate
                        ? `${selectedRequirementForDetails.estimatedDate} ngày`
                        : 'Chưa đặt'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Phân bón</h4>
                    <p className="text-gray-900">
                      {selectedRequirementForDetails.fertilizer || 'Chưa đặt'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Trạng thái</h4>
                    <Badge variant={selectedRequirementForDetails.isActive ? 'default' : 'secondary'}>
                      {selectedRequirementForDetails.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Cập nhật lần cuối</h4>
                    <p className="text-gray-900">
                      {selectedRequirementForDetails.updatedDate || selectedRequirementForDetails.createdDate || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedRequirementForDetails.notes && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ghi chú</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedRequirementForDetails.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa yêu cầu cây trồng</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa yêu cầu cho "{selectedRequirementForDelete?.cropName ?? 'cây trồng'}" - {selectedRequirementForDelete ? stageLabel(selectedRequirementForDelete.plantStage) : ''}? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedRequirementForDelete(null)
              }}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteRequirement}>
              Xóa yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  )
}
