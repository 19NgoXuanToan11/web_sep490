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
import { useScheduleData } from '@/features/season/ui/hooks/useScheduleData'
import { showSuccessToast, showErrorToast } from '@/shared/lib/toast-manager'
import { APP_CONFIG } from '@/shared/constants/app'
import { activityTypeLabels, farmActivityStatusOptions } from '@/features/season/ui/utils/labels'

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
  if (APP_CONFIG.FEATURES?.HIDE_FARM_ACTIVITIES) {
    return null
  }
  const [activities, setActivities] = useState<FarmActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [statusFilter] = useState<string>('all')
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')
  const [showLatestOnly, setShowLatestOnly] = useState<boolean>(false)

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED' | 'DEACTIVATED'>('ACTIVE')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const latestRequestIdRef = useRef(0)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<FarmActivity | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedActivityForDetails, setSelectedActivityForDetails] = useState<any | null>(
    null
  )
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  const [formData, setFormData] = useState<FarmActivityRequest>({
    startDate: '',
    endDate: '',
    staffId: undefined,
    scheduleId: undefined,
  })
  const [formActivityType, setFormActivityType] = useState<string>('')
  const [formStatus, setFormStatus] = useState<string>('ACTIVE')
  const [dateErrors, setDateErrors] = useState<{ startDate?: string; endDate?: string }>({})
  const [editLoading, setEditLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

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
  const activityTypes = useMemo(
    () => Object.keys(activityTypeLabels).map(key => ({ value: key, label: activityTypeLabels[key] })),
    []
  )
  const { staffs, allSchedules, loadReferenceData, loadAllSchedules } = useScheduleData()

  useEffect(() => {
    if (createDialogOpen) {
      void loadReferenceData().catch(() => { })
    }
  }, [createDialogOpen, loadReferenceData])

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
      const s = String(dateString).trim()
      const slashRe = /^\s*(\d{1,4})\/(\d{1,2})\/(\d{1,4})\s*$/
      const yyyymmdd = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*$/

      const m = slashRe.exec(s)
      if (m) {
        const p1 = Number(m[1])
        const p2 = Number(m[2])
        const p3 = Number(m[3])
        let year = p3
        let month = p1
        let day = p2
        if (m[1].length === 4) {
          year = p1
          month = p2
          day = p3
        } else if (m[3].length === 4) {
          year = p3
          if (p1 > 12 && p2 <= 12) {
            day = p1
            month = p2
          } else if (p2 > 12 && p1 <= 12) {
            day = p2
            month = p1
          } else {
            month = p1
            day = p2
          }
        } else {
          year = p3
          month = p1
          day = p2
        }

        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const d = new Date(year, month - 1, day)
          if (!isNaN(d.getTime())) {
            d.setHours(0, 0, 0, 0)
            return d
          }
        }
        return null
      }

      const y = yyyymmdd.exec(s)
      if (y) {
        const year = Number(y[1])
        const month = Number(y[2])
        const day = Number(y[3])
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const d = new Date(year, month - 1, day)
          if (!isNaN(d.getTime())) {
            d.setHours(0, 0, 0, 0)
            return d
          }
        }
        return null
      }

      if (s.includes('T')) {
        const iso = new Date(s)
        if (!isNaN(iso.getTime())) {
          iso.setHours(0, 0, 0, 0)
          return iso
        }
        return null
      }

      const parsed = new Date(s)
      if (!isNaN(parsed.getTime())) {
        parsed.setHours(0, 0, 0, 0)
        return parsed
      }
      return null
    } catch {
      return null
    }
  }

  const mapActivityTypeToLabelVi = (type?: string | null): string => {
    if (!type) return 'Không có dữ liệu'
    return activityTypeLabels[type] ?? type
  }



  const getTabForActivity = (activity: FarmActivity): 'ACTIVE' | 'COMPLETED' | 'DEACTIVATED' | 'NONE' => {
    const status = (activity.status || '').toUpperCase()
    if (status === 'ACTIVE') return 'ACTIVE'
    if (status === 'COMPLETED') return 'COMPLETED'
    if (status === 'DEACTIVATED') return 'DEACTIVATED'
    return 'NONE'
  }

  const sortRules = (tab: 'ACTIVE' | 'COMPLETED' | 'DEACTIVATED', a: FarmActivity, b: FarmActivity) => {
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
    const aEnd = parse(a.endDate)
    const bEnd = parse(b.endDate)
    if (aEnd !== bEnd) return bEnd - aEnd
    return (b.farmActivitiesId || 0) - (a.farmActivitiesId || 0)
  }

  const statusOptions = [
    ...farmActivityStatusOptions,
  ]

  function getActivityTypeLabel(type: string | null | undefined) {
    if (!type) return 'Không có dữ liệu'
    const activityType = activityTypes.find(at => at.value === type)
    if (activityType) return activityType.label
    return activityTypeLabels[type] || type
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
      showErrorToast(error)
    } finally {
      if (requestId === latestRequestIdRef.current) setLoading(false)
    }
  }, [statusFilter, activityTypeFilter, showLatestOnly])


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
    const byTab: Record<'ACTIVE' | 'COMPLETED' | 'DEACTIVATED', FarmActivity[]> = {
      ACTIVE: [],
      COMPLETED: [],
      DEACTIVATED: [],
    }
    for (const act of filteredActivities) {
      const tab = getTabForActivity(act)
      if (tab === 'ACTIVE' || tab === 'COMPLETED' || tab === 'DEACTIVATED') {
        byTab[tab].push(act)
      }
    }
    ; (['ACTIVE', 'COMPLETED', 'DEACTIVATED'] as const).forEach(tab => {
      byTab[tab].sort((a, b) => sortRules(tab, a, b as any))
    })
    return byTab
  }, [filteredActivities])

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

  const groupedData = useMemo(() => {
    const itemsForTab = processedByTab[activeTab] || []
    return groupByActivityType(itemsForTab)
  }, [processedByTab, activeTab])

  const handleCreateActivity = async () => {
    setCreateLoading(true)
    try {
      setDateErrors({})

      if (!formActivityType || !formData.startDate || !formData.endDate) {
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
        return
      }

      if (endDate < today) {
        setDateErrors({ endDate: 'Ngày kết thúc không thể trước ngày hiện tại' })
        return
      }

      if (startDate > endDate) {
        setDateErrors({ startDate: 'Ngày bắt đầu không thể sau ngày kết thúc' })
        return
      }

      const res = await farmActivityService.createFarmActivity(formData, formActivityType)
      showSuccessToast(res)

      setCreateDialogOpen(false)
      resetForm()
      await loadActivities()
    } catch (error: any) {
      showErrorToast(error)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleUpdateActivity = async () => {
    if (!editingActivity) return

    try {
      setDateErrors({})
      setEditLoading(true)

      if (!formActivityType || !formData.startDate || !formData.endDate) {
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
        return
      }

      if (endDate < today) {
        setDateErrors({ endDate: 'Ngày kết thúc không thể trước ngày hiện tại' })
        return
      }

      if (startDate > endDate) {
        setDateErrors({ startDate: 'Ngày bắt đầu không thể sau ngày kết thúc' })
        return
      }

      const updateData: FarmActivityUpdate = {
        startDate: formData.startDate,
        endDate: formData.endDate,
      }

      const res = await farmActivityService.updateFarmActivity(
        editingActivity.farmActivitiesId,
        updateData,
        formActivityType,
        formStatus,
      )
      showSuccessToast(res)

      setEditDialogOpen(false)
      setEditingActivity(null)
      resetForm()
      loadActivities()
    } catch (error: any) {
      showErrorToast(error)
    } finally {
      setEditLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      startDate: '',
      endDate: '',
      staffId: undefined,
      scheduleId: undefined,
    })
    setFormActivityType('')
    setFormStatus('ACTIVE')
    setDateErrors({})
  }

  const handleEditClick = async (activity: FarmActivity) => {
    try {
      setEditLoading(true)
      const fullActivity = await farmActivityService.getFarmActivityById(activity.farmActivitiesId)
      setEditingActivity(fullActivity)

      const startDate =
        formatDateForInput(fullActivity.startDate) || formatDateForInput(activity.startDate)
      const endDate =
        formatDateForInput(fullActivity.endDate) || formatDateForInput(activity.endDate)

      const staffIdFromFull =
        (fullActivity as any).staffId ?? (fullActivity as any).assignedTo ?? (activity as any).staffId ?? undefined
      const scheduleIdFromFull = (fullActivity as any).scheduleId ?? (activity as any).scheduleId ?? undefined

      setFormData({
        startDate,
        endDate,
        staffId: staffIdFromFull,
        scheduleId: scheduleIdFromFull,
      })
      setFormActivityType(normalizeBackendActivityType(fullActivity.activityType || activity.activityType))
      setFormStatus(fullActivity.status || activity.status)
      void loadAllSchedules().catch(() => { })
      setEditDialogOpen(true)
    } catch (error: any) {
      showErrorToast(error)
      setEditingActivity(activity)

      const startDate = formatDateForInput(activity.startDate)
      const endDate = formatDateForInput(activity.endDate)

      setFormData({
        startDate,
        endDate,
        staffId: (activity as any).staffId ?? (activity as any).assignedTo ?? undefined,
        scheduleId: (activity as any).scheduleId ?? undefined,
      })
      setFormActivityType(normalizeBackendActivityType(activity.activityType))
      setFormStatus(activity.status)
      setEditDialogOpen(true)
    } finally {
      setEditLoading(false)
    }
  }

  const handleToggleStatus = async (activity: FarmActivity) => {
    const currentStatus = (activity.status || '').toUpperCase()
    if (currentStatus !== 'ACTIVE' && currentStatus !== 'DEACTIVATED') {
      return
    }



    try {
      setLoading(true)
      const res = await farmActivityService.changeStatus(activity.farmActivitiesId)
      showSuccessToast(res)
      await loadActivities()
    } catch (error: any) {
      showErrorToast(error)
    } finally {
      setLoading(false)
    }
  }

  const formatDisplayDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Không có dữ liệu'
    try {
      const ddmmyyyy = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/
      const dMatch = ddmmyyyy.exec(dateString)
      if (dMatch) {
        const day = Number(dMatch[1])
        const month = Number(dMatch[2])
        const year = Number(dMatch[3])
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const d = new Date(year, month - 1, day)
          if (!isNaN(d.getTime())) {
            const formatted = formatDate(d)
            return formatted === '-' ? 'Không có dữ liệu' : formatted
          }
        }
      }

      const yyyymmdd = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*$/
      const yMatch = yyyymmdd.exec(dateString)
      if (yMatch) {
        const year = Number(yMatch[1])
        const month = Number(yMatch[2])
        const day = Number(yMatch[3])
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const d = new Date(year, month - 1, day)
          if (!isNaN(d.getTime())) {
            const formatted = formatDate(d)
            return formatted === '-' ? 'Không có dữ liệu' : formatted
          }
        }
      }

      const iso = new Date(dateString)
      if (!isNaN(iso.getTime())) {
        const formatted = formatDate(iso)
        return formatted === '-' ? 'Không có dữ liệu' : formatted
      }

      return 'Không có dữ liệu'
    } catch {
      return 'Không có dữ liệu'
    }
  }

  const formatDateForInput = (dateString: string | undefined | null): string => {
    if (!dateString) return ''
    const s = String(dateString).trim()
    if (s.includes('/')) {
      const parts = s.split('/').map(p => p.trim())
      if (parts.length === 3) {
        const p0 = parts[0]
        const p1 = parts[1]
        const p2 = parts[2]

        if (p0.length === 4 && /^\d{4}$/.test(p0)) {
          const year = p0
          const month = p1.padStart(2, '0')
          const day = p2.padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        if (p2.length === 4 && /^\d{4}$/.test(p2)) {
          const num0 = Number(p0)
          const num1 = Number(p1)
          let month = p0.padStart(2, '0')
          let day = p1.padStart(2, '0')
          if (num0 > 12 && num1 <= 12) {
            day = p0.padStart(2, '0')
            month = p1.padStart(2, '0')
          } else if (num1 > 12 && num0 <= 12) {
            day = p1.padStart(2, '0')
            month = p0.padStart(2, '0')
          } else {
            month = p0.padStart(2, '0')
            day = p1.padStart(2, '0')
          }
          const year = p2
          return `${year}-${month}-${day}`
        }
      }
    }
    if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s
    if (s.includes('T')) return s.split('T')[0]
    const iso = new Date(s)
    if (!isNaN(iso.getTime())) return iso.toISOString().split('T')[0]
    return ''
  }

  const safeField = (value: any): string => {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'string' && value.trim() === '') return '—'
    return String(value)
  }

  const handleViewDetailsClick = async (activity: FarmActivity) => {
    setSelectedActivityForDetails(null)
    setDetailsError(null)
    setDetailsDialogOpen(true)

    try {
      const id = Number(activity.farmActivitiesId)
      if (!id) {
        setSelectedActivityForDetails(activity)
        return
      }

      setDetailsLoading(true)
      const payload = await farmActivityService.getFarmActivityById(id)
      setSelectedActivityForDetails(payload)
    } catch (err) {
      console.error('Failed to fetch activity detail (get-by-id) for details dialog', err)
      setDetailsError('Không thể tải chi tiết hoạt động. Vui lòng thử lại.')
      setSelectedActivityForDetails(null)
    } finally {
      setDetailsLoading(false)
    }
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
                  ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:ring-2 hover:ring-green-200'
                  : 'bg-white border border-gray-200 text-black hover:bg-green-50 hover:shadow-md'
                  }`}
              >
                {showLatestOnly ? 'Chỉ mục mới nhất mỗi loại' : 'Toàn bộ hoạt động'}
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                Tạo
              </Button>
            </div>
          </StaffFilterBar>
          <div className="flex items-center gap-2 w-full" role="tablist" aria-label="Activity tabs">
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm p-2 w-full">
              <button
                role="tab"
                aria-selected={activeTab === 'DEACTIVATED'}
                onClick={() => setActiveTab('DEACTIVATED')}
                title="Tạm dừng"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${activeTab === 'DEACTIVATED'
                  ? 'bg-gradient-to-r from-emerald-700 to-green-600 text-white shadow-md'
                  : 'bg-white/60 text-gray-700 hover:shadow-sm'
                  }`}
              >
                <span>Tạm dừng</span>
                <span
                  className={`inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'DEACTIVATED' ? 'bg-white/20' : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {processedByTab.DEACTIVATED ? processedByTab.DEACTIVATED.length : 0}
                </span>
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'ACTIVE'}
                onClick={() => setActiveTab('ACTIVE')}
                title="Hoạt động"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${activeTab === 'ACTIVE'
                  ? 'bg-gradient-to-r from-emerald-700 to-green-600 text-white shadow-md'
                  : 'bg-white/60 text-gray-700 hover:shadow-sm'
                  }`}
              >
                <span>Hoạt động</span>
                <span
                  className={`inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'ACTIVE' ? 'bg-white/20' : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {processedByTab.ACTIVE ? processedByTab.ACTIVE.length : 0}
                </span>
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'COMPLETED'}
                onClick={() => setActiveTab('COMPLETED')}
                title="Hoàn thành"
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${activeTab === 'COMPLETED'
                  ? 'bg-gradient-to-r from-emerald-700 to-green-600 text-white shadow-md'
                  : 'bg-white/60 text-gray-700 hover:shadow-sm'
                  }`}
              >
                <span>Hoàn thành</span>
                <span
                  className={`inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'COMPLETED' ? 'bg-white/20' : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {processedByTab.COMPLETED ? processedByTab.COMPLETED.length : 0}
                </span>
              </button>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <colgroup>
                      <col style={{ width: '35%' }} />
                      <col style={{ width: '35%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead className="bg-white">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-600">Loại hoạt động</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-600">Thời gian</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-600">Trạng thái</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-600">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {groupedData.map(([typeKey, items]) => {
                        const collapsed = collapsedSections[typeKey] ?? false
                        const displayLabel = mapActivityTypeToLabelVi(typeKey)
                        return (
                          <React.Fragment key={typeKey}>
                            <tr className="bg-gray-50">
                              <td colSpan={4} className="px-4 py-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <button
                                      className="p-1 rounded hover:bg-gray-100"
                                      onClick={(e) => { e.stopPropagation(); setCollapsedSections(prev => ({ ...prev, [typeKey]: !collapsed })) }}
                                      aria-expanded={!collapsed}
                                    >
                                      {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                    </button>
                                    <h3 className="text-sm font-semibold text-gray-900">{displayLabel}</h3>
                                    <span className="text-sm text-gray-500">({items.length})</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            {!collapsed && items.map(activity => (
                              <tr
                                key={activity.farmActivitiesId ?? `${activity.activityType}-${activity.startDate}`}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleViewDetailsClick(activity)}
                              >
                                <td className="px-4 py-3 align-top text-sm text-gray-900">
                                  {getActivityTypeLabel(activity.activityType)}
                                </td>
                                <td className="px-4 py-3 align-top text-sm text-gray-700">
                                  {formatDisplayDate(activity.startDate)} - {formatDisplayDate(activity.endDate)}
                                </td>
                                <td className="px-4 py-3 align-top text-sm">
                                  {getStatusBadge(activity.status)}
                                </td>
                                <td className="px-4 py-3 align-top text-sm" onClick={(e) => e.stopPropagation()}>
                                  <ActivityActionMenu
                                    activity={activity}
                                    onView={handleViewDetailsClick}
                                    onEdit={handleEditClick}
                                    onToggleStatus={handleToggleStatus}
                                  />
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
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

          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Đang tải chi tiết...</span>
            </div>
          ) : detailsError ? (
            <div className="py-6 text-center text-sm text-red-600">{detailsError}</div>
          ) : selectedActivityForDetails ? (
            Array.isArray(selectedActivityForDetails) ? (
              <div className="space-y-4">
                <div className="grid gap-3">
                  {selectedActivityForDetails.map((rec: any, idx: number) => (
                    <div key={String(rec.id ?? rec.farmActivitiesId ?? idx)} className="p-3 bg-white rounded-md border shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold">Bản ghi #{idx + 1}</div>
                        <div>{getStatusBadge(rec.status ?? rec.Status)}</div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div><strong>Loại hoạt động:</strong> {getActivityTypeLabel(rec.activityType ?? rec.ActivityType)}</div>
                        <div><strong>ID:</strong> {rec.id ?? rec.farmActivitiesId ?? '-'}</div>
                        <div><strong>Ngày bắt đầu:</strong> {formatDisplayDate(rec.startDate ?? rec.StartDate ?? rec.start)}</div>
                        <div><strong>Ngày kết thúc:</strong> {formatDisplayDate(rec.endDate ?? rec.EndDate ?? rec.end)}</div>
                        <div><strong>Cây trồng:</strong> {rec.cropName ?? rec.cropView?.cropName ?? '-'}</div>
                        <div><strong>Nhân sự:</strong> {safeField(rec.staffName ?? rec.staffFullName)}</div>
                        <div><strong>Email:</strong> {safeField(rec.staffEmail)}</div>
                        <div><strong>SĐT:</strong> {safeField(rec.staffPhone)}</div>
                        <div className="sm:col-span-2"><strong>Created At:</strong> {rec.createdAt ?? '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Thông tin hoạt động</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">Loại hoạt động</div>
                        <div className="text-sm font-medium text-gray-900">{getActivityTypeLabel(selectedActivityForDetails.activityType)}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">Ngày bắt đầu</div>
                        <div className="text-sm font-medium text-gray-900">{formatDisplayDate(selectedActivityForDetails.startDate)}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">Ngày kết thúc</div>
                        <div className="text-sm font-medium text-gray-900">{formatDisplayDate(selectedActivityForDetails.endDate)}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">Trạng thái</div>
                        <div className="text-sm mt-1">{getStatusBadge(selectedActivityForDetails.status)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="py-6 text-center text-sm text-gray-600">Không có dữ liệu chi tiết để hiển thị.</div>
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
              <Label htmlFor="staff">Nhân sự</Label>
              <Select
                value={formData.staffId ? String(formData.staffId) : ''}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    staffId: !v || v === 'none' ? undefined : Number(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân sự" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(staffs) && staffs.length > 0 ? (
                    staffs.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none">Không có nhân sự</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="schedule">Kế hoạch / Thời vụ</Label>
              <Select
                value={formData.scheduleId ? String(formData.scheduleId) : ''}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    scheduleId: !v || v === 'none' ? undefined : Number(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kế hoạch / thời vụ" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(allSchedules) && allSchedules.length > 0 ? (
                    allSchedules
                      .filter(s => s.scheduleId !== undefined && s.scheduleId !== null)
                      .map(s => {
                        const label =
                          (s.cropView?.cropName ?? s.farmView?.farmName ?? `Kế hoạch #${s.scheduleId}`) +
                          (s.startDate || s.endDate ? ` (${formatDate(s.startDate)} → ${formatDate(s.endDate)})` : '')
                        return (
                          <SelectItem key={String(s.scheduleId)} value={String(s.scheduleId)}>
                            {label}
                          </SelectItem>
                        )
                      })
                  ) : (
                    <SelectItem value="none">Không có kế hoạch</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateActivity} disabled={createLoading}>
              {createLoading ? 'Đang tạo...' : 'Tạo'}
            </Button>
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
              <Label htmlFor="editSchedule">Kế hoạch / Thời vụ</Label>
              <Select
                value={formData.scheduleId ? String(formData.scheduleId) : ''}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    scheduleId: !v || v === 'none' ? undefined : Number(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kế hoạch / thời vụ" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(allSchedules) && allSchedules.length > 0 ? (
                    allSchedules
                      .filter(s => s.scheduleId !== undefined && s.scheduleId !== null)
                      .map(s => {
                        const label =
                          (s.cropView?.cropName ?? s.farmView?.farmName ?? `Kế hoạch #${s.scheduleId}`) +
                          (s.startDate || s.endDate ? ` (${formatDate(s.startDate)} → ${formatDate(s.endDate)})` : '')
                        return (
                          <SelectItem key={String(s.scheduleId)} value={String(s.scheduleId)}>
                            {label}
                          </SelectItem>
                        )
                      })
                  ) : (
                    <SelectItem value="none">Không có kế hoạch</SelectItem>
                  )}
                </SelectContent>
              </Select>
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
            <Button onClick={handleUpdateActivity} disabled={editLoading}>
              {editLoading ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  )
}
