import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { Pagination } from '@/shared/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { cn } from '@/shared/lib/utils'
import { RefreshCw, Search, Settings } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import CalendarShell from '@/components/Calendar'
import ThresholdPanel from '@/features/thresholds/ThresholdPanel'
import { formatDate } from '@/shared/lib/date-utils'
import type { BackendScheduleListProps, ScheduleListItem, ScheduleStatusString, CreateScheduleRequest } from './types'
import { isActiveStatus, getStatusLabel, translatePlantStage, getDiseaseLabel } from './utils/labels'
import ScheduleActionMenu from './components/ScheduleActionMenu'
import ScheduleLogPanel from './components/ScheduleLogPanel'
import { useScheduleData } from './hooks/useScheduleData'
import { useScheduleActions } from './hooks/useScheduleActions'
import { useScheduleDialogs } from './hooks/useScheduleDialogs'
import {
    CreateScheduleDialog,
    EditScheduleDialog,
    AssignStaffDialog,
    CreateActivityDialog,
    LogModalDialog,
    UpdateStageModalDialog,
} from './dialogs'

export function BackendScheduleList({
    showCreate: externalShowCreate,
    onShowCreateChange,
    filteredItems: externalFilteredItems,
}: BackendScheduleListProps) {
    const scheduleData = useScheduleData()
    const scheduleDialogs = useScheduleDialogs()
    const scheduleActions = useScheduleActions(
        scheduleData.allSchedules,
        scheduleData.load,
        scheduleData.loadAllSchedules
    )

    const showCreate = externalShowCreate ?? scheduleDialogs.showCreate
    const filteredItems = externalFilteredItems !== undefined ? externalFilteredItems : null

    const todayString = useMemo(() => new Date().toISOString().split('T')[0], [])

    const setShowCreate = onShowCreateChange ?? scheduleDialogs.setShowCreate

    const displayItems = filteredItems ?? scheduleData.paginatedSchedules
    const lastAutoUpdatedScheduleId = useRef<number | null>(null)
    const externalLogUpdaterRef = useRef<((item: any, mode: 'create' | 'update' | 'delete') => void) | null>(null)

    const scheduleCalendarEvents = useMemo(() => {
        if (!scheduleDialogs.scheduleDetail) return []

        const start = scheduleDialogs.scheduleDetail.startDate ? new Date(scheduleDialogs.scheduleDetail.startDate) : null
        const end = scheduleDialogs.scheduleDetail.endDate ? new Date(scheduleDialogs.scheduleDetail.endDate) : null

        if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return []

        const title = scheduleDialogs.scheduleDetail.cropView?.cropName || `Thời vụ #${scheduleDialogs.scheduleDetail.scheduleId}`

        return [{
            id: String(scheduleDialogs.scheduleDetail.scheduleId),
            title,
            start,
            end,
            allDay: true,
            color: scheduleDialogs.scheduleDetail.status === 1 || scheduleDialogs.scheduleDetail.status === 'ACTIVE' ? '#F59E0B' : '#9CA3AF',
            raw: scheduleDialogs.scheduleDetail,
        }]
    }, [scheduleDialogs.scheduleDetail])


    useEffect(() => {
        const shouldLoadMetadata = showCreate || scheduleDialogs.showCreate || scheduleDialogs.showEdit || scheduleDialogs.showAssignStaff
        if (!shouldLoadMetadata) return
        let cancelled = false
            ; (async () => {
                try {
                    scheduleData.setMetaLoading(true)
                    const result = await scheduleData.loadReferenceData()
                    if (cancelled) return
                    scheduleData.setFarms(result.farmOptions)
                    scheduleData.setCrops(result.cropOptions)
                    scheduleData.setStaffs(result.staffOptions)
                    scheduleData.setActivities(result.activityOptions)
                } catch (e) {
                    if (!cancelled) {
                    }
                } finally {
                    if (!cancelled) scheduleData.setMetaLoading(false)
                }
            })()
        return () => {
            cancelled = true
        }
    }, [showCreate, scheduleDialogs.showEdit, scheduleDialogs.showAssignStaff, scheduleData.loadReferenceData, scheduleData.setFarms, scheduleData.setCrops, scheduleData.setStaffs, scheduleData.setActivities, scheduleData.setMetaLoading])

    const handleCreateDialogChange = useCallback((open: boolean) => {
        scheduleDialogs.handleCreateDialogChange(open)
        setShowCreate(open)
    }, [scheduleDialogs, setShowCreate])

    const handleEditDialogChange = useCallback((open: boolean) => {
        scheduleDialogs.handleEditDialogChange(open)
    }, [scheduleDialogs])

    const handleAssignStaffDialogChange = useCallback((open: boolean) => {
        scheduleDialogs.handleAssignStaffDialogChange(open)
    }, [scheduleDialogs])

    const handleCreateActivityDialogChange = useCallback((open: boolean) => {
        scheduleDialogs.handleCreateActivityDialogChange(open)
    }, [scheduleDialogs])

    const openCreateActivityForSchedule = useCallback((schedule: ScheduleListItem | null) => {
        scheduleDialogs.openCreateActivityForSchedule(schedule)
    }, [scheduleDialogs])

    const submitCreateActivity = useCallback(async (form: {
        activityType: string
        startDate: string
        endDate: string
        staffId?: number
    }) => {
        const scheduleId = scheduleDialogs.selectedSchedule?.scheduleId ?? scheduleDialogs.scheduleDetail?.scheduleId
        if (!scheduleId) {
            return
        }

        await scheduleActions.handleCreateActivity({
            ...form,
            scheduleId,
        }, () => {
            scheduleDialogs.setShowCreateActivity(false)
            if (scheduleDialogs.scheduleDetail?.scheduleId) {
                scheduleActions.handleViewDetail(scheduleDialogs.selectedSchedule!, (detail) => {
                    scheduleDialogs.setScheduleDetail(detail)
                })
            }
        })
    }, [scheduleDialogs, scheduleActions])

    const submitCreateSchedule = useCallback(async (form: CreateScheduleRequest) => {
        const payload: CreateScheduleRequest = {
            farmId: form.farmId,
            cropId: form.cropId,
            startDate: form.startDate,
            endDate: form.endDate,
            plantingDate: form.plantingDate || form.startDate,
            harvestDate: form.harvestDate || form.endDate,
            quantity: form.quantity,
            pesticideUsed: form.pesticideUsed,
            diseaseStatus: form.diseaseStatus ?? null,
            status: 'ACTIVE',
        }

        await scheduleActions.handleCreateSchedule(payload, () => {
            handleCreateDialogChange(false)
        })
    }, [scheduleActions, handleCreateDialogChange])

    const handleViewDetail = useCallback(async (schedule: ScheduleListItem) => {
        await scheduleActions.handleViewDetail(schedule, (detail) => {
            scheduleDialogs.setScheduleDetail(detail)
            scheduleDialogs.setSelectedSchedule(schedule)
            scheduleDialogs.setDetailActiveTab('info')
            scheduleDialogs.setShowDetail(true)
        })
    }, [scheduleActions, scheduleDialogs])

    const handleViewDetailWithTab = useCallback(async (schedule: ScheduleListItem, tab: 'info' | 'calendar' | 'logs') => {
        await handleViewDetail(schedule)
        scheduleDialogs.setDetailActiveTab(tab)
    }, [handleViewDetail, scheduleDialogs])

    const openCreateLogForSchedule = useCallback((schedule: ScheduleListItem) => {
        scheduleDialogs.openCreateLogForSchedule(schedule)
    }, [scheduleDialogs])

    useEffect(() => {
        if (scheduleDialogs.showDetail && scheduleDialogs.scheduleDetail?.scheduleId) {
            const scheduleId = scheduleDialogs.scheduleDetail.scheduleId
            lastAutoUpdatedScheduleId.current = scheduleId
            console.debug('[ScheduleDetail] opened modal for scheduleId:', scheduleId, '- auto-update disabled.')
        } else if (!scheduleDialogs.showDetail) {
            lastAutoUpdatedScheduleId.current = null
            scheduleDialogs.setShowThresholdInline(false)
            console.debug('[ScheduleDetail] closed modal; cleared lastAutoUpdatedScheduleId.')
        }
    }, [scheduleDialogs.showDetail, scheduleDialogs.scheduleDetail?.scheduleId, scheduleDialogs])

    const handleUpdateToday = useCallback(async (customDate?: string) => {
        if (!scheduleDialogs.scheduleDetail?.scheduleId) return
        console.debug('[ScheduleDetail] user-triggered updateToday for scheduleId:', scheduleDialogs.scheduleDetail.scheduleId, 'customDate:', customDate)
        await scheduleActions.handleUpdateToday(scheduleDialogs.scheduleDetail.scheduleId, customDate, () => {
            scheduleActions.handleViewDetail(scheduleDialogs.selectedSchedule!, (detail) => {
                scheduleDialogs.setScheduleDetail(detail)
            })
            if (customDate) {
                scheduleDialogs.setShowUpdateStageModal(false)
                scheduleDialogs.setCustomToday('')
            }
        })
    }, [scheduleDialogs, scheduleActions])

    const handleUpdateStageByDate = useCallback(() => {
        if (!scheduleDialogs.customToday) {
            return
        }
        handleUpdateToday(scheduleDialogs.customToday)
    }, [handleUpdateToday, scheduleDialogs.customToday])

    const handleEdit = useCallback((schedule: ScheduleListItem) => {
        if (!schedule.scheduleId) return
        scheduleDialogs.setSelectedSchedule(schedule)
        scheduleDialogs.setEditingScheduleId(schedule.scheduleId)
        scheduleDialogs.handleEditDialogChange(true)
    }, [scheduleDialogs])

    useEffect(() => {
        if (!scheduleDialogs.editingScheduleId) return
        let cancelled = false
            ; (async () => {
                try {
                    scheduleData.setMetaLoading(true)
                    let metaResult = null
                    try {
                        metaResult = await scheduleData.loadReferenceData()
                        if (cancelled) return
                        scheduleData.setFarms(metaResult.farmOptions)
                        scheduleData.setCrops(metaResult.cropOptions)
                        scheduleData.setStaffs(metaResult.staffOptions)
                        scheduleData.setActivities(metaResult.activityOptions)
                    } catch (metaErr) {
                        console.error('Failed to load metadata for edit dialog:', metaErr)
                    } finally {
                        if (!cancelled) scheduleData.setMetaLoading(false)
                    }

                    scheduleDialogs.setEditForm({} as CreateScheduleRequest)
                } catch (e) {
                    if (!cancelled) {
                        scheduleDialogs.handleEditDialogChange(false)
                    }
                }
            })()
        return () => {
            cancelled = true
        }
    }, [scheduleDialogs.editingScheduleId, scheduleData, scheduleDialogs])

    const handleUpdateSchedule = useCallback(async (form: CreateScheduleRequest) => {
        if (!scheduleDialogs.selectedSchedule?.scheduleId) return
        await scheduleActions.handleUpdateSchedule(scheduleDialogs.selectedSchedule.scheduleId, form, () => {
            scheduleDialogs.handleEditDialogChange(false)
        })
    }, [scheduleDialogs, scheduleActions])

    const handleAssignStaff = useCallback(async () => {
        if (!scheduleDialogs.selectedSchedule?.scheduleId || !scheduleDialogs.assignStaffId) return
        await scheduleActions.handleAssignStaff(scheduleDialogs.selectedSchedule.scheduleId, scheduleDialogs.assignStaffId, () => {
            scheduleDialogs.handleAssignStaffDialogChange(false)
        })
    }, [scheduleDialogs, scheduleActions])

    const handleUpdateStatus = useCallback(async (schedule: ScheduleListItem, nextStatus: ScheduleStatusString) => {
        await scheduleActions.handleUpdateStatus(schedule, nextStatus, () => {
            if (scheduleDialogs.showDetail && scheduleDialogs.scheduleDetail?.scheduleId === schedule.scheduleId) {
                scheduleActions.handleViewDetail(schedule, (detail) => {
                    scheduleDialogs.setScheduleDetail(detail)
                })
            }
        })
    }, [scheduleActions, scheduleDialogs])

    useEffect(() => {
        if (scheduleData.newlyCreatedIds.size > 0) {
            const timer = setTimeout(() => {
                scheduleData.setNewlyCreatedIds(new Set())
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [scheduleData.newlyCreatedIds, scheduleData])

    return (
        <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm theo cây trồng, nông trại..."
                                value={scheduleData.searchTerm}
                                onChange={e => scheduleData.setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select value={scheduleData.statusFilter} onValueChange={value => scheduleData.setStatusFilter(value as typeof scheduleData.statusFilter)}>
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
                    <div className="w-full sm:w-48">
                        <Select value={scheduleData.sortBy} onValueChange={value => scheduleData.setSortBy(value as typeof scheduleData.sortBy)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sắp xếp" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Mới nhất</SelectItem>
                                <SelectItem value="startDate">Ngày bắt đầu</SelectItem>
                                <SelectItem value="cropName">Tên cây trồng</SelectItem>
                                <SelectItem value="farmName">Tên nông trại</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-auto flex items-center">
                        <Button onClick={() => setShowCreate(true)} className="bg-green-600 hover:bg-green-700">
                            Tạo
                        </Button>
                    </div>
                </div>
            </div>

            {scheduleData.loading ? (
                <Card>
                    <CardContent className="p-12">
                        <div className="flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                            <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                        </div>
                    </CardContent>
                </Card>
            ) : displayItems.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <p className="text-lg font-semibold text-gray-900">
                            {(() => {
                                if (scheduleData.searchTerm) return 'Không tìm thấy thời vụ nào'
                                if (scheduleData.statusFilter === 'active') return 'Chưa có thời vụ đang hoạt động'
                                if (scheduleData.statusFilter === 'inactive') return 'Chưa có thời vụ đã tạm dừng'
                                return 'Chưa có thời vụ'
                            })()}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            {(() => {
                                if (scheduleData.searchTerm) return 'Không có thời vụ nào phù hợp với điều kiện lọc hiện tại.'
                                if (scheduleData.statusFilter === 'active') return 'Hãy tạo thời vụ mới hoặc kích hoạt các thời vụ đã tạm dừng.'
                                if (scheduleData.statusFilter === 'inactive') return 'Hãy tạo thời vụ mới hoặc kích hoạt các thời vụ đã tạm dừng.'
                                return 'Hãy tạo thời vụ đầu tiên.'
                            })()}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="space-y-6">
                        {scheduleData.groupedSchedules.map(([cropName, items]) => {
                            return (
                                <div key={cropName} className="space-y-3">
                                    <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900">{cropName}</h3>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                        {items.map((schedule) => {
                                            const isNewlyCreated = schedule.scheduleId ? scheduleData.newlyCreatedIds.has(schedule.scheduleId) : false
                                            const isActive = typeof schedule.status === 'number'
                                                ? schedule.status === 1
                                                : schedule.status === 'ACTIVE'

                                            return (
                                                <Card
                                                    key={schedule.scheduleId ?? `schedule-${schedule.farmId}-${schedule.cropId}`}
                                                    className={cn(
                                                        "hover:shadow-md transition-all cursor-pointer",
                                                        isNewlyCreated && "ring-2 ring-green-500 bg-green-50/50 shadow-lg"
                                                    )}
                                                    onClick={() => handleViewDetail(schedule)}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                    <Badge className={cn(
                                                                        "h-6 items-center whitespace-nowrap text-xs",
                                                                        isActive ? "bg-yellow-500 text-white" : "bg-red-500 text-white"
                                                                    )}>
                                                                        {getStatusLabel(schedule.status)}
                                                                    </Badge>
                                                                    {isNewlyCreated && (
                                                                        <Badge className="h-6 items-center whitespace-nowrap text-xs bg-green-500 text-white">
                                                                            Mới
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-900 font-medium mb-2">
                                                                    {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                                                                </p>

                                                                {schedule.farmView?.farmName && (
                                                                    <p className="text-xs text-gray-600 mb-1 truncate" title={schedule.farmView.farmName}>
                                                                        Nông trại: {schedule.farmView.farmName}
                                                                    </p>
                                                                )}
                                                                {schedule.staffName && (
                                                                    <p className="text-xs text-gray-600 mb-1 truncate" title={schedule.staffName}>
                                                                        Nhân viên: {schedule.staffName}
                                                                    </p>
                                                                )}
                                                                {schedule.quantity !== null && schedule.quantity !== undefined && (
                                                                    <p className="text-xs text-gray-600 mb-1">
                                                                        Số lượng cây trồng: {schedule.quantity}
                                                                    </p>
                                                                )}
                                                                {schedule.currentPlantStage && (
                                                                    <p className="text-xs text-gray-600">
                                                                        Giai đoạn hiện tại: {translatePlantStage(schedule.currentPlantStage)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {schedule.scheduleId && (
                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                    <ScheduleActionMenu
                                                                        schedule={schedule}
                                                                        onView={handleViewDetail}
                                                                        onEdit={handleEdit}
                                                                        onViewLogs={(s) => handleViewDetailWithTab(s, 'logs')}
                                                                        onAddLog={(s) => openCreateLogForSchedule(s)}
                                                                        onAssignStaff={(s) => {
                                                                            scheduleDialogs.setSelectedSchedule(s)
                                                                            scheduleDialogs.handleAssignStaffDialogChange(true)
                                                                        }}
                                                                        onUpdateStatus={handleUpdateStatus}
                                                                        actionLoading={scheduleActions.actionLoading}
                                                                    />
                                                                </div>
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

                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Hiển thị {displayItems.length} / {scheduleData.serverTotalItems}
                        </div>
                        {scheduleData.serverTotalPages > 1 && (
                            <div>
                                <Pagination
                                    currentPage={scheduleData.pageIndex}
                                    totalPages={scheduleData.serverTotalPages}
                                    onPageChange={scheduleData.setPageIndex}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}

            <CreateScheduleDialog
                open={showCreate}
                onOpenChange={handleCreateDialogChange}
                form={scheduleDialogs.form}
                onFormChange={scheduleDialogs.setForm}
                farms={scheduleData.farms}
                crops={scheduleData.crops}
                metaLoading={scheduleData.metaLoading}
                actionLoading={scheduleActions.actionLoading}
                todayString={todayString}
                onSubmit={submitCreateSchedule}
            />

            <Dialog open={scheduleDialogs.showDetail} onOpenChange={scheduleDialogs.setShowDetail}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="flex flex-row items-center justify-between gap-4 pr-8">
                        <DialogTitle>Chi tiết thời vụ</DialogTitle>
                        {scheduleDialogs.scheduleDetail?.scheduleId && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        scheduleDialogs.setShowThresholdInline(!scheduleDialogs.showThresholdInline)
                                    }}
                                    className="p-2"
                                >
                                    <Settings className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => scheduleDialogs.setShowUpdateStageModal(true)}
                                    className="flex items-center gap-2"
                                >
                                    Cập nhật giai đoạn theo ngày
                                </Button>
                            </div>
                        )}
                    </DialogHeader>
                    {scheduleDialogs.scheduleDetail && (
                        <div>
                            <Tabs value={scheduleDialogs.detailActiveTab} onValueChange={(v) => scheduleDialogs.setDetailActiveTab(v as any)}>
                                <div className="flex items-center justify-between">
                                    <TabsList className="flex space-x-2">
                                        <TabsTrigger value="info">Thông tin</TabsTrigger>
                                        <TabsTrigger value="calendar">Lịch</TabsTrigger>
                                        <TabsTrigger value="logs">Nhật ký</TabsTrigger>
                                    </TabsList>
                                    <div className="flex items-center gap-2">
                                        {scheduleDialogs.detailActiveTab === 'calendar' && (
                                            <Button size="sm" onClick={() => { if (scheduleDialogs.selectedSchedule) openCreateActivityForSchedule(scheduleDialogs.selectedSchedule) }}>
                                                Tạo
                                            </Button>
                                        )}
                                        {scheduleDialogs.detailActiveTab === 'logs' && (
                                            <Button size="sm" onClick={() => { if (scheduleDialogs.selectedSchedule) openCreateLogForSchedule(scheduleDialogs.selectedSchedule) }}>
                                                Ghi nhận mới
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <TabsContent value="info">
                                    <div className={`grid grid-cols-1 ${scheduleDialogs.showThresholdInline ? 'lg:grid-cols-[1fr_360px]' : 'lg:grid-cols-1'} gap-6`}>
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">Thông tin cơ bản</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><strong>Ngày bắt đầu:</strong> {formatDate(scheduleDialogs.scheduleDetail.startDate)}</div>
                                                    <div><strong>Ngày kết thúc:</strong> {formatDate(scheduleDialogs.scheduleDetail.endDate)}</div>
                                                    <div>
                                                        <strong>Trạng thái:</strong>{' '}
                                                        <Badge variant={isActiveStatus(scheduleDialogs.scheduleDetail.status) ? 'golden' : 'destructive'}>
                                                            {getStatusLabel(scheduleDialogs.scheduleDetail.status)}
                                                        </Badge>
                                                    </div>
                                                    <div><strong>Thuốc BVTV:</strong> {scheduleDialogs.scheduleDetail.pesticideUsed ? 'Có' : 'Không'}</div>
                                                    <div><strong>Tình trạng bệnh:</strong> {getDiseaseLabel(scheduleDialogs.scheduleDetail.diseaseStatus)}</div>
                                                    <div>
                                                        <strong>Giai đoạn hiện tại:</strong>{' '}
                                                        {scheduleDialogs.scheduleDetail.currentPlantStage
                                                            ? translatePlantStage(scheduleDialogs.scheduleDetail.currentPlantStage)
                                                            : scheduleDialogs.scheduleDetail.cropView?.plantStage
                                                                ? translatePlantStage(scheduleDialogs.scheduleDetail.cropView.plantStage)
                                                                : '-'}
                                                    </div>
                                                    <div>
                                                        <strong>Tạo lúc:</strong>{' '}
                                                        {scheduleDialogs.scheduleDetail.createdAt ? formatDate(scheduleDialogs.scheduleDetail.createdAt) : '-'}
                                                    </div>
                                                </div>
                                            </div>

                                            {scheduleDialogs.scheduleDetail.staff && (
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">Thông tin nhân viên</h3>
                                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                                        <div><strong>Họ tên:</strong> {scheduleDialogs.scheduleDetail.staff.fullname ?? scheduleDialogs.scheduleDetail.staffName ?? '-'}</div>
                                                        <div><strong>Số điện thoại:</strong> {scheduleDialogs.scheduleDetail.staff.phone ?? '-'}</div>
                                                        {scheduleDialogs.scheduleDetail.staff.email && (
                                                            <div><strong>Email:</strong> {scheduleDialogs.scheduleDetail.staff.email}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {scheduleDialogs.scheduleDetail.farmView && (
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">Thông tin nông trại</h3>
                                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                                        <div><strong>Tên nông trại:</strong> {scheduleDialogs.scheduleDetail.farmView.farmName ?? `#${scheduleDialogs.scheduleDetail.farmView.farmId}`}</div>
                                                        <div><strong>Địa điểm:</strong> {scheduleDialogs.scheduleDetail.farmView.location ?? '-'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {scheduleDialogs.scheduleDetail.cropView && (
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">Thông tin cây trồng</h3>
                                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                                        <div><strong>Tên cây trồng:</strong> {scheduleDialogs.scheduleDetail.cropView.cropName ?? `#${scheduleDialogs.scheduleDetail.cropView.cropId}`}</div>
                                                        <div><strong>Số lượng cây trồng:</strong> {scheduleDialogs.scheduleDetail.quantity}</div>
                                                        {scheduleDialogs.scheduleDetail.cropView.origin && (
                                                            <div><strong>Nguồn gốc:</strong> {scheduleDialogs.scheduleDetail.cropView.origin}</div>
                                                        )}
                                                        {scheduleDialogs.scheduleDetail.cropView.description && (
                                                            <div className="col-span-2">
                                                                <strong>Mô tả:</strong>
                                                                <p className="mt-1 text-sm text-muted-foreground">{scheduleDialogs.scheduleDetail.cropView.description}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="hidden lg:block">
                                            {scheduleDialogs.showThresholdInline && (
                                                <div className="sticky top-6 self-start p-4 bg-white rounded-lg border">
                                                    <h3 className="text-lg font-semibold mb-3">Cấu hình ngưỡng</h3>
                                                    <ThresholdPanel />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="calendar">
                                    <div className="space-y-4">
                                        <Card>
                                            <CardContent className="px-6 pt-3 pb-6">
                                                <CalendarShell
                                                    events={scheduleCalendarEvents.map(ev => ({
                                                        id: String(ev.id),
                                                        title: ev.title,
                                                        start: ev.start ?? null,
                                                        end: ev.end ?? null,
                                                        color: ev.color ?? undefined,
                                                        participants: [],
                                                        raw: ev.raw ?? null,
                                                    }))}
                                                    onEventClick={() => { }}
                                                    onEventMenuAction={() => { }}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                <TabsContent value="logs">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div />
                                        </div>
                                        <ScheduleLogPanel scheduleId={scheduleDialogs.scheduleDetail.scheduleId} onEdit={(log) => {
                                            scheduleDialogs.openEditLog(log)
                                        }} registerUpdater={(fn) => { externalLogUpdaterRef.current = fn }} />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <LogModalDialog
                open={scheduleDialogs.showLogModal}
                onOpenChange={scheduleDialogs.setShowLogModal}
                mode={scheduleDialogs.logModalMode}
                editingLog={scheduleDialogs.editingLog}
                selectedScheduleId={scheduleDialogs.selectedSchedule?.scheduleId}
                onSuccess={() => {
                }}
            />

            <EditScheduleDialog
                open={scheduleDialogs.showEdit}
                onOpenChange={handleEditDialogChange}
                form={scheduleDialogs.editForm}
                onFormChange={scheduleDialogs.setEditForm}
                farms={scheduleData.farms}
                crops={scheduleData.crops}
                staffs={scheduleData.staffs}
                activities={scheduleData.activities}
                metaLoading={scheduleData.metaLoading}
                editLoading={false}
                actionLoading={scheduleActions.actionLoading}
                todayString={todayString}
                selectedScheduleId={scheduleDialogs.selectedSchedule?.scheduleId}
                onSubmit={handleUpdateSchedule}
            />

            <AssignStaffDialog
                open={scheduleDialogs.showAssignStaff}
                onOpenChange={handleAssignStaffDialogChange}
                assignStaffId={scheduleDialogs.assignStaffId}
                onAssignStaffIdChange={scheduleDialogs.setAssignStaffId}
                staffs={scheduleData.staffs}
                actionLoading={scheduleActions.actionLoading}
                selectedScheduleId={scheduleDialogs.selectedSchedule?.scheduleId}
                onSubmit={handleAssignStaff}
            />

            <UpdateStageModalDialog
                open={scheduleDialogs.showUpdateStageModal}
                onOpenChange={scheduleDialogs.setShowUpdateStageModal}
                customToday={scheduleDialogs.customToday}
                onCustomTodayChange={scheduleDialogs.setCustomToday}
                scheduleStartDate={scheduleDialogs.scheduleDetail?.startDate}
                actionLoading={scheduleActions.actionLoading}
                selectedScheduleId={scheduleDialogs.scheduleDetail?.scheduleId}
                onSubmit={handleUpdateStageByDate}
            />

            <CreateActivityDialog
                open={scheduleDialogs.showCreateActivity}
                onOpenChange={handleCreateActivityDialogChange}
                form={scheduleDialogs.createActivityForm}
                onFormChange={scheduleDialogs.setCreateActivityForm}
                staffs={scheduleData.staffs}
                metaLoading={scheduleData.metaLoading}
                todayString={todayString}
                onSubmit={submitCreateActivity}
            />
        </>
    )
}






