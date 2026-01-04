import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Calendar as RBC, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { scheduleService, type PaginatedSchedules, type CreateScheduleRequest, type ScheduleDetail, type ScheduleListItem, type ScheduleStatusString } from '@/shared/api/scheduleService'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Badge } from '@/shared/ui/badge'
import { Loader2, RefreshCw, Settings } from 'lucide-react'
import { toastManager, showErrorToast } from '@/shared/lib/toast-manager'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { scheduleLogService } from '@/shared/api/scheduleLogService'
import ThresholdPanel from '@/features/thresholds/ThresholdPanel'
import { farmService } from '@/shared/api/farmService'
import { cropService } from '@/shared/api/cropService'
import { accountApi } from '@/shared/api/auth'
import { farmActivityService } from '@/shared/api/farmActivityService'
import { handleFetchError, handleCreateError, normalizeError, mapErrorToVietnamese } from '@/shared/lib/error-handler'
import { formatDate } from '@/shared/lib/date-utils'
import type {
  BackendScheduleListProps,
  ScheduleLogItem,
  FarmActivity,
  ActivityOption,
  SortOption
} from './types'
import {
  statusOptions,
  diseaseOptions,
  translateActivityType,
  translatePlantStage,
  getFarmActivityStatusInfo,
  getStatusLabel,
  isActiveStatus,
  getDiseaseLabel,
  getDiseaseSelectValue,
  parseDiseaseStatus
} from './utils/labels'
import { buildEmptyScheduleForm, validateSchedulePayload } from './utils/form'
import ScheduleLogPanel from './components/ScheduleLogPanel'
import ScheduleActionMenu from './components/ScheduleActionMenu'

const BULK_PAGE_SIZE = 50





