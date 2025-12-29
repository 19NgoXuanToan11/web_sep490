import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
import { formatDate } from '@/shared/lib/date-utils'
import {
  ManagementPageHeader,
  StaffFilterBar,
} from '@/shared/ui'
import { Pagination } from '@/shared/ui/pagination'
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

interface ActivityActionMenuProps {
  activity: FarmActivity
  onView: (activity: FarmActivity) => void
  onEdit: (activity: FarmActivity) => void
  onToggleStatus: (activity: FarmActivity) => void
}

const ActivityActionMenu: React.FC<ActivityActionMenuProps> = React.memo(({ activity, onView, onEdit, onToggleStatus }) => {
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

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      setTimeout(() => {
        onToggleStatus(activity)
      }, 0)
    },
    [activity, onToggleStatus]
  )

  const toggleLabel =
    activity.status === 'ACTIVE'
      ? 'Tạm dừng'
      : activity.status === 'DEACTIVATED'
        ? 'Kích hoạt'
        : 'Đổi trạng thái'

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
          onClick={handleToggle}
          className="cursor-pointer focus:bg-gray-100"
          onSelect={(e) => e.preventDefault()}
        >
          {toggleLabel}
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
  const [sortBy, setSortBy] = useState<'newest' | 'startDate' | 'status'>('newest')

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
    inProgress: 0,
    completed: 0,
    deactivated: 0,
  })

  const getTodayDateString = (): string => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const todayDateString = getTodayDateString()

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
    { value: 'IN_PROGRESS', label: 'Đang thực hiện', variant: 'processing' as const },
    { value: 'COMPLETED', label: 'Hoàn thành', variant: 'completed' as const },
    { value: 'DEACTIVATED', label: 'Tạm dừng', variant: 'destructive' as const },
  ]

  function getActivityTypeLabel(type: string | null | undefined) {
    if (!type) return 'Không có dữ liệu'
    const activityType = activityTypes.find(at => at.value === type)
    if (activityType) return activityType.label
    return activityTypeMap[type] || type
  }

  function getStatusBadge(status: string) {
    const statusOption = statusOptions.find(s => s.value === status)
    if (!statusOption) return <Badge variant="outline">{status}</Badge>
    return <Badge variant={statusOption.variant}>{statusOption.label}</Badge>
  }

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
          activityType: activity.activityType || '',
        }))
        : []
      setActivities(normalizedActivities)
      setTotalPages(response.totalPagesCount || 1)
    } catch (error: any) {
      setActivities([])
      const { normalizeError } = await import('@/shared/lib/error-handler')
      const normalized = normalizeError(error)
      const display = normalized.backendMessage ?? 'Không thể tải danh sách hoạt động nông trại'
      toast({
        title: 'Lỗi',
        description: display,
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
          else if (status === 'IN_PROGRESS') acc.inProgress += 1
          else if (status === 'COMPLETED') acc.completed += 1
          else if (status === 'DEACTIVATED') acc.deactivated += 1
          return acc
        },
        {
          total: 0,
          active: 0,
          inProgress: 0,
          completed: 0,
          deactivated: 0,
        }
      )

      setActivityStats({
        ...stats,
        total: response.totalItemCount || stats.total,
      })
    } catch {
    }
  }, [])

  const filteredActivities = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return (Array.isArray(activities) ? activities : []).filter(activity => {
      if (!activity || typeof activity !== 'object') return false
      if (!normalizedSearch) return true
      const rawType = (activity.activityType || '').toLowerCase()
      const localizedType = getActivityTypeLabel(activity.activityType).toLowerCase()
      return rawType.includes(normalizedSearch) || localizedType.includes(normalizedSearch)
    })
  }, [activities, searchTerm])

  const sortedActivities = useMemo(() => {
    const sorted = [...filteredActivities]
    const statusOrder: Record<string, number> = {
      ACTIVE: 0,
      IN_PROGRESS: 1,
      COMPLETED: 2,
      DEACTIVATED: 3,
    }

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => (b.farmActivitiesId || 0) - (a.farmActivitiesId || 0))
      case 'startDate': {
        const parseDate = (v?: string | null) => {
          const d = v ? new Date(v) : null
          return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0
        }
        return sorted.sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate))
      }
      case 'status':
        return sorted.sort((a, b) => {
          const aOrder = statusOrder[(a.status || '').toUpperCase()] ?? 99
          const bOrder = statusOrder[(b.status || '').toUpperCase()] ?? 99
          if (aOrder === bOrder) return (b.farmActivitiesId || 0) - (a.farmActivitiesId || 0)
          return aOrder - bOrder
        })
      default:
        return sorted
    }
  }, [filteredActivities, sortBy])

  const groupedActivities = useMemo(() => {
    const groups = new Map<string, FarmActivity[]>()
    const order: string[] = []
    sortedActivities.forEach(activity => {
      const label = getActivityTypeLabel(activity.activityType)
      if (!groups.has(label)) {
        groups.set(label, [])
        order.push(label)
      }
      groups.get(label)!.push(activity)
    })
    return order.map(key => [key, groups.get(key)!] as [string, FarmActivity[]])
  }, [sortedActivities])

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
      const { normalizeError } = await import('@/shared/lib/error-handler')
      const normalized = normalizeError(error)
      const display = normalized.backendMessage ?? 'Không thể tạo hoạt động nông trại mới'
      toast({
        title: 'Lỗi',
        description: display,
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
      const { normalizeError } = await import('@/shared/lib/error-handler')
      const normalized = normalizeError(error)
      const display = normalized.backendMessage ?? 'Không thể cập nhật hoạt động nông trại'
      toast({
        title: 'Lỗi',
        description: display,
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
      const { normalizeError } = await import('@/shared/lib/error-handler')
      const normalized = normalizeError(error)
      const display = normalized.backendMessage ?? 'Không thể tải thông tin chi tiết hoạt động'
      toast({
        title: 'Lỗi',
        description: display,
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

  const handleToggleStatus = async (activity: FarmActivity) => {
    const currentStatus = (activity.status || '').toUpperCase()
    if (currentStatus !== 'ACTIVE' && currentStatus !== 'DEACTIVATED') {
      toast({
        title: 'Không thể đổi trạng thái',
        description: 'Chỉ có thể bật/tắt các hoạt động đang hoạt động hoặc tạm dừng.',
        variant: 'destructive',
      })
      return
    }

    const nextStatusLabel = currentStatus === 'ACTIVE' ? 'đã tạm dừng' : 'đã kích hoạt'

    try {
      setLoading(true)
      await farmActivityService.changeStatus(activity.farmActivitiesId)
      toast({
        title: 'Thành công',
        description: `Hoạt động ${nextStatusLabel}`,
      })
      await loadActivities()
      await loadActivityStats()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể đổi trạng thái hoạt động',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDisplayDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Không có dữ liệu'
    try {
      if (dateString.includes('/')) {
        const parts = dateString.split('/')
        if (parts.length === 3) {
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
    if (dateString.includes('/')) {
      const parts = dateString.split('/')
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0')
        const day = parts[1].padStart(2, '0')
        const year = parts[2]
        return `${year}-${month}-${day}`
      }
    }
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
  }, [statusFilter, activityTypeFilter, searchTerm, sortBy])

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
                      {activityStats.active + activityStats.inProgress}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Bao gồm hoạt động đang chạy và đang thực hiện
                </p>
              </CardContent>
            </Card>

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
            <div className="w-full sm:w-48">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="startDate">Ngày bắt đầu</SelectItem>
                  <SelectItem value="status">Trạng thái</SelectItem>
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
              ) : sortedActivities.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-lg font-semibold text-gray-900">
                    {(() => {
                      if (searchTerm) return 'Không tìm thấy hoạt động nào'
                      if (statusFilter !== 'all' || activityTypeFilter !== 'all') {
                        return 'Không tìm thấy hoạt động nào'
                      }
                      return 'Chưa có hoạt động nông trại'
                    })()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      if (searchTerm) return 'Không có hoạt động nào phù hợp với điều kiện lọc hiện tại.'
                      if (statusFilter !== 'all' || activityTypeFilter !== 'all') {
                        return 'Không có hoạt động nào phù hợp với điều kiện lọc hiện tại.'
                      }
                      return 'Hãy tạo hoạt động nông trại đầu tiên.'
                    })()}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedActivities.map(([typeLabel, items]) => (
                    <div key={typeLabel} className="space-y-3">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">{typeLabel}</h3>
                      </div>
                      <div className="grid gap-3 px-4 pb-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {items.map(activity => (
                          <Card
                            key={activity.farmActivitiesId ?? `${activity.activityType}-${activity.startDate}`}
                            className="hover:shadow-md transition-all cursor-pointer"
                            onClick={() => handleViewDetailsClick(activity)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-3">
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatDisplayDate(activity.startDate)} - {formatDisplayDate(activity.endDate)}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(activity.status)}
                                  </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <ActivityActionMenu
                                    activity={activity}
                                    onView={handleViewDetailsClick}
                                    onEdit={handleEditClick}
                                    onToggleStatus={handleToggleStatus}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}

                  {totalPages > 1 && (
                    <div className="px-4 pb-4">
                      <Pagination currentPage={pageIndex} totalPages={totalPages} onPageChange={handlePageChange} />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
                  if (dateErrors.startDate) {
                    setDateErrors({ ...dateErrors, startDate: undefined })
                  }
                }}
                className={dateErrors.startDate ? 'border-red-500' : ''}
              />
              {dateErrors.startDate && (
                <p className="text-sm text-red-600 mt-1">{dateErrors.startDate}</p>
              )}
              {formData.startDate && !dateErrors.startDate && (
                <p className="text-sm text-gray-500 mt-1">Định dạng hiển thị: {formatDate(formData.startDate)}</p>
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
                  if (dateErrors.endDate) {
                    setDateErrors({ ...dateErrors, endDate: undefined })
                  }
                }}
                className={dateErrors.endDate ? 'border-red-500' : ''}
              />
              {dateErrors.endDate && (
                <p className="text-sm text-red-600 mt-1">{dateErrors.endDate}</p>
              )}
              {formData.endDate && !dateErrors.endDate && (
                <p className="text-sm text-gray-500 mt-1">Định dạng hiển thị: {formatDate(formData.endDate)}</p>
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
                  if (dateErrors.startDate) {
                    setDateErrors({ ...dateErrors, startDate: undefined })
                  }
                }}
                className={dateErrors.startDate ? 'border-red-500' : ''}
              />
              {dateErrors.startDate && (
                <p className="text-sm text-red-600 mt-1">{dateErrors.startDate}</p>
              )}
              {formData.startDate && !dateErrors.startDate && (
                <p className="text-sm text-gray-500 mt-1">Định dạng hiển thị: {formatDate(formData.startDate)}</p>
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
                  if (dateErrors.endDate) {
                    setDateErrors({ ...dateErrors, endDate: undefined })
                  }
                }}
                className={dateErrors.endDate ? 'border-red-500' : ''}
              />
              {dateErrors.endDate && (
                <p className="text-sm text-red-600 mt-1">{dateErrors.endDate}</p>
              )}
              {formData.endDate && !dateErrors.endDate && (
                <p className="text-sm text-gray-500 mt-1">Định dạng hiển thị: {formatDate(formData.endDate)}</p>
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
