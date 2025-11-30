import { useState, useEffect, useMemo } from 'react'
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
  Trash2,
  Search,
  RefreshCw,
  BarChart2,
  Droplets,
  Sun,
  Thermometer,
  Copy,
} from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
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

  const { toast } = useToast()

  const filteredRequirements = useMemo(() => {
    return requirements.filter(item => {
      const matchesSearch =
        !searchTerm ||
        item.cropName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? item.isActive : !item.isActive)

      const matchesStage = stageFilter === 'all' || item.plantStage === stageFilter

      return matchesSearch && matchesStatus && matchesStage
    })
  }, [requirements, searchTerm, statusFilter, stageFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRequirements.length / pageSize))

  const paginatedRequirements = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRequirements.slice(start, start + pageSize)
  }, [filteredRequirements, currentPage])

  const stats = useMemo(() => {
    const total = requirements.length
    const active = requirements.filter(item => item.isActive).length
    const average = (key: keyof CropRequirementView) => {
      const values = requirements
        .map(item => item[key] as number | null | undefined)
        .filter((value): value is number => typeof value === 'number')
      if (!values.length) return null
      return values.reduce((sum, value) => sum + value, 0) / values.length
    }
    const stageDistribution = PLANT_STAGE_OPTIONS.map(option => {
      const count = requirements.filter(item => item.plantStage === option.value).length
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
  }, [requirements])

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
      const crops = await cropService.getAllCropsActive()
      setAvailableCrops(Array.isArray(crops) ? crops : [])
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

  const handleToggleStatus = async (requirementId: number) => {
    try {
      await cropRequirementService.updateStatus(requirementId)
      toast({ title: 'Đã cập nhật', description: 'Trạng thái cây trồng đã được thay đổi' })
      loadRequirements()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể thay đổi trạng thái',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteRequirement = async (requirementId: number) => {
    const confirmDelete = window.confirm('Bạn có chắc muốn xoá yêu cầu này?')
    if (!confirmDelete) return
    try {
      await cropRequirementService.remove(requirementId)
      toast({ title: 'Đã xoá', description: 'Yêu cầu cây trồng đã bị xoá' })
      loadRequirements()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xoá yêu cầu cây trồng',
        variant: 'destructive',
      })
    }
  }

  const handleDuplicateRequirement = async (requirement: CropRequirementView) => {
    try {
      const stage = (requirement.plantStage as PlantStage) || 'Sowing'
      await cropRequirementService.duplicate(requirement.cropRequirementId, requirement.cropId, stage)
      toast({ title: 'Đã nhân bản', description: 'Đã tạo bản sao yêu cầu cây trồng' })
      loadRequirements()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể nhân bản yêu cầu cây trồng',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadRequirements()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, stageFilter])

  return (
    <ManagerLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Cây Trồng</h1>
          <p className="text-gray-600 mt-2">
            Lập kế hoạch gieo trồng, theo dõi chỉ số môi trường và giai đoạn phát triển cho từng vụ mùa.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tổng kế hoạch</p>
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
                  <p className="text-sm text-gray-500">Độ ẩm trung bình</p>
                  <p className="text-2xl font-semibold mt-1">{formatNumber(stats.moisture, '%')}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                  <Droplets className="h-5 w-5" />
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
                <div className="rounded-full bg-yellow-100 p-3 text-yellow-600">
                  <Sun className="h-5 w-5" />
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
                <div className="rounded-full bg-orange-100 p-3 text-orange-600">
                  <Thermometer className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Cảnh báo sớm khi nhiệt độ vượt ngưỡng</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-600">Tìm kiếm</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nhập tên cây trồng hoặc ghi chú..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
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
              <div className="w-full md:w-56">
                <Label className="text-sm font-medium text-gray-600">Giai đoạn</Label>
                <Select value={stageFilter} onValueChange={value => setStageFilter(value as typeof stageFilter)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tất cả giai đoạn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả giai đoạn</SelectItem>
                    {PLANT_STAGE_OPTIONS.map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={loadRequirements}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Làm mới
                </Button>
                <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm kế hoạch
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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

        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">STT</TableHead>
                <TableHead>Cây trồng & giai đoạn</TableHead>
                <TableHead>Thời gian dự kiến</TableHead>
                <TableHead>Chỉ số môi trường</TableHead>
                <TableHead>Ghi chú</TableHead>
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
              ) : paginatedRequirements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Không tìm thấy yêu cầu nào phù hợp
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequirements.map((requirement, index) => (
                  <TableRow key={requirement.cropRequirementId}>
                    <TableCell className="text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">{requirement.cropName ?? 'Không xác định'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={requirement.isActive ? 'default' : 'secondary'}>
                          {requirement.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                        <Badge variant="outline">{stageLabel(requirement.plantStage)}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {requirement.estimatedDate ? `${requirement.estimatedDate} ngày` : 'Chưa đặt'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Cập nhật {requirement.updatedDate || requirement.createdDate}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div>Độ ẩm: {formatNumber(requirement.moisture, '%')}</div>
                        <div>Ánh sáng: {formatNumber(requirement.lightRequirement, 'lux')}</div>
                        <div>Nhiệt độ: {formatNumber(requirement.temperature, '°C')}</div>
                        <div>Tưới: {requirement.wateringFrequency || 'Chưa đặt'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {requirement.notes || '—'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(requirement)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(requirement.cropRequirementId)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateRequirement(requirement)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRequirement(requirement.cropRequirementId)}
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

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
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

      <Dialog open={formDialogOpen} onOpenChange={open => {
        setFormDialogOpen(open)
        if (!open) handleResetForm()
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Thêm yêu cầu cây trồng' : 'Cập nhật yêu cầu cây trồng'}
            </DialogTitle>
            <DialogDescription>
              Thiết lập chỉ số môi trường, thời gian dự kiến và ghi chú cho từng giai đoạn.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Thời gian ước tính (ngày)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.estimatedDate}
                  onChange={e => setFormData(prev => ({ ...prev, estimatedDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Độ ẩm (%)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.moisture}
                  onChange={e => setFormData(prev => ({ ...prev, moisture: e.target.value }))}
                />
              </div>
              <div>
                <Label>Nhiệt độ (°C)</Label>
                <Input
                  type="number"
                  value={formData.temperature}
                  onChange={e => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                />
              </div>
              <div>
                <Label>Cường độ ánh sáng (lux)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.lightRequirement}
                  onChange={e => setFormData(prev => ({ ...prev, lightRequirement: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Phân bón</Label>
                <Input
                  value={formData.fertilizer}
                  onChange={e => setFormData(prev => ({ ...prev, fertilizer: e.target.value }))}
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
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleSubmitForm} disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  )
}