export function BackendScheduleList({
  showCreate: externalShowCreate,
  onShowCreateChange,
  filteredItems: externalFilteredItems,
  onFilteredItemsChange,
}: BackendScheduleListProps) {
  const [pageIndex, setPageIndex] = useState(1)
  const [pageSize] = useState(10)
  const [data, setData] = useState<PaginatedSchedules | null>(null)
  const [loading, setLoading] = useState(false)
  const [internalShowCreate, setInternalShowCreate] = useState(false)
  const searchTerm = ''
  const statusFilter = 'all' as 'all' | 'active' | 'inactive'
  const sortBy = 'newest' as SortOption
  const [newlyCreatedIds, setNewlyCreatedIds] = useState<Set<number>>(new Set())
  const previousMaxIdRef = useRef<number>(0)

  const showCreate = externalShowCreate ?? internalShowCreate
  const setShowCreate = onShowCreateChange ?? setInternalShowCreate
  const [form, setForm] = useState<CreateScheduleRequest>(buildEmptyScheduleForm)

  const [farms, setFarms] = useState<{ id: number; name: string }[]>([])
  const [crops, setCrops] = useState<{ id: number; name: string; status?: string }[]>([])
  const [staffs, setStaffs] = useState<{ id: number; name: string }[]>([])
  const [activities, setActivities] = useState<ActivityOption[]>([])
  const [metaLoading, setMetaLoading] = useState(false)
  const [allSchedules, setAllSchedules] = useState<ScheduleListItem[]>([])

  const [internalFilteredItems, setInternalFilteredItems] = useState<ScheduleListItem[] | null>(null)
  const filteredItems = externalFilteredItems !== undefined ? externalFilteredItems : internalFilteredItems
  const setFilteredItems = onFilteredItemsChange ?? setInternalFilteredItems

  const [showDetail, setShowDetail] = useState(false)
  const [detailActiveTab, setDetailActiveTab] = useState<'info' | 'logs'>('info')
  const [showEdit, setShowEdit] = useState(false)
  const [showAssignStaff, setShowAssignStaff] = useState(false)
  const [showUpdateStageModal, setShowUpdateStageModal] = useState(false)
  const [showThresholdInline, setShowThresholdInline] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleListItem | null>(null)
  const [scheduleDetail, setScheduleDetail] = useState<ScheduleDetail | null>(null)
  const [editForm, setEditForm] = useState<CreateScheduleRequest>(buildEmptyScheduleForm)
  const [editDetailActivityType, setEditDetailActivityType] = useState<string | null>(null)
  const [assignStaffId, setAssignStaffId] = useState<number>(0)
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})
  const [showLogModal, setShowLogModal] = useState(false)
  const [logModalMode, setLogModalMode] = useState<'create' | 'edit'>('create')
  const [editingLog, setEditingLog] = useState<ScheduleLogItem | null>(null)
  const externalLogUpdaterRef = useRef<((item: ScheduleLogItem | { id: number }, mode: 'create' | 'update' | 'delete') => void) | null>(null)
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [customToday, setCustomToday] = useState<string>('')
  const todayString = useMemo(() => new Date().toISOString().split('T')[0], [])
  const displayItems = filteredItems ?? data?.data.items ?? []
  const lastAutoUpdatedScheduleId = useRef<number | null>(null)

  const filteredSchedules = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return displayItems.filter(schedule => {
      if (statusFilter !== 'all') {
        const isActive = typeof schedule.status === 'number'
          ? schedule.status === 1
          : schedule.status === 'ACTIVE'
        if (statusFilter === 'active' && !isActive) return false
        if (statusFilter === 'inactive' && isActive) return false
      }

      if (normalizedSearch) {
        const cropName = (schedule.cropView?.cropName || '').toLowerCase()
        const farmName = (schedule.farmView?.farmName || '').toLowerCase()
        const staffName = (schedule.staff?.fullname || schedule.staffName || '').toLowerCase()
        if (!cropName.includes(normalizedSearch) &&
          !farmName.includes(normalizedSearch) &&
          !staffName.includes(normalizedSearch)) {
          return false
        }
      }

      return true
    })
  }, [displayItems, searchTerm, statusFilter])

  const sortedSchedules = useMemo(() => {
    const sorted = [...filteredSchedules]

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => {
          const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
          const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
          if (aActive !== bActive) {
            return aActive ? -1 : 1
          }
          const aId = a.scheduleId || 0
          const bId = b.scheduleId || 0
          return bId - aId
        })

      case 'startDate':
        return sorted.sort((a, b) => {
          const aDate = new Date(a.startDate).getTime()
          const bDate = new Date(b.startDate).getTime()
          if (aDate === bDate) {
            const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
            const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
            if (aActive !== bActive) return aActive ? -1 : 1
            return (b.scheduleId || 0) - (a.scheduleId || 0)
          }
          return aDate - bDate
        })

      case 'cropName':
        return sorted.sort((a, b) => {
          const nameA = (a.cropView?.cropName || '').toLowerCase()
          const nameB = (b.cropView?.cropName || '').toLowerCase()
          if (nameA === nameB) {
            const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
            const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
            if (aActive !== bActive) return aActive ? -1 : 1
            return (b.scheduleId || 0) - (a.scheduleId || 0)
          }
          return nameA.localeCompare(nameB, 'vi')
        })

      case 'farmName':
        return sorted.sort((a, b) => {
          const nameA = (a.farmView?.farmName || '').toLowerCase()
          const nameB = (b.farmView?.farmName || '').toLowerCase()
          if (nameA === nameB) {
            const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
            const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
            if (aActive !== bActive) return aActive ? -1 : 1
            return (b.scheduleId || 0) - (a.scheduleId || 0)
          }
          return nameA.localeCompare(nameB, 'vi')
        })

      default:
        return sorted
    }
  }, [filteredSchedules, sortBy])

  const paginatedSchedules = useMemo(() => {
    if (data?.data?.items) {
      return sortedSchedules
    }
    const start = (pageIndex - 1) * pageSize
    return sortedSchedules.slice(start, start + pageSize)
  }, [sortedSchedules, pageIndex, pageSize, data?.data?.items])

  const ManagerCalendar: React.FC = () => {
    const locales: Record<string, any> = { "vi-VN": vi, vi: vi };
    const localizer = dateFnsLocalizer({
      format,
      parse,
      startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
      getDay,
      locales,
    });

    const toRbcEvent = (s: ScheduleListItem) => {
      const start = s.startDate ? new Date(s.startDate) : null;
      const rawEnd = s.endDate ? new Date(s.endDate) : start;
      const isAllDay = true;
      const end = rawEnd
        ? isAllDay
          ? addDays(new Date(rawEnd.getFullYear(), rawEnd.getMonth(), rawEnd.getDate()), 1)
          : rawEnd
        : undefined;
      const isActive = typeof s.status === 'number' ? s.status === 1 : s.status === 'ACTIVE';
      const color = isActive ? "#F59E0B" : "#EF4444";
      return {
        id: s.scheduleId ?? `${s.farmId}-${s.cropId}-${Math.random().toString(36).slice(2, 8)}`,
        title: s.cropView?.cropName ?? s.farmView?.farmName ?? `Thời vụ #${s.scheduleId ?? ''}`,
        start: start ?? undefined,
        end: end ?? undefined,
        allDay: isAllDay,
        color,
        raw: s,
      };
    };

    const calendarDisplayItems = (displayItems || []).filter((s: ScheduleListItem) => {
      if (s.status === null || s.status === undefined) return true
      if (typeof s.status === 'number') return s.status !== 0
      return s.status !== 'DEACTIVATED'
    })

    const mapped = calendarDisplayItems.map(toRbcEvent).filter(ev => !!ev.start);

    const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

    const messages = {
      date: "Ngày",
      time: "Thời gian",
      event: "Sự kiện",
      allDay: "Cả ngày",
      previous: "Trước",
      next: "Sau",
      today: "Hôm nay",
      month: "Tháng",
      week: "Tuần",
      day: "Ngày",
      agenda: "Lịch",
      showMore: (total: number) => `+${total} thêm`,
    };

    const formats = {
      weekdayFormat: (date: Date) => capitalize(date.toLocaleDateString("vi-VN", { weekday: "long" })),
      monthHeaderFormat: (date: Date) => capitalize(date.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })),
      dayHeaderFormat: (date: Date) => capitalize(date.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })),
      dayFormat: (date: Date) => date.getDate().toString(),
    };

    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    const handleToday = useCallback(() => setCurrentDate(new Date()), []);
    const handlePrev = useCallback(() => setCurrentDate(d => { const nd = new Date(d); nd.setMonth(nd.getMonth() - 1); return nd }), []);
    const handleNext = useCallback(() => setCurrentDate(d => { const nd = new Date(d); nd.setMonth(nd.getMonth() + 1); return nd }), []);
    const handleNavigate = useCallback((date: Date) => setCurrentDate(date), []);

    const handleSelectEvent = useCallback((event: any) => {
      const raw = event.raw ?? event;
      if (!raw) return;
      handleViewDetail(raw as ScheduleListItem);
    }, [handleViewDetail]);

    const CustomEvent = (props: any) => {
      const ev = props.event || props.eventData || {};
      const title = ev.title ?? '';
      const raw: ScheduleListItem = ev.raw ?? ev;
      const isContinuation = !!props.continuesPrior;
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>
            {!isContinuation ? title : null}
          </div>
          {raw && raw.scheduleId && (
            <div onClick={(e) => e.stopPropagation()}>
              <ScheduleActionMenu
                schedule={raw}
                onView={handleViewDetail}
                onEdit={handleEdit}
                onViewLogs={(s) => handleViewDetailWithTab(s, 'logs')}
                onAddLog={(s) => openCreateLogForSchedule(s)}
                onAssignStaff={(s) => { setSelectedSchedule(s); handleAssignStaffDialogChange(true); }}
                onUpdateStatus={handleUpdateStatus}
                actionLoading={actionLoading}
              />
            </div>
          )}
        </div>
      )
    }

    const eventStyleGetter = (event: any) => {
      const backgroundColor = event.color || "#10B981";
      const style: React.CSSProperties = {
        backgroundColor,
        borderRadius: "6px",
        color: "#fff",
        border: "1px solid rgba(0,0,0,0.12)",
        padding: "2px 6px",
        fontSize: "13px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
      };
      return { style };
    };

    return (
      <div style={{ width: "100%" }}>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToday}>Hôm nay</Button>
            </div>
            <div className="text-lg font-semibold">{capitalize(currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" }))}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrev}>&lt;</Button>
              <Button variant="outline" size="sm" onClick={handleNext}>&gt;</Button>
            </div>
          </div>
        </div>

        <RBC
          localizer={localizer}
          events={mapped}
          date={currentDate}
          messages={messages}
          formats={formats as any}
          onNavigate={handleNavigate}
          toolbar={false}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.MONTH}
          views={{ month: true }}
          onSelectEvent={handleSelectEvent}
          onShowMore={() => { }}
          popup={false}
          selectable={false}
          eventPropGetter={eventStyleGetter}
          components={{ event: CustomEvent }}
          style={{ minHeight: 500 }}
        />
      </div>
    )
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await scheduleService.getScheduleList(pageIndex, pageSize)

      const currentMaxId = Math.max(...res.data.items.map(s => s.scheduleId || 0), 0)

      if (currentMaxId > previousMaxIdRef.current && previousMaxIdRef.current > 0) {
        setNewlyCreatedIds(new Set([currentMaxId]))
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      }

      previousMaxIdRef.current = currentMaxId

      setData(res)
      setFilteredItems(null)
    } catch (e) {
      handleFetchError(e, toastManager, 'thời vụ')
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize])

  const loadAllSchedules = useCallback(async (silent = false): Promise<ScheduleListItem[]> => {
    try {
      const first = await scheduleService.getScheduleList(1, BULK_PAGE_SIZE)
      let items = [...first.data.items]
      const totalPages = first.data.totalPagesCount
      if (totalPages > 1) {
        const requests: Promise<PaginatedSchedules>[] = []
        for (let page = 2; page <= totalPages; page++) {
          requests.push(scheduleService.getScheduleList(page, BULK_PAGE_SIZE))
        }
        const results = await Promise.all(requests)
        results.forEach(res => {
          items = items.concat(res.data.items)
        })
      }
      setAllSchedules(items)
      return items
    } catch (e) {
      if (!silent) {
        handleFetchError(e, toastManager, 'thời vụ (toàn bộ)')
      }
      return []
    }
  }, [])

  const ensureScheduleValidity = useCallback((payload: CreateScheduleRequest, currentScheduleId?: number) => {
    const result = validateSchedulePayload(payload, allSchedules, currentScheduleId)
    if (!result.valid) {
      toastManager.error(result.errors.map(err => `• ${err}`).join('\n'))
      return false
    }
    return true
  }, [allSchedules])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadAllSchedules(true)
  }, [loadAllSchedules])

  const loadReferenceData = useCallback(async () => {
    const [farmRes, cropRes, staffResRaw, fa] = await Promise.all([
      farmService.getAllFarms(),
      cropService.getAllCropsList(),
      accountApi.getAvailableStaff(),
      farmActivityService.getActiveFarmActivities({ pageIndex: 1, pageSize: 1000 }),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const validActivities = (fa.items || []).filter((a: FarmActivity) => {
      const end = a.endDate ? new Date(a.endDate) : null
      if (end && !Number.isNaN(end.getTime())) {
        return end >= today
      }
      return true
    })

    const formatDateSafe = (value?: string) => {
      if (!value) return ''
      try {
        return formatDate(value)
      } catch {
        return value
      }
    }

    return {
      farmOptions: farmRes.map(f => ({ id: f.farmId, name: f.farmName })),
      cropOptions: cropRes
        .filter(c => c.status === 'ACTIVE')
        .map(c => ({ id: c.cropId, name: c.cropName, status: c.status })),
      staffOptions: (() => {
        const staffList = Array.isArray(staffResRaw) ? staffResRaw : (staffResRaw && (staffResRaw as any).items) || []
        return staffList.map((s: any) => ({
          id: s.accountId,
          name: s.accountProfile?.fullname ?? s.fullname ?? s.email ?? s.username ?? ''
        }))
      })(),
      activityOptions: validActivities.map((a: FarmActivity) => {
        const start = formatDateSafe(a.startDate)
        const end = formatDateSafe(a.endDate)
        const dateLabel = start || end ? ` (${start || '...'} → ${end || '...'})` : ''
        return {
          id: a.farmActivitiesId,
          name: `${translateActivityType(a.activityType)}${dateLabel}`,
        }
      }),
    }
  }, [translateActivityType])

  useEffect(() => {
    const shouldLoadMetadata = showCreate || showEdit || showAssignStaff
    if (!shouldLoadMetadata) return
    let cancelled = false
      ; (async () => {
        try {
          setMetaLoading(true)
          const result = await loadReferenceData()
          if (cancelled) return
          setFarms(result.farmOptions)
          setCrops(result.cropOptions)
          setStaffs(result.staffOptions)
          setActivities(result.activityOptions)
        } catch (e) {
          if (!cancelled) {
            handleFetchError(e, toastManager, 'danh sách tham chiếu')
          }
        } finally {
          if (!cancelled) setMetaLoading(false)
        }
      })()
    return () => {
      cancelled = true
    }
  }, [showCreate, showEdit, showAssignStaff, loadReferenceData])

  const handleCreateDialogChange = useCallback((open: boolean) => {
    setShowCreate(open)
    if (!open) {
      setForm(buildEmptyScheduleForm())
    }
  }, [setShowCreate, setForm])

  const handleEditDialogChange = useCallback((open: boolean) => {
    setShowEdit(open)
    if (!open) {
      setSelectedSchedule(null)
      setEditForm(buildEmptyScheduleForm())
      setEditingScheduleId(null)
      setEditLoading(false)
    }
  }, [setShowEdit, setSelectedSchedule, setEditForm])

  const handleAssignStaffDialogChange = useCallback((open: boolean) => {
    setShowAssignStaff(open)
    if (!open) {
      setAssignStaffId(0)
    }
  }, [setShowAssignStaff, setAssignStaffId])

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const currentMaxId = Math.max(...displayItems.map(s => s.scheduleId || 0), 0)
    previousMaxIdRef.current = currentMaxId

    const payload: CreateScheduleRequest = {
      ...form,
      plantingDate: form.plantingDate || form.startDate,
      harvestDate: form.harvestDate || form.endDate,
    }
    if (!ensureScheduleValidity(payload)) return
    try {
      await scheduleService.createSchedule(payload)
      toastManager.success('Tạo thời vụ thành công')
      handleCreateDialogChange(false)
      await load()
      await loadAllSchedules()
    } catch (e) {
      handleCreateError(e, toastManager, 'thời vụ')
    }
  }

  const handleViewDetail = async (schedule: ScheduleListItem) => {
    if (!schedule.scheduleId) return
    setActionLoading({ [`detail-${schedule.scheduleId}`]: true })
    try {
      const res = await scheduleService.getScheduleById(schedule.scheduleId)
      const normalized = { ...(res.data || {}), diseaseStatus: parseDiseaseStatus((res.data as any)?.diseaseStatus) }
      setScheduleDetail(normalized)
      setSelectedSchedule(schedule)
      setDetailActiveTab('info')
      setShowDetail(true)
    } catch (e) {
      const normalized = normalizeError(e)
      const display = normalized.backendMessage ?? mapErrorToVietnamese(e).vietnamese
      toastManager.error(display || 'Không thể tải chi tiết thời vụ')
    } finally {
      setActionLoading({ [`detail-${schedule.scheduleId}`]: false })
    }
  }

  const handleViewDetailWithTab = async (schedule: ScheduleListItem, tab: 'info' | 'logs') => {
    await handleViewDetail(schedule)
    setDetailActiveTab(tab)
  }

  const openCreateLogForSchedule = (schedule: ScheduleListItem) => {
    setSelectedSchedule(schedule)
    setLogModalMode('create')
    setEditingLog(null)
    setShowLogModal(true)
  }

  useEffect(() => {
    if (showDetail && scheduleDetail?.scheduleId) {
      const scheduleId = scheduleDetail.scheduleId
      if (lastAutoUpdatedScheduleId.current !== scheduleId) {
        lastAutoUpdatedScheduleId.current = scheduleId
          ; (async () => {
            try {
              setActionLoading(prev => ({ ...prev, [`update-today-${scheduleId}`]: true }))
              await scheduleService.updateToday(scheduleId)
              const res = await scheduleService.getScheduleById(scheduleId)
              setScheduleDetail(res.data)
              await load()
              await loadAllSchedules()
            } catch (e) {
              console.error('Auto-update schedule stage failed:', e)
            } finally {
              setActionLoading(prev => ({ ...prev, [`update-today-${scheduleId}`]: false }))
            }
          })()
      }
    } else if (!showDetail) {
      lastAutoUpdatedScheduleId.current = null
    }
  }, [showDetail, scheduleDetail?.scheduleId, load, loadAllSchedules])

  useEffect(() => {
    if (!showDetail) {
      setShowThresholdInline(false)
    }
  }, [showDetail])

  const handleUpdateToday = async (customDate?: string) => {
    if (!scheduleDetail?.scheduleId) return
    const scheduleId = scheduleDetail.scheduleId
    setActionLoading({ [`update-today-${scheduleId}`]: true })
    try {
      await scheduleService.updateToday(scheduleId, customDate)
      toastManager.success('Cập nhật giai đoạn theo ngày thành công')
      const res = await scheduleService.getScheduleById(scheduleId)
      setScheduleDetail(res.data)
      await load()
      await loadAllSchedules()
      if (customDate) {
        setShowUpdateStageModal(false)
        setCustomToday('')
      }
    } catch (e) {
      const normalized = normalizeError(e)
      const display = normalized.backendMessage ?? mapErrorToVietnamese(e).vietnamese
      toastManager.error(display || 'Cập nhật giai đoạn thất bại')
    } finally {
      setActionLoading({ [`update-today-${scheduleId}`]: false })
    }
  }

  const handleUpdateStageByDate = () => {
    if (!customToday) {
      toastManager.error('Bạn cần chọn một ngày để cập nhật giai đoạn.')
      return
    }
    handleUpdateToday(customToday)
  }

  const handleEdit = (schedule: ScheduleListItem) => {
    if (!schedule.scheduleId) return
    setSelectedSchedule(schedule)
    setEditForm(buildEmptyScheduleForm())
    setEditingScheduleId(schedule.scheduleId)
    handleEditDialogChange(true)
  }

  useEffect(() => {
    if (!editingScheduleId) return
    let cancelled = false
    setEditLoading(true)
    setActionLoading({ [`edit-${editingScheduleId}`]: true })
      ; (async () => {
        try {
          setMetaLoading(true)
          let metaResult: {
            farmOptions: { id: number; name: string }[]
            cropOptions: { id: number; name: string; status?: string }[]
            staffOptions: { id: number; name: string }[]
            activityOptions: ActivityOption[]
          } | null = null
          try {
            metaResult = await loadReferenceData()
            if (cancelled) return
            setFarms(metaResult.farmOptions)
            setCrops(metaResult.cropOptions)
            setStaffs(metaResult.staffOptions)
            setActivities(metaResult.activityOptions)
          } catch (metaErr) {
            console.error('Failed to load metadata for edit dialog:', metaErr)
            if (!cancelled) {
              handleFetchError(metaErr, toastManager, 'danh sách tham chiếu')
            }
          } finally {
            if (!cancelled) setMetaLoading(false)
          }

          const res = await scheduleService.getScheduleById(editingScheduleId)
          if (cancelled) return
          const detail = res.data
          setEditDetailActivityType(detail.farmActivityView?.activityType ?? null)

          let resolvedFarmId = detail.farmId ?? detail.farmView?.farmId ?? 0
          if ((!resolvedFarmId || resolvedFarmId === 0) && detail.farmView?.farmName) {
            const matched = (metaResult?.farmOptions || farms).find((f: { id: number; name: string }) => f.name === detail.farmView?.farmName)
            if (matched) resolvedFarmId = matched.id
          }

          let resolvedStaffId = detail.staffId ?? detail.staff?.accountId ?? 0
          if ((!resolvedStaffId || resolvedStaffId === 0) && (detail.staff?.fullname || detail.staffName)) {
            const staffNameToMatch = detail.staff?.fullname ?? detail.staffName
            const matchedStaff = (metaResult?.staffOptions || staffs).find((s: { id: number; name: string }) => {
              if (!s?.name || !staffNameToMatch) return false
              return s.name.trim().toLowerCase() === staffNameToMatch.trim().toLowerCase() || String(s.id) === String(detail.staff?.accountId)
            })
            if (matchedStaff) {
              resolvedStaffId = matchedStaff.id
            } else if (staffNameToMatch) {
              const tempId = detail.staff?.accountId ?? 0
              setStaffs(prev => {
                if (prev.some(p => p.id === tempId && p.name === staffNameToMatch)) return prev
                return [{ id: tempId, name: staffNameToMatch }, ...prev]
              })
              resolvedStaffId = tempId
            }
          }

          let resolvedStatus = 0
          if (typeof detail.status === 'number') {
            resolvedStatus = detail.status
          } else if (typeof detail.status === 'string') {
            const normalized = detail.status.toUpperCase()
            if (normalized === 'ACTIVE') resolvedStatus = 1
            else resolvedStatus = 0
          }

          let resolvedActivityId = detail.farmActivitiesId ?? detail.farmActivityView?.farmActivitiesId ?? 0
          if ((!resolvedActivityId || resolvedActivityId === 0) && detail.farmActivityView?.activityType) {
            const translated = translateActivityType(detail.farmActivityView.activityType)
            const matchedOption = (metaResult?.activityOptions || activities).find((a: ActivityOption) => {
              return a.name.startsWith(translated) || a.name.includes(translated)
            })
            if (matchedOption) {
              resolvedActivityId = matchedOption.id
            }
          }

          setEditForm({
            farmId: resolvedFarmId ?? 0,
            cropId: detail.cropId ?? 0,
            staffId: resolvedStaffId ?? 0,
            startDate: detail.startDate,
            endDate: detail.endDate,
            plantingDate: detail.plantingDate ?? '',
            harvestDate: detail.harvestDate ?? '',
            quantity: detail.quantity,
            status: resolvedStatus,
            pesticideUsed: detail.pesticideUsed,
            diseaseStatus: parseDiseaseStatus((detail as any)?.diseaseStatus) ?? null,
            farmActivitiesId: resolvedActivityId ?? 0,
          })
          const fav = detail.farmActivityView
          const activityIdFromDetail = fav?.farmActivitiesId
          if (fav && activityIdFromDetail) {
            const exists = (metaResult?.activityOptions || activities).some((a: ActivityOption) => a.id === activityIdFromDetail)
            if (!exists) {
              const formatDateSafeLocal = (value?: string) => {
                if (!value) return ''
                try {
                  return formatDate(value)
                } catch {
                  return value || ''
                }
              }
              const start = fav.startDate ? formatDateSafeLocal(fav.startDate) : ''
              const end = fav.endDate ? formatDateSafeLocal(fav.endDate) : ''
              const dateLabel = start || end ? ` (${start || '...'} → ${end || '...'})` : ''
              const name = `${translateActivityType(fav.activityType ?? '')}${dateLabel}`
              setActivities(prev => {
                if (prev.some(p => p.id === activityIdFromDetail)) return prev
                return [...prev, { id: activityIdFromDetail, name }]
              })
            }
          }
          try {
            const staffAccountId = detail.staff?.accountId ?? detail.staffId ?? 0
            const staffDisplayName = detail.staff?.fullname ?? detail.staffName ?? ''
            if (staffAccountId && staffDisplayName) {
              setStaffs(prev => {
                const hasExact = prev.some(p => String(p.id) === String(staffAccountId) && p.name === staffDisplayName)
                if (hasExact) return prev
                const updated = prev.map(p => (String(p.id) === String(staffAccountId) ? { ...p, name: staffDisplayName } : p))
                if (updated.some(p => String(p.id) === String(staffAccountId) && p.name === staffDisplayName)) {
                  return updated
                }
                return [{ id: staffAccountId, name: staffDisplayName }, ...prev]
              })
            }
          } catch {
          }
        } catch (e) {
          if (!cancelled) {
            const normalized = normalizeError(e)
            const display = normalized.backendMessage ?? mapErrorToVietnamese(e).vietnamese
            toastManager.error(display || 'Không thể tải thông tin lịch')
            handleEditDialogChange(false)
          }
        } finally {
          if (!cancelled) {
            setEditLoading(false)
            setActionLoading({ [`edit-${editingScheduleId}`]: false })
            setMetaLoading(false)
          }
        }
      })()
    return () => {
      cancelled = true
    }
  }, [editingScheduleId, handleEditDialogChange, loadReferenceData])

  useEffect(() => {
    if (!editingScheduleId) return
    if (editForm.farmActivitiesId && editForm.farmActivitiesId > 0) return
    if (!editDetailActivityType) return

    const translated = translateActivityType(editDetailActivityType)
    const matched = activities.find(a => a.name.startsWith(translated) || a.name.includes(translated))
    if (matched) {
      setEditForm(prev => ({ ...prev, farmActivitiesId: matched.id }))
    }
  }, [activities, editingScheduleId, editForm.farmActivitiesId, editDetailActivityType])

  const handleUpdateSchedule = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!selectedSchedule?.scheduleId) return
    if (!ensureScheduleValidity(editForm, selectedSchedule.scheduleId)) return
    setActionLoading({ [`update-${selectedSchedule.scheduleId}`]: true })
    try {
      const response = await scheduleService.updateSchedule(selectedSchedule.scheduleId, editForm)
      if (response?.message) {
        toastManager.success(response.message)
      }
      handleEditDialogChange(false)
      await load()
      await loadAllSchedules()
    } catch (e: any) {
      if (e?.message) {
        showErrorToast(e)
      }
    } finally {
      setActionLoading({ [`update-${selectedSchedule.scheduleId}`]: false })
    }
  }


  const handleAssignStaff = async () => {
    if (!selectedSchedule?.scheduleId || !assignStaffId) return
    setActionLoading({ [`assign-${selectedSchedule.scheduleId}`]: true })
    try {
      const response = await scheduleService.assignStaff(selectedSchedule.scheduleId, assignStaffId)
      if (response?.message) {
        toastManager.success(response.message)
      }
      handleAssignStaffDialogChange(false)
      await load()
      await loadAllSchedules()
    } catch (e: any) {
      if (e?.message) {
        showErrorToast(e)
      }
    } finally {
      setActionLoading({ [`assign-${selectedSchedule.scheduleId}`]: false })
    }
  }

  const handleUpdateStatus = async (schedule: ScheduleListItem, nextStatus: ScheduleStatusString) => {
    if (!schedule.scheduleId) return
    setActionLoading({ [`status-${schedule.scheduleId}`]: true })
    try {
      const response = await scheduleService.updateScheduleStatus(schedule.scheduleId, nextStatus)
      if (response?.message) {
        toastManager.success(response.message)
      }
      if (showDetail && scheduleDetail?.scheduleId === schedule.scheduleId) {
        const res = await scheduleService.getScheduleById(schedule.scheduleId)
        setScheduleDetail(res.data)
      }
      await load()
      await loadAllSchedules()
    } catch (e: any) {
      if (e?.message) {
        showErrorToast(e)
      }
    } finally {
      setActionLoading({ [`status-${schedule.scheduleId}`]: false })
    }
  }

  useEffect(() => {
    if (newlyCreatedIds.size > 0) {
      const timer = setTimeout(() => {
        setNewlyCreatedIds(new Set())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [newlyCreatedIds])

  useEffect(() => {
    setPageIndex(1)
  }, [searchTerm, statusFilter, sortBy])

  return (
    <>
      {externalShowCreate === undefined && (
        <div className="w-full sm:w-auto flex items-center">
          <Button onClick={() => setShowCreate(true)} className="bg-green-600 hover:bg-green-700">
            Tạo
          </Button>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          </CardContent>
        </Card>
      ) : paginatedSchedules.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg font-semibold text-gray-900">
              {(() => {
                if (searchTerm) return 'Không tìm thấy thời vụ nào'
                if (statusFilter === 'active') return 'Chưa có thời vụ đang hoạt động'
                if (statusFilter === 'inactive') return 'Chưa có thời vụ đã tạm dừng'
                return 'Chưa có thời vụ'
              })()}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {(() => {
                if (searchTerm) return 'Không có thời vụ nào phù hợp với điều kiện lọc hiện tại.'
                if (statusFilter === 'active') return 'Hãy tạo thời vụ mới hoặc kích hoạt các thời vụ đã tạm dừng.'
                if (statusFilter === 'inactive') return 'Hãy tạo thời vụ mới hoặc kích hoạt các thời vụ đã tạm dừng.'
                return 'Hãy tạo thời vụ đầu tiên.'
              })()}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div>
            <Card>
              <CardContent className="p-6">
                <ManagerCalendar />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog open={showCreate} onOpenChange={handleCreateDialogChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo thời vụ mới</DialogTitle>
          </DialogHeader>
          <form className="grid grid-cols-2 md:grid-cols-3 gap-3" onSubmit={submit}>
            <div>
              <Label>Nông trại</Label>
              <Select
                value={form.farmId ? String(form.farmId) : ''}
                onValueChange={v => setForm({ ...form, farmId: Number(v) })}
                disabled={metaLoading || editLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={metaLoading ? 'Đang tải...' : 'Chọn nông trại'} />
                </SelectTrigger>
                <SelectContent>
                  {farms.map(f => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cây trồng</Label>
              <Select
                value={form.cropId ? String(form.cropId) : ''}
                onValueChange={v => setForm({ ...form, cropId: Number(v) })}
                disabled={metaLoading || editLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={metaLoading ? 'Đang tải...' : 'Chọn cây trồng'} />
                </SelectTrigger>
                <SelectContent className="max-h-56 overflow-y-auto">
                  {crops.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nhân viên</Label>
              <Select
                value={form.staffId ? String(form.staffId) : ''}
                onValueChange={v => setForm({ ...form, staffId: Number(v) })}
                disabled={metaLoading || editLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={metaLoading ? 'Đang tải...' : 'Chọn nhân viên'} />
                </SelectTrigger>
                <SelectContent>
                  {staffs.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ngày bắt đầu</Label>
              <Input
                type="date"
                min={todayString}
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                min={form.startDate || todayString}
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Số lượng</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select
                value={String(form.status)}
                onValueChange={v => setForm({ ...form, status: Number(v) })}
                disabled={metaLoading || editLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tình trạng bệnh</Label>
              <div className="mt-2 text-sm text-gray-700">Không có bệnh</div>
            </div>
            <div>
              <Label>Hoạt động nông trại</Label>
              <Select
                value={form.farmActivitiesId ? String(form.farmActivitiesId) : ''}
                onValueChange={v => setForm({ ...form, farmActivitiesId: Number(v) })}
                disabled={metaLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={metaLoading ? 'Đang tải...' : 'Chọn hoạt động'} />
                </SelectTrigger>
                <SelectContent>
                  {activities.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 col-span-2 md:col-span-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.pesticideUsed}
                  onChange={e => setForm({ ...form, pesticideUsed: e.target.checked })}
                />
                <span>Đã dùng thuốc BVTV</span>
              </label>
              <div className="ml-auto flex gap-2">
                {metaLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Button type="button" variant="outline" size="sm" onClick={() => handleCreateDialogChange(false)}>Hủy</Button>
                <Button type="submit" size="sm" disabled={metaLoading}>Tạo</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between gap-4 pr-8">
            <DialogTitle>Chi tiết thời vụ</DialogTitle>
            {scheduleDetail?.scheduleId && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowThresholdInline(prev => !prev)
                  }}
                  className="p-2"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpdateStageModal(true)}
                  className="flex items-center gap-2"
                >
                  Cập nhật giai đoạn theo ngày
                </Button>
              </div>
            )}
          </DialogHeader>
          {scheduleDetail && (
            <div>
              <Tabs value={detailActiveTab} onValueChange={(v) => setDetailActiveTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="info">Thông tin</TabsTrigger>
                  <TabsTrigger value="logs">Nhật ký</TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                  <div className={`grid grid-cols-1 ${showThresholdInline ? 'lg:grid-cols-[1fr_360px]' : 'lg:grid-cols-1'} gap-6`}>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Thông tin cơ bản</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div><strong>Ngày bắt đầu:</strong> {formatDate(scheduleDetail.startDate)}</div>
                          <div><strong>Ngày kết thúc:</strong> {formatDate(scheduleDetail.endDate)}</div>
                          <div>
                            <strong>Trạng thái:</strong>{' '}
                            <Badge variant={isActiveStatus(scheduleDetail.status) ? 'golden' : 'destructive'}>
                              {getStatusLabel(scheduleDetail.status)}
                            </Badge>
                          </div>
                          <div><strong>Thuốc BVTV:</strong> {scheduleDetail.pesticideUsed ? 'Có' : 'Không'}</div>
                          <div><strong>Tình trạng bệnh:</strong> {getDiseaseLabel(scheduleDetail.diseaseStatus)}</div>
                          <div>
                            <strong>Giai đoạn hiện tại:</strong>{' '}
                            {scheduleDetail.currentPlantStage
                              ? translatePlantStage(scheduleDetail.currentPlantStage)
                              : scheduleDetail.cropView?.plantStage
                                ? translatePlantStage(scheduleDetail.cropView.plantStage)
                                : '-'}
                          </div>
                          <div>
                            <strong>Tạo lúc:</strong>{' '}
                            {scheduleDetail.createdAt ? formatDate(scheduleDetail.createdAt) : '-'}
                          </div>
                        </div>
                      </div>

                      {scheduleDetail.staff && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Thông tin nhân viên</h3>
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div><strong>Họ tên:</strong> {scheduleDetail.staff.fullname ?? scheduleDetail.staffName ?? '-'}</div>
                            <div><strong>Số điện thoại:</strong> {scheduleDetail.staff.phone ?? '-'}</div>
                            {scheduleDetail.staff.email && (
                              <div><strong>Email:</strong> {scheduleDetail.staff.email}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {scheduleDetail.farmView && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Thông tin nông trại</h3>
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div><strong>Tên nông trại:</strong> {scheduleDetail.farmView.farmName ?? `#${scheduleDetail.farmView.farmId}`}</div>
                            <div><strong>Địa điểm:</strong> {scheduleDetail.farmView.location ?? '-'}</div>
                          </div>
                        </div>
                      )}

                      {scheduleDetail.cropView && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Thông tin cây trồng</h3>
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div><strong>Tên cây trồng:</strong> {scheduleDetail.cropView.cropName ?? `#${scheduleDetail.cropView.cropId}`}</div>
                            <div><strong>Số lượng cây trồng:</strong> {scheduleDetail.quantity}</div>
                            {scheduleDetail.cropView.origin && (
                              <div><strong>Nguồn gốc:</strong> {scheduleDetail.cropView.origin}</div>
                            )}
                            {scheduleDetail.cropView.description && (
                              <div className="col-span-2">
                                <strong>Mô tả:</strong>
                                <p className="mt-1 text-sm text-muted-foreground">{scheduleDetail.cropView.description}</p>
                              </div>
                            )}
                          </div>
                          {(() => {
                            const allReqs = (scheduleDetail.cropRequirement ?? scheduleDetail.cropView?.cropRequirement) || []
                            if (!allReqs || allReqs.length === 0) return null

                            const sortedReqs = [...allReqs].sort((a, b) => {
                              const aActive = (a as unknown as { isActive?: boolean }).isActive ? 1 : 0
                              const bActive = (b as unknown as { isActive?: boolean }).isActive ? 1 : 0
                              return bActive - aActive
                            })

                            return (
                              <div className="mt-4">
                                <h4 className="text-md font-semibold mb-3">Yêu cầu cây trồng</h4>
                                <div className="space-y-3">
                                  {sortedReqs.map((req, idx) => {
                                    const r = req as any
                                    const reqIsActive = r.isActive
                                    return (
                                      <div key={r.cropRequirementId ?? idx} className="relative p-4 bg-muted/30 rounded-lg border border-muted">
                                        <div className="absolute right-3 top-3">
                                          <Badge
                                            variant={reqIsActive ? 'success' : 'destructive'}
                                            className="text-xs"
                                          >
                                            {reqIsActive ? 'Hoạt động' : 'Tạm dừng'}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs bg-white">
                                              {translatePlantStage(r.plantStage)}
                                            </Badge>
                                            {r.estimatedDate && (
                                              <span className="text-sm text-muted-foreground">
                                                Ước tính: {r.estimatedDate} ngày
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                          {r.temperature !== null && r.temperature !== undefined && (
                                            <div><strong>Nhiệt độ:</strong> {r.temperature}°C</div>
                                          )}
                                          {r.moisture !== null && r.moisture !== undefined && (
                                            <div><strong>Độ ẩm:</strong> {r.moisture}%</div>
                                          )}
                                          {r.lightRequirement !== null && r.lightRequirement !== undefined && (
                                            <div><strong>Ánh sáng:</strong> {r.lightRequirement}</div>
                                          )}
                                          {r.wateringFrequency && (
                                            <div><strong>Tưới nước:</strong> {r.wateringFrequency} lần/ngày</div>
                                          )}
                                          {r.fertilizer && (
                                            <div className="col-span-2"><strong>Phân bón:</strong> {r.fertilizer}</div>
                                          )}
                                          {r.notes && (
                                            <div className="col-span-2">
                                              <strong>Ghi chú:</strong>
                                              <div className="mt-1 text-sm text-muted-foreground">{r.notes}</div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {scheduleDetail.farmActivityView && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Thông tin hoạt động nông trại</h3>
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                              <strong>Loại hoạt động:</strong>{' '}
                              {scheduleDetail.farmActivityView.activityType
                                ? translateActivityType(scheduleDetail.farmActivityView.activityType)
                                : `#${scheduleDetail.farmActivityView.farmActivitiesId}`}
                            </div>
                            {scheduleDetail.farmActivityView.status && (() => {
                              const statusInfo = getFarmActivityStatusInfo(scheduleDetail.farmActivityView.status)
                              return (
                                <div>
                                  <strong>Trạng thái:</strong>{' '}
                                  <Badge variant={statusInfo.variant}>
                                    {statusInfo.label}
                                  </Badge>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="hidden lg:block">
                      {showThresholdInline && (
                        <div className="sticky top-6 self-start p-4 bg-white rounded-lg border">
                          <h3 className="text-lg font-semibold mb-3">Cấu hình ngưỡng</h3>
                          <ThresholdPanel />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logs">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Nhật ký</h3>
                      <div>
                        <Button size="sm" onClick={() => {
                          if (selectedSchedule) openCreateLogForSchedule(selectedSchedule)
                        }}>Ghi nhận mới
                        </Button>
                      </div>
                    </div>
                    <ScheduleLogPanel scheduleId={scheduleDetail.scheduleId} onEdit={(log) => {
                      setEditingLog(log)
                      setLogModalMode('edit')
                      setShowLogModal(true)
                    }} registerUpdater={(fn) => { externalLogUpdaterRef.current = fn }} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{logModalMode === 'create' ? 'Tạo ghi nhận' : 'Chỉnh sửa ghi nhận'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault()
            const form = e.target as HTMLFormElement
            const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value.trim()
            if (!notes) {
              toastManager.error('Vui lòng nhập nội dung ghi nhận')
              return
            }
            try {
              if (logModalMode === 'create' && selectedSchedule?.scheduleId) {
                const res: any = await scheduleLogService.createLog({
                  scheduleId: selectedSchedule.scheduleId,
                  notes,
                })
                if (res?.status === 1) {
                  if (res?.message) toastManager.success(res.message)
                } else {
                  const msg = res?.message
                  if (msg) throw new Error(msg)
                }
                try {
                  const created = res?.data ?? res
                  const id = created?.cropLogId ?? created?.id ?? -Date.now()
                  const createdAt = ((created?.createdAt ?? created?.created_at) || new Date().toISOString())
                  const createdBy = created?.createdBy ?? created?.created_by ?? null
                  const updatedAt = created?.updatedAt ?? created?.updated_at ?? createdAt
                  const updatedBy = created?.updatedBy ?? created?.updated_by ?? createdBy
                  const newItem: ScheduleLogItem = {
                    id,
                    notes,
                    createdAt,
                    createdBy,
                    updatedAt,
                    updatedBy,
                    staffNameCreate: created?.staffNameCreate ?? created?.staff_name_create ?? created?.staffName ?? null,
                    staffNameUpdate: created?.staffNameUpdate ?? created?.staff_name_update ?? null,
                  }
                  externalLogUpdaterRef.current?.(newItem, 'create')
                } catch (e) {
                }
              } else if (logModalMode === 'edit' && editingLog) {
                const res: any = await scheduleLogService.updateLog({
                  id: editingLog.id,
                  notes,
                })
                if (res?.status === 1) {
                  if (res?.message) toastManager.success(res.message)
                } else {
                  const msg = res?.message
                  if (msg) throw new Error(msg)
                }
                try {
                  const updated = res?.data ?? res
                  const id = editingLog.id
                  const updatedAt = updated?.updatedAt ?? updated?.updated_at ?? new Date().toISOString()
                  const updatedBy = updated?.updatedBy ?? updated?.updated_by ?? null
                  const newItem: ScheduleLogItem = {
                    id,
                    notes,
                    createdAt: editingLog.createdAt,
                    createdBy: editingLog.createdBy,
                    updatedAt,
                    updatedBy,
                    staffNameCreate: editingLog.staffNameCreate ?? null,
                    staffNameUpdate: updated?.staffNameUpdate ?? updated?.staff_name_update ?? null,
                  }
                  externalLogUpdaterRef.current?.(newItem, 'update')
                } catch (e) {
                }
              }
              setShowLogModal(false)
            } catch (err) {
              const msg = (err as any)?.message
              if (msg) toastManager.error(msg)
            }
          }}>
            <div className="grid gap-3">
              <div>
                <Label>Nội dung</Label>
                <textarea name="notes" defaultValue={editingLog?.notes ?? ''} className="w-full p-2 border rounded" rows={4} />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowLogModal(false)}>Hủy</Button>
              <Button type="submit">{logModalMode === 'create' ? 'Lưu' : 'Lưu'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={handleEditDialogChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa lịch tưới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSchedule}>
            <fieldset className="grid grid-cols-2 md:grid-cols-3 gap-3" disabled={editLoading}>
              {editLoading && (
                <div className="col-span-2 md:col-span-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải dữ liệu lịch...
                </div>
              )}
              <div>
                <Label>Farm</Label>
                <Select
                  value={editForm.farmId != null && editForm.farmId > 0 ? String(editForm.farmId) : ''}
                  onValueChange={v => setEditForm({ ...editForm, farmId: Number(v) })}
                  disabled={true}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={metaLoading || editLoading ? 'Đang tải...' : 'Chọn nông trại'} />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map(f => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Crop</Label>
                <Select
                  value={editForm.cropId != null && editForm.cropId > 0 ? String(editForm.cropId) : ''}
                  onValueChange={v => setEditForm({ ...editForm, cropId: Number(v) })}
                  disabled={true}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={metaLoading || editLoading ? 'Đang tải...' : 'Chọn cây trồng'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 overflow-y-auto">
                    {crops.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Staff</Label>
                <Select
                  value={editForm.staffId != null ? String(editForm.staffId) : ''}
                  onValueChange={v => setEditForm({ ...editForm, staffId: Number(v) })}
                  disabled={metaLoading || editLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={metaLoading || editLoading ? 'Đang tải...' : 'Chọn nhân viên'} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffs.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="date"
                  min={todayString}
                  value={editForm.startDate}
                  onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Ngày kết thúc</Label>
                <Input
                  type="date"
                  min={editForm.startDate || todayString}
                  value={editForm.endDate}
                  onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Số lượng</Label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.quantity}
                  onChange={e => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select
                  value={String(editForm.status)}
                  onValueChange={v => setEditForm({ ...editForm, status: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tình trạng bệnh</Label>
                <Select
                  value={getDiseaseSelectValue(editForm.diseaseStatus)}
                  onValueChange={v => {
                    const numValue = Number(v)
                    setEditForm({ ...editForm, diseaseStatus: numValue === -1 ? null : numValue })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {diseaseOptions.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hoạt động</Label>
                <Select
                  value={editForm.farmActivitiesId != null && editForm.farmActivitiesId > 0 ? String(editForm.farmActivitiesId) : ''}
                  onValueChange={v => setEditForm({ ...editForm, farmActivitiesId: Number(v) })}
                  disabled={metaLoading || editLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={metaLoading || editLoading ? 'Đang tải...' : 'Chọn hoạt động'} />
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editPesticide"
                  checked={editForm.pesticideUsed}
                  onChange={e => setEditForm({ ...editForm, pesticideUsed: e.target.checked })}
                />
                <Label htmlFor="editPesticide">Sử dụng thuốc BVTV</Label>
              </div>
            </fieldset>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleEditDialogChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              onClick={handleUpdateSchedule}
              disabled={actionLoading[`update-${selectedSchedule?.scheduleId}`]}
            >
              {actionLoading[`update-${selectedSchedule?.scheduleId}`] && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignStaff} onOpenChange={handleAssignStaffDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phân công nhân viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nhân viên</Label>
              <Select
                value={assignStaffId ? String(assignStaffId) : ''}
                onValueChange={v => setAssignStaffId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {staffs.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleAssignStaffDialogChange(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleAssignStaff}
              disabled={!assignStaffId || actionLoading[`assign-${selectedSchedule?.scheduleId}`]}
            >
              {actionLoading[`assign-${selectedSchedule?.scheduleId}`] && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Phân công
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpdateStageModal} onOpenChange={setShowUpdateStageModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Cập nhật giai đoạn theo ngày
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Input
                id="customToday"
                type="date"
                value={customToday}
                onChange={(e) => setCustomToday(e.target.value)}
                min={scheduleDetail?.startDate ? new Date(scheduleDetail.startDate).toISOString().split('T')[0] : undefined}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowUpdateStageModal(false)
                setCustomToday('')
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateStageByDate}
              disabled={!customToday || actionLoading[`update-today-${scheduleDetail?.scheduleId}`]}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading[`update-today-${scheduleDetail?.scheduleId}`] ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật giai đoạn'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


