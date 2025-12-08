import React, { useState, useEffect, useCallback } from 'react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { RefreshCw, Search, MoreHorizontal } from 'lucide-react'
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
  farmActivityService,
  type FarmActivity,
  type FarmActivityRequest,
  type FarmActivityUpdate,
} from '@/shared/api/farmActivityService'

// Component riêng cho Action Menu
interface ActivityActionMenuProps {
  activity: FarmActivity
  onView: (activity: FarmActivity) => void
  onEdit: (activity: FarmActivity) => void
}

const ActivityActionMenu: React.FC<ActivityActionMenuProps> = React.memo(({ activity, onView, onEdit }) => {
  const [open, setOpen] = useState(false)

  const handleView = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      setTimeout(() => {
        onView(activity)
      }, 0)
    },
    [activity, onView]
  )

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      setTimeout(() => {
        onEdit(activity)
      }, 0)
    },
    [activity, onEdit]
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

ActivityActionMenu.displayName = 'ActivityActionMenu'

export default function FarmActivitiesPage() {
  const [activities, setActivities] = useState<FarmActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')

  // Pagination state
  const [pageIndex, setPageIndex] = useState(1)
  const pageSize = 10
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
  // Mapping tất cả các loại hoạt động từ backend
  const activityTypeMap: Record<string, string> = {
    SoilPreparation: 'Chuẩn bị đất trước gieo',
    Sowing: 'Gieo hạt',
    Thinning: 'Tỉa cây con cho đều',
    FertilizingDiluted: 'Bón phân pha loãng (NPK 20–30%)',
    Weeding: 'Nhổ cỏ nhỏ',
    PestControl: 'Phòng trừ sâu bằng thuốc sinh học',
    FertilizingLeaf: 'Bón phân cho lá (N, hữu cơ)',
    Harvesting: 'Thu hoạch',
    CleaningFarmArea: 'Dọn dẹp đồng ruộng',
  }

  // Danh sách activity types cho dropdown (giữ nguyên format cũ cho tương thích)
  const activityTypes = [
    { value: 'SoilPreparation', label: 'Chuẩn bị đất trước gieo' },
    { value: 'Sowing', label: 'Gieo hạt' },
    { value: 'Thinning', label: 'Tỉa cây con cho đều' },
    { value: 'FertilizingDiluted', label: 'Bón phân pha loãng (NPK 20–30%)' },
    { value: 'Weeding', label: 'Nhổ cỏ nhỏ' },
    { value: 'PestControl', label: 'Phòng trừ sâu bằng thuốc sinh học' },
    { value: 'FertilizingLeaf', label: 'Bón phân cho lá (N, hữu cơ)' },
    { value: 'Harvesting', label: 'Thu hoạch' },
    { value: 'CleaningFarmArea', label: 'Dọn dẹp đồng ruộng' },
  ]

  const normalizeBackendActivityType = (backendType: any): string => {
    if (backendType === null || backendType === undefined) return ''

    if (typeof backendType === 'number') {
      return String(backendType)
    }

    const raw = String(backendType)
    return raw
  }

  const statusOptions = [
    { value: 'ACTIVE', label: 'Hoạt động', variant: 'success' as const },
    { value: 'COMPLETED', label: 'Hoàn thành', variant: 'completed' as const },
    { value: 'CANCELLED', label: 'Đã hủy', variant: 'failed' as const },
    { value: 'PENDING', label: 'Chờ thực hiện', variant: 'pending' as const },
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
          // Giữ nguyên activityType từ backend (string như "Weeding", "Harvesting", etc.)
          activityType: activity.activityType || '',
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
  }, [pageIndex, statusFilter, activityTypeFilter, toast])

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

  const getActivityTypeLabel = (type: string | null | undefined) => {
    if (!type) return 'Không có dữ liệu'
    const activityType = activityTypes.find(at => at.value === type)
    if (activityType) return activityType.label
    // Fallback: nếu type là string từ backend, thử map trực tiếp
    return activityTypeMap[type] || type
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

    return <Badge variant={statusOption.variant}>{statusOption.label}</Badge>
  }

  const formatDisplayDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Không có dữ liệu'
    try {
      // Xử lý định dạng MM/DD/YYYY từ backend
      if (dateString.includes('/')) {
        const parts = dateString.split('/')
        if (parts.length === 3) {
          // MM/DD/YYYY -> YYYY-MM-DD để parse
          const month = parts[0].padStart(2, '0')
          const day = parts[1].padStart(2, '0')
          const year = parts[2]
          const isoDate = `${year}-${month}-${day}`
          const date = new Date(isoDate)
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('vi-VN')
          }
        }
      }
      // Thử parse trực tiếp nếu là ISO format hoặc format khác
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('vi-VN')
      }
      return dateString
    } catch {
      return dateString
    }
  }

  const formatDateForInput = (dateString: string | undefined | null): string => {
    if (!dateString) return ''
    // Xử lý định dạng MM/DD/YYYY từ backend
    if (dateString.includes('/')) {
      const parts = dateString.split('/')
      if (parts.length === 3) {
        // MM/DD/YYYY -> YYYY-MM-DD
        const month = parts[0].padStart(2, '0')
        const day = parts[1].padStart(2, '0')
        const year = parts[2]
        return `${year}-${month}-${day}`
      }
    }
    // Đã là format YYYY-MM-DD
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString
    // ISO format với T
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
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <ManagementPageHeader
            title="Quản lý hoạt động nông trại"
            description="Quản lý các hoạt động nông nghiệp, lập kế hoạch và theo dõi tiến độ thực hiện."
            actions={
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={loadActivities}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  Làm mới
                </Button>
              </div>
            }
          />

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
                  Toàn bộ hoạt động nông trại trong hệ thống
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

          <StaffFilterBar>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nhập loại hoạt động..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {activityTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                Tạo
              </Button>
            </div>
          </StaffFilterBar>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                  <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <StaffDataTable<FarmActivity>
                  className="px-4 sm:px-6 pb-6"
                  data={filteredActivities}
                  getRowKey={(activity) => activity.farmActivitiesId}
                  currentPage={pageIndex}
                  pageSize={pageSize}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  emptyTitle="Không tìm thấy hoạt động nào"
                  emptyDescription={
                    searchTerm || statusFilter !== 'all' || activityTypeFilter !== 'all'
                      ? 'Không có hoạt động nào phù hợp với điều kiện lọc hiện tại.'
                      : 'Hãy tạo hoạt động nông trại đầu tiên.'
                  }
                  columns={[
                    {
                      id: 'activityType',
                      header: 'Hoạt động',
                      render: (activity: FarmActivity) => (
                        <div className="font-medium">{getActivityTypeLabel(activity.activityType)}</div>
                      ),
                    },
                    {
                      id: 'startDate',
                      header: 'Ngày bắt đầu',
                      render: (activity: FarmActivity) => (
                        <div className="text-sm">{formatDisplayDate(activity.startDate)}</div>
                      ),
                    },
                    {
                      id: 'endDate',
                      header: 'Ngày kết thúc',
                      render: (activity: FarmActivity) => (
                        <div className="text-sm">{formatDisplayDate(activity.endDate)}</div>
                      ),
                    },
                    {
                      id: 'status',
                      header: 'Trạng thái',
                      render: (activity: FarmActivity) => getStatusBadge(activity.status),
                    },
                    {
                      id: 'actions',
                      header: '',
                      render: (activity: FarmActivity) => (
                        <ActivityActionMenu
                          activity={activity}
                          onView={handleViewDetailsClick}
                          onEdit={handleEditClick}
                        />
                      ),
                    },
                  ] satisfies StaffDataTableColumn<FarmActivity>[]}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi Tiết Hoạt Động Nông Trại</DialogTitle>
          </DialogHeader>

          {selectedActivityForDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Hoạt động</Label>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {getActivityTypeLabel(selectedActivityForDetails.activityType)}
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
        </DialogContent>
      </Dialog>

      { }
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo hoạt động nông trại mới</DialogTitle>
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
            <Button onClick={handleCreateActivity}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { }
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Hoạt Động Nông Trại</DialogTitle>
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
