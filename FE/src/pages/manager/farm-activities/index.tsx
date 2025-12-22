import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useToast } from '@/shared/ui/use-toast'
import {
  ManagementPageHeader,
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
import { ActivitiesCalendar, mapActivitiesToCalendarEvents, type CalendarEvent, type SlotInfo } from './ActivitiesCalendar'
import { ActivityDrawer } from './ActivityDrawer'
import { StatusBadge } from './components/StatusBadge'

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
          ⋯
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

interface ActivityTimelineCardProps {
  activity: FarmActivity
  getActivityTypeLabel: (type: string | null | undefined) => string
  formatDisplayDate: (date: string | undefined | null) => string
  getStatusBadge: (status: string, isOverdue?: boolean) => React.ReactNode
  getActivityProgress: (activity: FarmActivity) => number
  getDaysUntilDue: (activity: FarmActivity) => number | null
  isActivityOverdue: (activity: FarmActivity) => boolean
  getStatusColor: (status: string) => string
  onView: (activity: FarmActivity) => void
  onEdit: (activity: FarmActivity) => void
  onToggleStatus: (activity: FarmActivity) => void
}

const ActivityTimelineCard: React.FC<ActivityTimelineCardProps> = React.memo(({
  activity,
  getActivityTypeLabel,
  formatDisplayDate,
  getStatusBadge,
  getActivityProgress,
  getDaysUntilDue,
  isActivityOverdue,
  getStatusColor,
  onView,
  onEdit,
  onToggleStatus,
}) => {
  const progress = getActivityProgress(activity)
  const daysUntilDue = getDaysUntilDue(activity)
  const overdue = isActivityOverdue(activity)
  const status = (activity.status || '').toUpperCase()
  const statusColor = getStatusColor(activity.status || '')

  const isActive = status === 'ACTIVE' || status === 'IN_PROGRESS'
  const isCompleted = status === 'COMPLETED'

  return (
    <Card
      className={`
        group relative overflow-hidden cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:border-slate-300
        ${overdue ? 'border-l-4 border-l-red-500' : isActive ? 'border-l-4 border-l-emerald-500' : ''}
        ${isCompleted ? 'opacity-75' : ''}
      `}
      onClick={() => onView(activity)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 truncate">
              {getActivityTypeLabel(activity.activityType)}
            </h4>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <ActivityActionMenu
              activity={activity}
              onView={onView}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 text-xs text-slate-600">
          <span className="font-medium">
            {formatDisplayDate(activity.startDate)} - {formatDisplayDate(activity.endDate)}
          </span>
        </div>

        {isActive && !isCompleted && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-600">Tiến độ</span>
              <span className="text-xs font-semibold text-slate-900">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${statusColor} transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            {getStatusBadge(activity.status, overdue)}
          </div>
          {daysUntilDue !== null && !isCompleted && (
            <div className={`
              text-xs font-medium px-2 py-0.5 rounded
              ${overdue
                ? 'bg-red-50 text-red-700'
                : daysUntilDue <= 2
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-slate-50 text-slate-600'
              }
            `}>
              {overdue
                ? `Quá hạn ${Math.abs(daysUntilDue)} ngày`
                : daysUntilDue === 0
                  ? 'Hôm nay'
                  : daysUntilDue === 1
                    ? 'Còn 1 ngày'
                    : `Còn ${daysUntilDue} ngày`
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

ActivityTimelineCard.displayName = 'ActivityTimelineCard'

export default function FarmActivitiesPage() {
  const [activities, setActivities] = useState<FarmActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'startDate' | 'status'>('newest')
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'day' | 'event' | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

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
    atRisk: 0,
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

  function getStatusBadge(status: string, isOverdue?: boolean) {
    return <StatusBadge status={status} isOverdue={isOverdue} size="sm" />
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

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const stats = items.reduce(
        (acc, activity) => {
          const status = (activity.status || '').toUpperCase()
          acc.total += 1
          if (status === 'ACTIVE') acc.active += 1
          else if (status === 'IN_PROGRESS') acc.inProgress += 1
          else if (status === 'COMPLETED') acc.completed += 1
          else if (status === 'DEACTIVATED') acc.deactivated += 1

          if (status === 'ACTIVE' || status === 'IN_PROGRESS') {
            const endDate = activity.endDate ? new Date(activity.endDate) : null
            if (endDate) {
              endDate.setHours(0, 0, 0, 0)
              const daysUntilDue = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              if (daysUntilDue <= 2 && daysUntilDue >= 0) {
                acc.atRisk += 1
              }
            }
          }

          return acc
        },
        {
          total: 0,
          active: 0,
          inProgress: 0,
          completed: 0,
          deactivated: 0,
          atRisk: 0,
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

  const getActivityProgress = useCallback((activity: FarmActivity): number => {
    if (!activity.startDate || !activity.endDate) return 0
    const start = new Date(activity.startDate).getTime()
    const end = new Date(activity.endDate).getTime()
    const now = new Date().getTime()

    if (now < start) return 0
    if (now > end) return 100
    return Math.round(((now - start) / (end - start)) * 100)
  }, [])

  const getDaysUntilDue = useCallback((activity: FarmActivity): number | null => {
    if (!activity.endDate) return null
    const endDate = new Date(activity.endDate)
    endDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [])

  const isActivityOverdue = useCallback((activity: FarmActivity): boolean => {
    const daysUntilDue = getDaysUntilDue(activity)
    if (daysUntilDue === null) return false
    const status = (activity.status || '').toUpperCase()
    return daysUntilDue < 0 && (status === 'ACTIVE' || status === 'IN_PROGRESS')
  }, [getDaysUntilDue])

  const getStatusColor = useCallback((status: string): string => {
    const normalizedStatus = (status || '').toUpperCase()
    switch (normalizedStatus) {
      case 'ACTIVE':
        return 'bg-emerald-500'
      case 'IN_PROGRESS':
        return 'bg-blue-500'
      case 'COMPLETED':
        return 'bg-slate-400'
      case 'DEACTIVATED':
        return 'bg-amber-500'
      default:
        return 'bg-gray-400'
    }
  }, [])


  const calendarEvents = useMemo(() => {
    return mapActivitiesToCalendarEvents(sortedActivities, getActivityTypeLabel)
  }, [sortedActivities, getActivityTypeLabel])

  const dayActivities = useMemo(() => {
    if (!selectedDate) return []
    const selectedDateStr = selectedDate.toISOString().split('T')[0]
    return calendarEvents.filter(event => {
      const eventStart = event.start.toISOString().split('T')[0]
      const eventEnd = event.end.toISOString().split('T')[0]
      return selectedDateStr >= eventStart && selectedDateStr <= eventEnd
    })
  }, [selectedDate, calendarEvents])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setDrawerMode('event')
    setDrawerOpen(true)
  }, [])

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    if (slotInfo.action === 'click') {
      setSelectedDate(slotInfo.start)
      setDrawerMode('day')
      setDrawerOpen(true)
    } else if (slotInfo.action === 'select') {
      const startDateStr = slotInfo.start.toISOString().split('T')[0]
      const endDateStr = slotInfo.end.toISOString().split('T')[0]
      setFormData({
        startDate: startDateStr,
        endDate: endDateStr,
      })
      setCreateDialogOpen(true)
    }
  }, [])

  const handleViewChange = useCallback((view: any) => {
    setViewMode(view as 'month' | 'week' | 'day' | 'agenda')
  }, [])

  const handleNavigate = useCallback((date: Date) => {
    setCalendarDate(date)
  }, [])

  const handleCreateFromDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    setFormData({
      startDate: dateStr,
      endDate: dateStr,
    })
    setCreateDialogOpen(true)
  }, [])

  const handleShowMore = useCallback((date: Date) => {
    setSelectedDate(date)
    setDrawerMode('day')
    setDrawerOpen(true)
  }, [])

  return (
    <ManagerLayout>
      <div className="container mx-auto px-4 py-6 lg:px-6">
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
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {loading ? 'Đang tải...' : 'Làm mới'}
                </Button>
              </div>
            }
          />

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-2">
                      Tổng hoạt động
                    </p>
                    <p className="text-5xl font-bold text-slate-900 leading-tight">
                      {activityStats.total}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Toàn bộ hoạt động nông trại trong hệ thống
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-600 mb-1">Đang hoạt động</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {activityStats.active + activityStats.inProgress}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Đang chạy và thực hiện
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="">
              <CardContent className="p-5">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Cần chú ý</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {activityStats.atRisk}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Sắp đến hạn
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="">
              <CardContent className="p-5">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600">Hoàn thành</p>
                  <p className="text-3xl font-bold text-slate-600">
                    {activityStats.completed}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Đã hoàn tất
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                <div className="flex-1 w-full lg:w-auto min-w-0">
                  <Input
                    id="search"
                    placeholder="Tìm kiếm hoạt động, loại, trạng thái..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="flex flex-wrap gap-2 flex-1 lg:flex-initial">
                  <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                    <SelectTrigger className="h-9 w-full sm:w-[180px]">
                      <SelectValue placeholder="Loại hoạt động" />
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

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-full sm:w-[160px]">
                      <SelectValue placeholder="Trạng thái" />
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

                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                    <SelectTrigger className="h-9 w-full sm:w-[140px]">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="startDate">Ngày bắt đầu</SelectItem>
                      <SelectItem value="status">Trạng thái</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 w-full lg:w-auto">
                  <div className="flex border rounded-md p-1 bg-slate-50">
                    <Button
                      variant={viewMode === 'month' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('month')}
                      className="h-7 px-3"
                    >
                      Tháng
                    </Button>
                    <Button
                      variant={viewMode === 'week' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('week')}
                      className="h-7 px-3"
                    >
                      Tuần
                    </Button>
                    <Button
                      variant={viewMode === 'day' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('day')}
                      className="h-7 px-3"
                    >
                      Ngày
                    </Button>
                    <Button
                      variant={viewMode === 'agenda' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('agenda')}
                      className="h-7 px-3"
                    >
                      Danh sách
                    </Button>
                  </div>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 h-9"
                  >
                    Tạo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48 mx-auto" />
                  <Skeleton className="h-[600px] w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ) : sortedActivities.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12">
                <div className="text-center space-y-3">
                  <p className="text-lg font-semibold text-slate-900">
                    {(() => {
                      if (searchTerm) return 'Không tìm thấy hoạt động nào'
                      if (statusFilter !== 'all' || activityTypeFilter !== 'all') {
                        return 'Không tìm thấy hoạt động nào'
                      }
                      return 'Chưa có hoạt động nông trại'
                    })()}
                  </p>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    {(() => {
                      if (searchTerm) return 'Không có hoạt động nào phù hợp với điều kiện lọc hiện tại.'
                      if (statusFilter !== 'all' || activityTypeFilter !== 'all') {
                        return 'Không có hoạt động nào phù hợp với điều kiện lọc hiện tại.'
                      }
                      return 'Hãy tạo hoạt động nông trại đầu tiên để bắt đầu quản lý.'
                    })()}
                  </p>
                  {!searchTerm && statusFilter === 'all' && activityTypeFilter === 'all' && (
                    <Button
                      onClick={() => setCreateDialogOpen(true)}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Tạo hoạt động đầu tiên
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'agenda' ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {groupedActivities.map(([typeLabel, items]) => (
                    <div key={typeLabel} className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <h3 className="text-base font-semibold text-slate-900">{typeLabel}</h3>
                        <Badge variant="secondary">{items.length}</Badge>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {items.map(activity => (
                          <ActivityTimelineCard
                            key={activity.farmActivitiesId ?? `${activity.activityType}-${activity.startDate}`}
                            activity={activity}
                            getActivityTypeLabel={getActivityTypeLabel}
                            formatDisplayDate={formatDisplayDate}
                            getStatusBadge={getStatusBadge}
                            getActivityProgress={getActivityProgress}
                            getDaysUntilDue={getDaysUntilDue}
                            isActivityOverdue={isActivityOverdue}
                            getStatusColor={getStatusColor}
                            onView={handleViewDetailsClick}
                            onEdit={handleEditClick}
                            onToggleStatus={handleToggleStatus}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {totalPages > 1 && (
                    <div className="pt-4 border-t">
                      <Pagination currentPage={pageIndex} totalPages={totalPages} onPageChange={handlePageChange} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <ActivitiesCalendar
              events={calendarEvents}
              view={viewMode}
              date={calendarDate}
              onViewChange={handleViewChange}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              getActivityTypeLabel={getActivityTypeLabel}
              getStatusBadge={getStatusBadge}
              onShowMore={handleShowMore}
              isActivityOverdue={isActivityOverdue}
            />
          )}

          <ActivityDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            mode={drawerMode}
            selectedDate={selectedDate}
            selectedEvent={selectedEvent}
            dayActivities={dayActivities}
            loading={false}
            getActivityTypeLabel={getActivityTypeLabel}
            getStatusBadge={getStatusBadge}
            formatDisplayDate={formatDisplayDate}
            getActivityProgress={getActivityProgress}
            getDaysUntilDue={getDaysUntilDue}
            isActivityOverdue={isActivityOverdue}
            onViewActivity={handleViewDetailsClick}
            onEditActivity={handleEditClick}
            onToggleStatus={handleToggleStatus}
            onCreateActivity={handleCreateFromDate}
          />
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
