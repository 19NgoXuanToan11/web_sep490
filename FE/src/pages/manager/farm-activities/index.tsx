import { useState, useEffect, useCallback } from 'react'
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
import { Plus, Edit, RefreshCw, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import {
  farmActivityService,
  type FarmActivity,
  type FarmActivityRequest,
  type FarmActivityUpdate,
} from '@/shared/api/farmActivityService'

export default function FarmActivitiesPage() {
  const [activities, setActivities] = useState<FarmActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')

  // Pagination state
  const [pageIndex, setPageIndex] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<FarmActivity | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedActivityForDetails, setSelectedActivityForDetails] = useState<FarmActivity | null>(
    null
  )

  const [formData, setFormData] = useState<FarmActivityRequest>({
    startDate: '',
    endDate: '',
  })
  const [formActivityType, setFormActivityType] = useState<string>('')
  const [formStatus, setFormStatus] = useState<string>('ACTIVE')
  const [dateErrors, setDateErrors] = useState<{ startDate?: string; endDate?: string }>({})

  const { toast } = useToast()

  const [activityStats, setActivityStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
  })

  // Get today's date in YYYY-MM-DD format for date input min attribute
  const getTodayDateString = (): string => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const todayDateString = getTodayDateString()

  // Enum ActivityType từ backend (C#):
  // 0: Sowing, 1: Protection, 2: Irrigation, 3: Fertilization, 4: Harvesting
  // Frontend sẽ dùng trực tiếp giá trị 0–4 (string) cho dropdown "Loại hoạt động"
  const activityTypes = [
    { value: '0', label: 'Gieo hạt' },
    { value: '1', label: 'Trừ sâu bệnh' },
    { value: '2', label: 'Tưới tiêu' },
    { value: '3', label: 'Bón phân' },
    { value: '4', label: 'Thu hoạch' },
  ]

  const normalizeBackendActivityType = (backendType: any): string => {
    if (backendType === null || backendType === undefined) return ''

    if (typeof backendType === 'number') {
      return String(backendType)
    }

    const raw = String(backendType)

    const numValue = parseInt(raw, 10)
    if (!isNaN(numValue)) {
      return String(numValue)
    }

    const nameToEnum: Record<string, string> = {
      Sowing: '0',
      Protection: '1',
      Irrigation: '2',
      Fertilization: '3',
      Harvesting: '4',
    }

    return nameToEnum[raw] ?? ''
  }

  const statusOptions = [
    { value: 'ACTIVE', label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
    { value: 'COMPLETED', label: 'Hoàn thành', color: 'bg-blue-100 text-blue-800' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
    { value: 'PENDING', label: 'Chờ thực hiện', color: 'bg-yellow-100 text-yellow-800' },
  ]

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = {
        pageIndex,
        pageSize,
      }
      if (activityTypeFilter !== 'all') {
        params.type = activityTypeFilter
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      const response = await farmActivityService.getAllFarmActivities(params)

      const normalizedActivities = Array.isArray(response.items)
        ? response.items.map(activity => ({
          ...activity,
          activityType: normalizeBackendActivityType(activity.activityType),
        }))
        : []
      setActivities(normalizedActivities)
      setTotalPages(response.totalPagesCount || 1)
    } catch (error: any) {
      setActivities([])
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể tải danh sách hoạt động nông trại',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, statusFilter, activityTypeFilter, toast])

  const loadActivityStats = useCallback(async () => {
    try {
      const response = await farmActivityService.getAllFarmActivities({
        pageIndex: 1,
        pageSize: 1000,
      })

      const items = Array.isArray(response.items) ? response.items : []

      const stats = items.reduce(
        (acc, activity) => {
          const status = (activity.status || '').toUpperCase()
          acc.total += 1
          if (status === 'ACTIVE') acc.active += 1
          else if (status === 'COMPLETED') acc.completed += 1
          else if (status === 'CANCELLED') acc.cancelled += 1
          else acc.pending += 1
          return acc
        },
        {
          total: 0,
          active: 0,
          completed: 0,
          pending: 0,
          cancelled: 0,
        }
      )

      setActivityStats({
        ...stats,
        total: response.totalItemCount || stats.total,
      })
    } catch {
    }
  }, [])

  const filteredActivities = (Array.isArray(activities) ? activities : []).filter(activity => {
    if (!activity || typeof activity !== 'object') return false
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return true
    const rawType = (activity.activityType || '').toLowerCase()
    const localizedType = getActivityTypeLabel(activity.activityType).toLowerCase()
    return rawType.includes(normalizedSearch) || localizedType.includes(normalizedSearch)
  })

  const handleCreateActivity = async () => {
    try {
      setDateErrors({})

      if (!formActivityType || !formData.startDate || !formData.endDate) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
          variant: 'destructive',
        })
        return
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startDate = new Date(formData.startDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(formData.endDate)
      endDate.setHours(0, 0, 0, 0)

      if (startDate < today) {
        setDateErrors({ startDate: 'Ngày bắt đầu không thể trước ngày hiện tại' })
        toast({
          title: 'Lỗi',
          description: 'Ngày bắt đầu không thể trước ngày hiện tại',
          variant: 'destructive',
        })
        return
      }

      if (endDate < today) {
        setDateErrors({ endDate: 'Ngày kết thúc không thể trước ngày hiện tại' })
        toast({
          title: 'Lỗi',
          description: 'Ngày kết thúc không thể trước ngày hiện tại',
          variant: 'destructive',
        })
        return
      }

      if (startDate > endDate) {
        setDateErrors({ startDate: 'Ngày bắt đầu không thể sau ngày kết thúc' })
        toast({
          title: 'Lỗi',
          description: 'Ngày bắt đầu không thể sau ngày kết thúc',
          variant: 'destructive',
        })
        return
      }

      await farmActivityService.createFarmActivity(formData, formActivityType)
      toast({
        title: 'Thành công',
        description: 'Đã tạo hoạt động nông trại mới',
      })

      setCreateDialogOpen(false)
      resetForm()
      loadActivities()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể tạo hoạt động nông trại mới',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateActivity = async () => {
    if (!editingActivity) return

    try {
      setDateErrors({})

      if (!formActivityType || !formData.startDate || !formData.endDate) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
          variant: 'destructive',
        })
        return
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startDate = new Date(formData.startDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(formData.endDate)
      endDate.setHours(0, 0, 0, 0)

      if (startDate < today) {
        setDateErrors({ startDate: 'Ngày bắt đầu không thể trước ngày hiện tại' })
        toast({
          title: 'Lỗi',
          description: 'Ngày bắt đầu không thể trước ngày hiện tại',
          variant: 'destructive',
        })
        return
      }

      if (endDate < today) {
        setDateErrors({ endDate: 'Ngày kết thúc không thể trước ngày hiện tại' })
        toast({
          title: 'Lỗi',
          description: 'Ngày kết thúc không thể trước ngày hiện tại',
          variant: 'destructive',
        })
        return
      }

      if (startDate > endDate) {
        setDateErrors({ startDate: 'Ngày bắt đầu không thể sau ngày kết thúc' })
        toast({
          title: 'Lỗi',
          description: 'Ngày bắt đầu không thể sau ngày kết thúc',
          variant: 'destructive',
        })
        return
      }

      const updateData: FarmActivityUpdate = {
        startDate: formData.startDate,
        endDate: formData.endDate,
      }

      await farmActivityService.updateFarmActivity(
        editingActivity.farmActivitiesId,
        updateData,
        formActivityType,
        formStatus,
      )
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin hoạt động nông trại',
      })

      setEditDialogOpen(false)
      setEditingActivity(null)
      resetForm()
      loadActivities()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể cập nhật hoạt động nông trại',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      startDate: '',
      endDate: '',
    })
    setFormActivityType('')
    setFormStatus('ACTIVE')
    setDateErrors({})
  }

  const handleEditClick = async (activity: FarmActivity) => {
    try {
      setLoading(true)
      const fullActivity = await farmActivityService.getFarmActivityById(activity.farmActivitiesId)
      setEditingActivity(fullActivity)

      const startDate =
        formatDateForInput(fullActivity.startDate) || formatDateForInput(activity.startDate)
      const endDate =
        formatDateForInput(fullActivity.endDate) || formatDateForInput(activity.endDate)

      setFormData({
        startDate,
        endDate,
      })
      setFormActivityType(
        normalizeBackendActivityType(fullActivity.activityType || activity.activityType),
      )
      setFormStatus(fullActivity.status || activity.status)
      setEditDialogOpen(true)
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể tải thông tin chi tiết hoạt động',
        variant: 'destructive',
      })
      setEditingActivity(activity)

      const startDate = formatDateForInput(activity.startDate)
      const endDate = formatDateForInput(activity.endDate)

      setFormData({
        startDate,
        endDate,
      })
      setFormActivityType(normalizeBackendActivityType(activity.activityType))
      setFormStatus(activity.status)
      setEditDialogOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const getActivityTypeLabel = (type: string) => {
    const activityType = activityTypes.find(at => at.value === type)
    return activityType ? activityType.label : type
  }

  const getPlantStageLabel = (stage: string | null | undefined) => {
    if (!stage) return 'Không có dữ liệu'
    switch (stage) {
      case 'Sowing':
        return 'Gieo hạt'
      case 'Germination':
        return 'Nảy mầm'
      case 'CotyledonLeaves':
        return 'Ra lá mầm'
      case 'TrueLeavesGrowth':
        return 'Phát triển lá thật'
      case 'VigorousGrowth':
        return 'Tăng trưởng mạnh'
      case 'ReadyForHarvest':
        return 'Sẵn sàng thu hoạch'
      case 'PostHarvest':
        return 'Sau thu hoạch'
      default:
        return stage
    }
  }

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status)
    if (!statusOption) return <Badge variant="outline">{status}</Badge>

    return <Badge className={statusOption.color}>{statusOption.label}</Badge>
  }

  const formatDisplayDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Không có dữ liệu'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleDateString('vi-VN')
    } catch {
      return dateString
    }
  }

  const formatDateForInput = (dateString: string | undefined | null): string => {
    if (!dateString) return ''
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString
    if (dateString.includes('T')) return dateString.split('T')[0]
    return dateString
  }

  const handleViewDetailsClick = (activity: FarmActivity) => {
    setSelectedActivityForDetails(activity)
    setDetailsDialogOpen(true)
  }

  useEffect(() => {
    setPageIndex(1)
  }, [statusFilter, activityTypeFilter])

  useEffect(() => {
    loadActivities()
    loadActivityStats()
  }, [loadActivities, loadActivityStats])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPageIndex(newPage)
    }
  }

  return (
    <ManagerLayout>
      <div className="p-6">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Hoạt Động Nông Trại</h1>
            <p className="text-gray-600 mt-2">
              Quản lý các hoạt động nông nghiệp, lập kế hoạch và theo dõi tiến độ thực hiện.
            </p>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng hoạt động</p>
                    <p className="text-2xl font-semibold mt-1">{activityStats.total}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Toàn bộ hoạt động nông trại trong hệ thống (không phụ thuộc bộ lọc)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Đang hoạt động</p>
                    <p className="text-2xl font-semibold mt-1 text-green-600">
                      {activityStats.active + activityStats.pending}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Bao gồm hoạt động đang chạy và chờ thực hiện
                </p>
              </CardContent>
            </Card>

            {/* Removed “Hoàn thành” & “Đã hủy” cards per request */}
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    id="search"
                    placeholder="Nhập loại hoạt động..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả loại</SelectItem>
                      {activityTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 items-end">
                  <Button onClick={loadActivities} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm mới
                  </Button>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm hoạt động
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          { }
          <div className="border rounded-lg bg-white mt-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">STT</TableHead>
                  <TableHead>Loại hoạt động</TableHead>
                  <TableHead>Giai đoạn cây trồng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Không có hoạt động nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity, index) => (
                    <TableRow key={activity.farmActivitiesId}>
                      <TableCell className="text-center">
                        {(pageIndex - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>{getActivityTypeLabel(activity.activityType)}</TableCell>
                      <TableCell>{getPlantStageLabel(activity.plantStage as any)}</TableCell>
                      <TableCell>{getStatusBadge(activity.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetailsClick(activity)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(activity)}
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-end gap-4 mt-4 px-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pageIndex - 1)}
                  disabled={pageIndex === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pageIndex <= 3) {
                      pageNum = i + 1
                    } else if (pageIndex >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = pageIndex - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageIndex === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pageIndex + 1)}
                  disabled={pageIndex === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Số lượng mỗi trang:</Label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={value => {
                    setPageSize(Number(value))
                    setPageIndex(1)
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      { }
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi Tiết Hoạt Động Nông Trại</DialogTitle>
            <DialogDescription>Thông tin chi tiết của hoạt động nông trại đã chọn</DialogDescription>
          </DialogHeader>

          {selectedActivityForDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Loại hoạt động</Label>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {getActivityTypeLabel(selectedActivityForDetails.activityType)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Giai đoạn cây trồng</Label>
                  <p className="mt-1 text-base text-gray-900">
                    {getPlantStageLabel(selectedActivityForDetails.plantStage as any)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Ngày bắt đầu</Label>
                  <p className="mt-1 text-base text-gray-900">
                    {formatDisplayDate(selectedActivityForDetails.startDate)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Ngày kết thúc</Label>
                  <p className="mt-1 text-base text-gray-900">
                    {formatDisplayDate(selectedActivityForDetails.endDate)}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Trạng thái</Label>
                <div className="mt-1">{getStatusBadge(selectedActivityForDetails.status)}</div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { }
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm Hoạt Động Nông Trại Mới</DialogTitle>
            <DialogDescription>Điền thông tin để tạo hoạt động nông trại mới</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="activityType">Loại hoạt động *</Label>
              <Select value={formActivityType} onValueChange={setFormActivityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại hoạt động" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Ngày bắt đầu *</Label>
              <Input
                id="startDate"
                type="date"
                min={todayDateString}
                value={formData.startDate}
                onChange={e => {
                  setFormData({ ...formData, startDate: e.target.value })
                  // Clear error when user changes the date
                  if (dateErrors.startDate) {
                    setDateErrors({ ...dateErrors, startDate: undefined })
                  }
                }}
                className={dateErrors.startDate ? 'border-red-500' : ''}
              />
              {dateErrors.startDate && (
                <p className="text-sm text-red-600 mt-1">{dateErrors.startDate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="endDate">Ngày kết thúc *</Label>
              <Input
                id="endDate"
                type="date"
                min={todayDateString}
                value={formData.endDate}
                onChange={e => {
                  setFormData({ ...formData, endDate: e.target.value })
                  // Clear error when user changes the date
                  if (dateErrors.endDate) {
                    setDateErrors({ ...dateErrors, endDate: undefined })
                  }
                }}
                className={dateErrors.endDate ? 'border-red-500' : ''}
              />
              {dateErrors.endDate && (
                <p className="text-sm text-red-600 mt-1">{dateErrors.endDate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateActivity}>Tạo hoạt động</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { }
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Hoạt Động Nông Trại</DialogTitle>
            <DialogDescription>Cập nhật thông tin hoạt động nông trại</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editActivityType">Loại hoạt động *</Label>
              <Select value={formActivityType} onValueChange={setFormActivityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại hoạt động" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editStartDate">Ngày bắt đầu *</Label>
              <Input
                id="editStartDate"
                type="date"
                min={todayDateString}
                value={formData.startDate}
                onChange={e => {
                  setFormData({ ...formData, startDate: e.target.value })
                  // Clear error when user changes the date
                  if (dateErrors.startDate) {
                    setDateErrors({ ...dateErrors, startDate: undefined })
                  }
                }}
                className={dateErrors.startDate ? 'border-red-500' : ''}
              />
              {dateErrors.startDate && (
                <p className="text-sm text-red-600 mt-1">{dateErrors.startDate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="editEndDate">Ngày kết thúc *</Label>
              <Input
                id="editEndDate"
                type="date"
                min={todayDateString}
                value={formData.endDate}
                onChange={e => {
                  setFormData({ ...formData, endDate: e.target.value })
                  // Clear error when user changes the date
                  if (dateErrors.endDate) {
                    setDateErrors({ ...dateErrors, endDate: undefined })
                  }
                }}
                className={dateErrors.endDate ? 'border-red-500' : ''}
              />
              {dateErrors.endDate && (
                <p className="text-sm text-red-600 mt-1">{dateErrors.endDate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="editStatus">Trạng thái</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateActivity}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  )
}
