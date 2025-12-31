import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
import { RefreshCw, Search, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import { formatDate } from '@/shared/lib/date-utils'
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
  const [searchDebounced, setSearchDebounced] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')
  const [showLatestOnly, setShowLatestOnly] = useState<boolean>(false)

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ACTIVE')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const latestRequestIdRef = useRef(0)
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

  const pickLatestPerType = (items: FarmActivity[]) => {
    const latestByType = new Map<string, FarmActivity>()
    for (const item of items) {
      const key = (item.activityType ?? '').toString()
      const itemCreatedAt = (item as any).createdAt
      const itemTime = itemCreatedAt
        ? new Date(itemCreatedAt).getTime()
        : item.farmActivitiesId
          ? Number(item.farmActivitiesId)
          : item.startDate
            ? new Date(item.startDate).getTime()
            : 0

      const existing = latestByType.get(key)
      if (!existing) {
        latestByType.set(key, item)
        continue
      }

      const existingCreatedAt = (existing as any).createdAt
      const existingTime = existingCreatedAt
        ? new Date(existingCreatedAt).getTime()
        : existing.farmActivitiesId
          ? Number(existing.farmActivitiesId)
          : existing.startDate
            ? new Date(existing.startDate).getTime()
            : 0

      if (itemTime > existingTime) {
        latestByType.set(key, item)
      }
    }
    return Array.from(latestByType.values())
  }

  const parseDate = (dateString?: string | null): Date | null => {
    if (!dateString) return null
    try {
      const mmddyyyy = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/
      const yyyymmdd = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*$/
      const m = mmddyyyy.exec(dateString)
      if (m) {
        const month = Number(m[1])
        const day = Number(m[2])
        const year = Number(m[3])
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const d = new Date(year, month - 1, day)
          d.setHours(0, 0, 0, 0)
          return d
        }
        return null
      }
      const y = yyyymmdd.exec(dateString)
      if (y) {
        const year = Number(y[1])
        const month = Number(y[2])
        const day = Number(y[3])
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const d = new Date(year, month - 1, day)
          d.setHours(0, 0, 0, 0)
          return d
        }
        return null
      }
      if (dateString.includes('T')) {
        const iso = new Date(dateString)
        if (!isNaN(iso.getTime())) {
          iso.setHours(0, 0, 0, 0)
          return iso
        }
        return null
      }
      return null
    } catch {
      return null
    }
  }

  const mapActivityTypeToLabelVi = (type?: string | null): string => {
    if (!type) return 'Không có dữ liệu'
    const mapping: Record<string, string> = {
      Sowing: 'Gieo hạt',
      SoilPreparation: 'Chuẩn bị đất trước gieo',
      FertilizingDiluted: 'Bón phân pha loãng (NPK 20–30%)',
      CleaningFarmArea: 'Dọn dẹp khu vực nông trại',
    }
    return mapping[type] || activityTypeMap[type] || type
  }

  const getTodayStart = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }

  const getTabForActivity = (activity: FarmActivity): 'ACTIVE' | 'UPCOMING' | 'COMPLETED' => {
    const status = (activity.status || '').toUpperCase()
    if (status === 'COMPLETED') return 'COMPLETED'
    const start = parseDate(activity.startDate)
    const today = getTodayStart()
    if (start && start.getTime() > today.getTime()) return 'UPCOMING'
    return 'ACTIVE'
  }

  const sortRules = (tab: 'ACTIVE' | 'UPCOMING' | 'COMPLETED', a: FarmActivity, b: FarmActivity) => {
    const parse = (v?: string | null) => {
      const d = parseDate(v)
      return d ? d.getTime() : 0
    }
    if (tab === 'ACTIVE') {
      const activityPriority: Record<string, number> = {
        SoilPreparation: 0,
        Sowing: 1,
      }
      const aPri = activityPriority[a.activityType || ''] ?? 99
      const bPri = activityPriority[b.activityType || ''] ?? 99
      if (aPri !== bPri) return aPri - bPri
      const aStart = parse(a.startDate)
      const bStart = parse(b.startDate)
      if (aStart !== bStart) return aStart - bStart
      return (b.farmActivitiesId || 0) - (a.farmActivitiesId || 0)
    }
    if (tab === 'UPCOMING') {
      const aStart = parse(a.startDate)
      const bStart = parse(b.startDate)
      if (aStart !== bStart) return aStart - bStart
      return (b.farmActivitiesId || 0) - (a.farmActivitiesId || 0)
    }
    const aEnd = parse(a.endDate)
    const bEnd = parse(b.endDate)
    if (aEnd !== bEnd) return bEnd - aEnd
    return (b.farmActivitiesId || 0) - (a.farmActivitiesId || 0)
  }

  const groupByActivityType = (items: FarmActivity[]) => {
    const groups = new Map<string, FarmActivity[]>()
    const order: string[] = []
    items.forEach(item => {
      const key = item.activityType ?? 'unknown'
      if (!groups.has(key)) {
        groups.set(key, [])
        order.push(key)
      }
      groups.get(key)!.push(item)
    })
    return order.map(key => [key, groups.get(key)!] as [string, FarmActivity[]])
  }

  const statusOptions = [
    { value: 'ACTIVE', label: 'Hoạt động', variant: 'success' as const },
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
    const requestId = ++latestRequestIdRef.current
    try {
      setLoading(true)
      const pageSizeLarge = 1000
      const baseParams: any = {
        pageIndex: 1,
        pageSize: pageSizeLarge,
      }
      if (activityTypeFilter !== 'all') baseParams.type = activityTypeFilter
      if (statusFilter !== 'all') baseParams.status = statusFilter
      if (showLatestOnly) baseParams.pageSize = 1000

      const firstResp = await farmActivityService.getAllFarmActivities(baseParams)
      if (requestId !== latestRequestIdRef.current) return

      let allItems: FarmActivity[] = Array.isArray(firstResp.items)
        ? firstResp.items.map(a => ({ ...a, activityType: a.activityType || '' }))
        : []

      const totalPagesCount = firstResp.totalPagesCount || 1
      if (totalPagesCount > 1) {
        const promises = []
        for (let p = 2; p <= totalPagesCount; p++) {
          promises.push(farmActivityService.getAllFarmActivities({ ...baseParams, pageIndex: p }))
        }
        const responses = await Promise.all(promises)
        if (requestId !== latestRequestIdRef.current) return
        for (const r of responses) {
          if (Array.isArray(r.items)) {
            allItems = allItems.concat(r.items.map(a => ({ ...a, activityType: a.activityType || '' })))
          }
        }
      }

      if (requestId !== latestRequestIdRef.current) return

      const finalItems = showLatestOnly ? pickLatestPerType(allItems) : allItems
      if (requestId === latestRequestIdRef.current) {
        setActivities(finalItems)
        const stats = (allItems || []).reduce(
          (acc, activity) => {
            const status = (activity.status || '').toUpperCase()
            acc.total += 1
            if (status === 'ACTIVE') acc.active += 1
            else if (status === 'IN_PROGRESS') acc.inProgress += 1
            else if (status === 'COMPLETED') acc.completed += 1
            else if (status === 'DEACTIVATED') acc.deactivated += 1
            return acc
          },
          { total: 0, active: 0, inProgress: 0, completed: 0, deactivated: 0 }
        )
        setActivityStats({ ...stats, total: stats.total })
      }
    } catch (error: any) {
      if (requestId !== latestRequestIdRef.current) return
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
      if (requestId === latestRequestIdRef.current) setLoading(false)
    }
  }, [statusFilter, activityTypeFilter, toast, showLatestOnly])


  const filteredActivities = useMemo(() => {
    const normalizedSearch = searchDebounced.trim().toLowerCase()
    return (Array.isArray(activities) ? activities : []).filter(activity => {
      if (!activity || typeof activity !== 'object') return false
      if (activityTypeFilter !== 'all' && activity.activityType !== activityTypeFilter) return false
      if (!normalizedSearch) return true
      const rawType = (activity.activityType || '').toLowerCase()
      const localizedType = mapActivityTypeToLabelVi(activity.activityType).toLowerCase()
      return rawType.includes(normalizedSearch) || localizedType.includes(normalizedSearch)
    })
  }, [activities, searchDebounced, activityTypeFilter])

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])



  const processedByTab = useMemo(() => {
    const byTab: Record<'ACTIVE' | 'UPCOMING' | 'COMPLETED', FarmActivity[]> = {
      ACTIVE: [],
      UPCOMING: [],
      COMPLETED: [],
    }
    for (const act of filteredActivities) {
      const tab = getTabForActivity(act)
      byTab[tab].push(act)
    }
    ; (['ACTIVE', 'UPCOMING', 'COMPLETED'] as const).forEach(tab => {
      byTab[tab].sort((a, b) => sortRules(tab, a, b))
    })
    return byTab
  }, [filteredActivities])

  const groupedData = useMemo(() => {
    const itemsForTab = processedByTab[activeTab] || []
    return groupByActivityType(itemsForTab)
  }, [processedByTab, activeTab])

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
    loadActivities()
  }, [activityTypeFilter, statusFilter, showLatestOnly])


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
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                onClick={() => setShowLatestOnly(prev => !prev)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition duration-200 ease-out focus:outline-none ${showLatestOnly
                  ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:ring-2 hover:ring-green-200 hover:text-white'
                  : 'bg-white border border-gray-200 text-black hover:bg-green-50 hover:shadow-md hover:text-white hover:bg-green-600 hover:ring-1 hover:ring-green-100'
                  }`}
              >
                {showLatestOnly ? 'Chỉ mục mới nhất mỗi loại' : 'Toàn bộ hoạt động'}
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                Tạo
              </Button>
            </div>
          </StaffFilterBar>
          <div className="flex items-center gap-2" role="tablist" aria-label="Activity tabs">
            <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm p-2">
              <button
                role="tab"
                aria-selected={activeTab === 'ACTIVE'}
                onClick={() => setActiveTab('ACTIVE')}
                title="Hoạt động"
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${activeTab === 'ACTIVE'
                  ? 'bg-gradient-to-r from-emerald-700 to-green-600 text-white shadow-md'
                  : 'bg-white/60 text-gray-700 hover:shadow-sm'
                  }`}
              >
                <span className="ml-1">Hoạt động</span>
                <span
                  className={`ml-3 inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'ACTIVE' ? 'bg-white/20' : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {processedByTab.ACTIVE ? processedByTab.ACTIVE.length : 0}
                </span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'UPCOMING'}
                onClick={() => setActiveTab('UPCOMING')}
                title="Sắp tới"
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${activeTab === 'UPCOMING'
                  ? 'bg-gradient-to-r from-emerald-700 to-green-600 text-white shadow-md'
                  : 'bg-white/60 text-gray-700 hover:shadow-sm'
                  }`}
              >
                <span className="ml-1">Sắp tới</span>
                <span
                  className={`ml-3 inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'UPCOMING' ? 'bg-white/20' : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {processedByTab.UPCOMING ? processedByTab.UPCOMING.length : 0}
                </span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'COMPLETED'}
                onClick={() => setActiveTab('COMPLETED')}
                title="Hoàn thành"
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${activeTab === 'COMPLETED'
                  ? 'bg-gradient-to-r from-emerald-700 to-green-600 text-white shadow-md'
                  : 'bg-white/60 text-gray-700 hover:shadow-sm'
                  }`}
              >
                <span className="ml-1">Hoàn thành</span>
                <span
                  className={`ml-3 inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'COMPLETED' ? 'bg-white/20' : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {processedByTab.COMPLETED ? processedByTab.COMPLETED.length : 0}
                </span>
              </button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                  <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                </div>
              ) : (processedByTab[activeTab] || []).length === 0 ? (
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
                  {groupedData.map(([typeKey, items]) => {
                    const collapsed = collapsedSections[typeKey] ?? false
                    const displayLabel = mapActivityTypeToLabelVi(typeKey)
                    return (
                      <div key={typeKey} className="space-y-3">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <button
                              className="p-1 rounded hover:bg-gray-100"
                              onClick={() => setCollapsedSections(prev => ({ ...prev, [typeKey]: !collapsed }))}
                              aria-expanded={!collapsed}
                            >
                              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                            </button>
                            <h3 className="text-lg font-semibold text-gray-900">{displayLabel}</h3>
                            <span className="text-sm text-gray-500">({items.length})</span>
                          </div>
                        </div>
                        {!collapsed && (
                          <div className="grid gap-3 px-4 pb-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {items.map(activity => (
                              <Card
                                key={activity.farmActivitiesId ?? `${activity.activityType}-${activity.startDate}`}
                                className="group transition-all cursor-pointer transform hover:-translate-y-1 hover:shadow-lg"
                                onClick={() => handleViewDetailsClick(activity)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-3">
                                      <p className="text-sm font-medium text-gray-900 group-hover:text-green-700 transition-colors">
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
                        )}
                      </div>
                    )
                  })}
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
