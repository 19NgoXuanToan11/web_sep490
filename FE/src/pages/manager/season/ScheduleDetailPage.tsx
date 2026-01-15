import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import CalendarShell from '@/components/Calendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import ThresholdPanel from '@/features/thresholds/ThresholdPanel'
import ScheduleLogPanel from '@/features/season/ui/components/ScheduleLogPanel'
import { formatDate } from '@/shared/lib/date-utils'
import { isActiveStatus, getStatusLabel, translatePlantStage, getDiseaseLabel, translateActivityType, getFarmActivityStatusInfo, activityTypeLabels, farmActivityStatusOptions, staffStatusOptions } from '@/features/season/ui/utils/labels'
import { useScheduleData } from '@/features/season/ui/hooks/useScheduleData'
import { useScheduleDialogs } from '@/features/season/ui/hooks/useScheduleDialogs'
import { useScheduleActions } from '@/features/season/ui/hooks/useScheduleActions'
import { UpdateStageModalDialog, CreateActivityDialog, LogModalDialog } from '@/features/season/ui/dialogs'
import { farmActivityService } from '@/shared/api/farmActivityService'
import { showSuccessToast, showErrorToast } from '@/shared/lib/toast-manager'

export const ScheduleDetailPage: React.FC = () => {
    const params = useParams<{ scheduleId: string }>()
    const location = useLocation()
    const scheduleData = useScheduleData()
    const scheduleDialogs = useScheduleDialogs()
    const scheduleActions = useScheduleActions(scheduleData.allSchedules, scheduleData.load, scheduleData.loadAllSchedules)
    const { handleViewDetail } = scheduleActions
    const navigate = useNavigate()

    const scheduleId = useMemo(() => {
        return params.scheduleId ? Number(params.scheduleId) : NaN
    }, [params.scheduleId])

    const [selectedFarmActivity, setSelectedFarmActivity] = useState<any>(null)
    const [selectedFarmActivityId, setSelectedFarmActivityId] = useState<number | null>(null)
    const [showFarmActivityDetail, setShowFarmActivityDetail] = useState(false)
    const [editingFarmActivity, setEditingFarmActivity] = useState<any>(null)
    const [showEditFarmActivity, setShowEditFarmActivity] = useState(false)
    const [statusEditorOpen, setStatusEditorOpen] = useState(false)
    const [statusEditorValue, setStatusEditorValue] = useState<string | null>(null)
    const [statusEditorLoading, setStatusEditorLoading] = useState(false)
    const [assignStaffOpen, setAssignStaffOpen] = useState(false)
    const [assignStaffIdLocal, setAssignStaffIdLocal] = useState<number | null>(null)
    const [assignStaffLoading, setAssignStaffLoading] = useState(false)
    const [localStaffStatusMap, setLocalStaffStatusMap] = useState<Record<string, string>>({})
    const [staffStatusUpdating, setStaffStatusUpdating] = useState<number | string | null>(null)
    const [editFarmActivityForm, setEditFarmActivityForm] = useState<{
        activityType: string
        startDate: string
        endDate: string
        scheduleId?: number
        status?: string
    }>({
        activityType: '',
        startDate: '',
        endDate: '',
        scheduleId: undefined,
        status: 'ACTIVE',
    })
    const [editFarmActivitySubmitting, setEditFarmActivitySubmitting] = useState(false)


    const query = useMemo(() => {
        try {
            return new URLSearchParams(location.search)
        } catch {
            return new URLSearchParams()
        }
    }, [location.search])

    useEffect(() => {
        let cancelled = false
        if (!scheduleId || Number.isNaN(scheduleId)) return
            ; (async () => {
                try {
                    await handleViewDetail({ scheduleId } as any, (detail: any) => {
                        if (cancelled) return
                        scheduleDialogs.setScheduleDetail(detail)
                        scheduleDialogs.setSelectedSchedule({ scheduleId } as any)
                        const tabFromQuery = String(query.get('tab') ?? 'info')
                        scheduleDialogs.setDetailActiveTab(tabFromQuery === 'calendar' || tabFromQuery === 'logs' ? (tabFromQuery as any) : 'info')
                    })
                } catch (e) {
                }
            })()
        return () => { cancelled = true }
    }, [scheduleId, handleViewDetail, scheduleDialogs.setScheduleDetail, scheduleDialogs.setSelectedSchedule, scheduleDialogs.setDetailActiveTab, query])

    const scheduleCalendarEvents = useMemo(() => {
        const detail = scheduleDialogs.scheduleDetail
        if (!detail) return []
        const parseDDMMYYYY = (s?: string | null) => {
            if (!s) return null
            const parts = String(s).split('/')
            if (parts.length !== 3) return null
            const d = Number(parts[0])
            const m = Number(parts[1])
            const y = Number(parts[2])
            if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) return null
            return new Date(y, m - 1, d)
        }
        const activities = Array.isArray(detail.farmActivityView) ? detail.farmActivityView : []
        const mapped = activities
            .map((fa: any) => {
                const start = parseDDMMYYYY(fa.startDate) ?? parseDDMMYYYY(detail.startDate) ?? null
                const end = parseDDMMYYYY(fa.endDate) ?? parseDDMMYYYY(detail.endDate) ?? null
                if (!start || !end) return null
                const rawStatus = fa.fA_Status ?? fa.fAStatus ?? fa.status ?? fa.Status
                const normalizedStatus = String(rawStatus ?? '').toUpperCase()
                const isActive = (rawStatus === 1 || normalizedStatus === 'ACTIVE')
                const isCompleted = normalizedStatus === 'COMPLETED'
                const isDeactivated = normalizedStatus === 'DEACTIVATED'
                return {
                    id: String(fa.farmActivitiesId ?? `${detail.scheduleId}-${Math.random()}`),
                    title: translateActivityType(fa.activityType ?? fa.ActivityType ?? '') || `Hoạt động #${fa.farmActivitiesId ?? ''}`,
                    start,
                    end,
                    allDay: true,
                    isActive,
                    color: isDeactivated ? '#8B0000' : (isCompleted ? '#34D399' : (isActive ? '#F59E0B' : '#9CA3AF')),
                    raw: { ...fa, _parentSchedule: detail },
                }
            })
            .filter((x: any) => x !== null)
            .sort((a: any, b: any) => {
                if ((a.isActive === b.isActive)) return 0
                return a.isActive ? -1 : 1
            })
        return mapped
    }, [scheduleDialogs.scheduleDetail])

    const fetchAndSetActivity = async (farmActivityId: number) => {
        try {
            const payload = await farmActivityService.getStaffByFarmActivityId(farmActivityId)
            setSelectedFarmActivity(payload)
            setSelectedFarmActivityId(farmActivityId)
        } catch (err) {
            console.error('Failed to get farm activity (staff API) by id', err)
        }
    }

    const handleLocalStaffStatusChange = (staffAssignId: number | string, status: string) => {
        setLocalStaffStatusMap((prev) => ({ ...prev, [String(staffAssignId)]: status }))
    }

    const handleUpdateStaffStatus = async (staffAssignId: number | string, status?: string) => {
        if (!selectedFarmActivity) return
        const newStatus = status ?? (localStaffStatusMap[String(staffAssignId)] ?? '')
        if (!newStatus) return
        try {
            setStaffStatusUpdating(staffAssignId)
            const res = await farmActivityService.updateStaffActivityStatus(staffAssignId, newStatus)
            showSuccessToast(res)
            setSelectedFarmActivity((prev: any) => {
                if (!prev) return prev
                if (Array.isArray(prev)) {
                    return prev.map((rec: any) => {
                        const key = rec.stafFarmActivityId ?? rec.Staf_farmActivityId ?? rec.id ?? rec.staffAssignId
                        if (String(key) === String(staffAssignId)) {
                            return { ...rec, individualStatus: newStatus, status: newStatus }
                        }
                        return rec
                    })
                }
                const key = prev.stafFarmActivityId ?? prev.Staf_farmActivityId ?? prev.id ?? prev.staffAssignId
                if (String(key) === String(staffAssignId)) {
                    return { ...prev, individualStatus: newStatus, status: newStatus }
                }
                return prev
            })
        } catch (err) {
            showErrorToast(err)
        } finally {
            setStaffStatusUpdating(null)
        }
    }


    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                        <Button variant="ghost" size="sm" onClick={() => {
                            try {
                                navigate(-1)
                            } catch {
                                navigate('/manager/season')
                            }
                        }} className="mr-3 p-2">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-2xl font-semibold">Chi tiết thời vụ</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {scheduleDialogs.scheduleDetail?.scheduleId && (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => scheduleDialogs.setShowThresholdInline(!scheduleDialogs.showThresholdInline)} className="p-2">
                                    Cấu hình
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => scheduleDialogs.setShowUpdateStageModal(true)}>
                                    Demo cập nhật giai đoạn theo ngày
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {scheduleDialogs.scheduleDetail ? (
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
                                        <Button size="sm" onClick={() => { if (scheduleDialogs.selectedSchedule) scheduleDialogs.setShowCreateActivity(true) }}>
                                            Tạo
                                        </Button>
                                    )}
                                    {scheduleDialogs.detailActiveTab === 'logs' && (
                                        <Button size="sm" onClick={() => { if (scheduleDialogs.selectedSchedule) scheduleDialogs.openCreateLogForSchedule(scheduleDialogs.selectedSchedule) }}>
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
                                                <div><strong>Ngày kết thúc dự kiến:</strong> {formatDate(scheduleDialogs.scheduleDetail.endDate)}</div>
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
                                                    <div><strong>Số lượng:</strong> {scheduleDialogs.scheduleDetail.quantity}</div>
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

                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Yêu cầu cây trồng</h3>
                                            {scheduleDialogs.scheduleDetail.cropView && Array.isArray(scheduleDialogs.scheduleDetail.cropView.cropRequirement) && scheduleDialogs.scheduleDetail.cropView.cropRequirement.length > 0 ? (
                                                <div className="space-y-3">
                                                    {scheduleDialogs.scheduleDetail.cropView.cropRequirement
                                                        .slice()
                                                        .sort((a: any, b: any) => {
                                                            if (a.plantStage && b.plantStage) return String(a.plantStage).localeCompare(String(b.plantStage))
                                                            return (a.cropRequirementId ?? 0) - (b.cropRequirementId ?? 0)
                                                        })
                                                        .map((req: any) => (
                                                            <div key={req.cropRequirementId ?? `${req.plantStage}-${req.cropId}`} className="p-4 bg-muted/50 rounded-lg border">
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    <div><strong>Giai đoạn:</strong> {req.plantStage ? translatePlantStage(req.plantStage) ?? req.plantStage : '-'}</div>
                                                                    <div><strong>Thời gian dự kiến:</strong> {req.estimatedDate !== null && req.estimatedDate !== undefined ? `${req.estimatedDate} ngày` : '-'}</div>
                                                                    <div><strong>Độ ẩm đất:</strong> {req.soilMoisture ?? '-'}</div>
                                                                    <div><strong>Nhiệt độ:</strong> {req.temperature !== null && req.temperature !== undefined ? `${req.temperature} °C` : '-'}</div>
                                                                    <div><strong>Phân bón:</strong> {req.fertilizer ?? '-'}</div>
                                                                    <div><strong>Ánh sáng:</strong> {req.lightRequirement !== null && req.lightRequirement !== undefined ? `${req.lightRequirement} lux` : '-'}</div>
                                                                    <div className="col-span-2"><strong>Tần suất tưới:</strong> {req.wateringFrequency ?? '-'}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-muted/50 rounded-lg">Chưa có yêu cầu</div>
                                            )}
                                        </div>
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
                                            {scheduleDialogs.scheduleDetail && (!Array.isArray(scheduleDialogs.scheduleDetail.farmActivityView) || scheduleDialogs.scheduleDetail.farmActivityView.length === 0) ? (
                                                <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                    <p className="text-sm text-gray-700">
                                                        Chưa có hoạt động nông trại cho thời vụ này. Hãy tạo hoạt động để theo dõi trên lịch.
                                                    </p>
                                                </div>
                                            ) : null}

                                            <CalendarShell
                                                events={scheduleCalendarEvents.map((ev: any) => ({
                                                    id: String(ev.id),
                                                    title: ev.title,
                                                    start: ev.start ?? null,
                                                    end: ev.end ?? null,
                                                    color: ev.color ?? undefined,
                                                    isActive: ev.isActive ?? false,
                                                    participants: [],
                                                    raw: ev.raw ?? null,
                                                }))}
                                                onEventClick={async (raw) => {
                                                    if (!raw) return
                                                    const id = Number(raw.farmActivitiesId ?? raw.farmActivityId ?? raw.id)
                                                    if (!id) {
                                                        setSelectedFarmActivity(raw)
                                                        setShowFarmActivityDetail(true)
                                                        return
                                                    }
                                                    try {
                                                        await scheduleData.loadReferenceData()
                                                        await fetchAndSetActivity(id)
                                                    } catch (err) {
                                                        console.error('Failed to fetch activity for modal', err)
                                                        setSelectedFarmActivity(raw)
                                                    }
                                                    setShowFarmActivityDetail(true)
                                                }}
                                                onEventMenuAction={(_action, _raw) => {
                                                }}
                                                onDayClick={(_date, _events) => {
                                                    try {
                                                    } catch (err) {
                                                        console.error('Failed to handle day click', err)
                                                    }
                                                    scheduleDialogs.setDetailActiveTab('calendar')
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="logs">
                                <div className="space-y-4">
                                    <ScheduleLogPanel scheduleId={scheduleDialogs.scheduleDetail.scheduleId} onEdit={(log) => {
                                        scheduleDialogs.openEditLog(log)
                                    }} registerUpdater={(_fn) => { }} />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="py-8 text-center text-gray-600">Đang tải chi tiết...</div>
                )}
            </div>

            <UpdateStageModalDialog
                open={scheduleDialogs.showUpdateStageModal}
                onOpenChange={scheduleDialogs.setShowUpdateStageModal}
                customToday={scheduleDialogs.customToday}
                onCustomTodayChange={scheduleDialogs.setCustomToday}
                scheduleStartDate={scheduleDialogs.scheduleDetail?.startDate}
                actionLoading={scheduleActions.actionLoading}
                selectedScheduleId={scheduleDialogs.scheduleDetail?.scheduleId}
                onSubmit={() => {
                    if (!scheduleDialogs.scheduleDetail?.scheduleId) return
                    scheduleActions.handleUpdateToday(scheduleDialogs.scheduleDetail.scheduleId, scheduleDialogs.customToday, () => {
                        scheduleActions.handleViewDetail({ scheduleId: scheduleDialogs.scheduleDetail?.scheduleId } as any, (detail) => {
                            scheduleDialogs.setScheduleDetail(detail)
                        })
                        scheduleDialogs.setShowUpdateStageModal(false)
                        scheduleDialogs.setCustomToday('')
                    })
                }}
            />

            <CreateActivityDialog
                open={scheduleDialogs.showCreateActivity}
                onOpenChange={scheduleDialogs.setShowCreateActivity}
                form={scheduleDialogs.createActivityForm}
                onFormChange={scheduleDialogs.setCreateActivityForm}
                metaLoading={scheduleData.metaLoading}
                todayString={new Date().toISOString().split('T')[0]}
                onSubmit={(form) => {
                    const scheduleIdNum = scheduleDialogs.selectedSchedule?.scheduleId ?? scheduleDialogs.scheduleDetail?.scheduleId
                    if (!scheduleIdNum) return
                    scheduleActions.handleCreateActivity({ ...form, scheduleId: scheduleIdNum }, () => {
                        scheduleActions.handleViewDetail({ scheduleId: scheduleIdNum } as any, (detail) => {
                            scheduleDialogs.setScheduleDetail(detail)
                        })
                        scheduleDialogs.setShowCreateActivity(false)
                    })
                }}
            />

            <LogModalDialog
                open={scheduleDialogs.showLogModal}
                onOpenChange={scheduleDialogs.setShowLogModal}
                mode={scheduleDialogs.logModalMode}
                editingLog={scheduleDialogs.editingLog}
                selectedScheduleId={scheduleDialogs.selectedSchedule?.scheduleId}
                onSuccess={() => {
                    if (!scheduleDialogs.scheduleDetail?.scheduleId) return
                    scheduleActions.handleViewDetail({ scheduleId: scheduleDialogs.scheduleDetail.scheduleId } as any, (detail) => {
                        scheduleDialogs.setScheduleDetail(detail)
                    })
                }}
            />
            <Dialog open={showFarmActivityDetail} onOpenChange={setShowFarmActivityDetail}>
                <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="flex items-center justify-between">
                        <DialogTitle>Chi tiết hoạt động</DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-300 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                                onClick={() => {
                                    if (!selectedFarmActivity) return
                                    void (async () => {
                                        try {
                                            const source = Array.isArray(selectedFarmActivity) ? selectedFarmActivity[0] : selectedFarmActivity
                                            const id = Number(source?.farmActivitiesId ?? source?.farmActivityId ?? source?.id)
                                            if (!id) return
                                            await scheduleData.loadReferenceData()
                                            const fullActivity = await farmActivityService.getFarmActivityById(id)
                                            const formatDateForInputLocal = (s?: string | null) => {
                                                if (!s) return ''
                                                try {
                                                    if (s.includes('/')) {
                                                        const parts = String(s).split('/')
                                                        if (parts.length === 3) {
                                                            const day = parts[0].padStart(2, '0')
                                                            const month = parts[1].padStart(2, '0')
                                                            const year = parts[2]
                                                            return `${year}-${month}-${day}`
                                                        }
                                                    }
                                                    if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s
                                                    if (s.includes('T')) return s.split('T')[0]
                                                } catch {
                                                }
                                                return ''
                                            }
                                            const startDate = formatDateForInputLocal(fullActivity.startDate ?? source?.startDate)
                                            const endDate = formatDateForInputLocal(fullActivity.endDate ?? source?.endDate)
                                            setEditingFarmActivity(fullActivity)
                                            setEditFarmActivityForm({
                                                activityType: String(fullActivity.activityType ?? source?.activityType ?? ''),
                                                startDate,
                                                endDate,
                                                scheduleId: (fullActivity as any).scheduleId ?? (source as any).scheduleId ?? undefined,
                                                status:
                                                    (fullActivity as any).fA_Status ??
                                                    (fullActivity as any).fAStatus ??
                                                    (fullActivity as any).status ??
                                                    (source as any).fA_Status ??
                                                    (source as any).status ??
                                                    'ACTIVE',
                                            })
                                            setShowEditFarmActivity(true)
                                        } catch (err) {
                                            console.error('Failed to open edit farm activity', err)
                                            try {
                                                const sourceFallback = Array.isArray(selectedFarmActivity) ? selectedFarmActivity[0] : selectedFarmActivity
                                                if (!sourceFallback) return
                                                const formatDateForInputLocal = (s?: string | null) => {
                                                    if (!s) return ''
                                                    try {
                                                        if (s.includes('/')) {
                                                            const parts = String(s).split('/')
                                                            if (parts.length === 3) {
                                                                const day = parts[0].padStart(2, '0')
                                                                const month = parts[1].padStart(2, '0')
                                                                const year = parts[2]
                                                                return `${year}-${month}-${day}`
                                                            }
                                                        }
                                                        if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s
                                                        if (s.includes('T')) return s.split('T')[0]
                                                    } catch {
                                                    }
                                                    return ''
                                                }
                                                const startDate = formatDateForInputLocal(sourceFallback.startDate ?? sourceFallback.StartDate ?? sourceFallback.start)
                                                const endDate = formatDateForInputLocal(sourceFallback.endDate ?? sourceFallback.EndDate ?? sourceFallback.end)
                                                setEditingFarmActivity(sourceFallback)
                                                setEditFarmActivityForm({
                                                    activityType: String(sourceFallback.activityType ?? sourceFallback.ActivityType ?? ''),
                                                    startDate,
                                                    endDate,
                                                    scheduleId: (sourceFallback as any).scheduleId ?? undefined,
                                                    status:
                                                        (sourceFallback as any).fA_Status ??
                                                        (sourceFallback as any).fAStatus ??
                                                        (sourceFallback as any).status ??
                                                        (sourceFallback as any).Status ??
                                                        'ACTIVE',
                                                })
                                                setShowEditFarmActivity(true)
                                            } catch (err2) {
                                                console.error('Fallback to open edit modal failed', err2)
                                            }
                                        }
                                    })()
                                }}>
                                <span className="font-medium">Chỉnh sửa</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                                onClick={() => {
                                    if (!selectedFarmActivity) return
                                    const currentStatus = String(selectedFarmActivity.fA_Status ?? selectedFarmActivity.fAStatus ?? selectedFarmActivity.status ?? selectedFarmActivity.Status ?? '').toUpperCase() || 'DEACTIVATED'
                                    setStatusEditorValue(currentStatus)
                                    setStatusEditorOpen(true)
                                }}>
                                <span className="font-medium">Chỉnh sửa trạng thái</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-300"
                                onClick={() => {
                                    if (!selectedFarmActivity) return
                                    setAssignStaffIdLocal(selectedFarmActivity.staffId ?? null)
                                    setAssignStaffOpen(true)
                                }}>
                                <span className="font-medium">Gán nhân sự</span>
                            </Button>
                        </div>
                    </DialogHeader>

                    {selectedFarmActivity ? (
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_520px] gap-6 p-4">
                            <div>
                                <div className="p-4 bg-white rounded-md border shadow-sm">
                                    {(() => {
                                        const sample = Array.isArray(selectedFarmActivity) ? selectedFarmActivity[0] : selectedFarmActivity
                                        const info = getFarmActivityStatusInfo(sample?.fA_Status ?? sample?.fAStatus ?? sample?.status ?? sample?.Status)
                                        return (
                                            <>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="text-lg font-medium">{translateActivityType(sample?.activityType ?? sample?.ActivityType ?? '') || 'Hoạt động'}</div>
                                                    <Badge variant={info.variant as any} className="text-sm">{info.label}</Badge>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div><strong>Ngày bắt đầu:</strong> {formatDate(sample?.startDate ?? sample?.StartDate ?? sample?.start)}</div>
                                                    <div><strong>Ngày kết thúc:</strong> {formatDate(sample?.endDate ?? sample?.EndDate ?? sample?.end)}</div>
                                                    <div><strong>Cây trồng:</strong> {sample?.cropName ?? sample?.cropView?.cropName ?? '-'}</div>
                                                </div>
                                            </>
                                        )
                                    })()}
                                </div>
                            </div>

                            <div>
                                <div className="p-4 bg-white rounded-md border shadow-sm">
                                    <div className="mb-3"><strong>Nhân sự được phân công</strong></div>
                                    {Array.isArray(selectedFarmActivity) && selectedFarmActivity.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedFarmActivity.map((staffRec: any, idx: number) => {
                                                const staffKey =
                                                    staffRec.stafFarmActivityId ??
                                                    staffRec.Staf_farmActivityId ??
                                                    staffRec.id ??
                                                    staffRec.staffAssignId ??
                                                    idx
                                                const staffStatus =
                                                    localStaffStatusMap[String(staffKey)] ??
                                                    staffRec.status ??
                                                    staffRec.Status ??
                                                    ''
                                                const staffInfo = getFarmActivityStatusInfo(staffRec.status ?? staffRec.Status)
                                                const individualStatusVal = staffRec.individualStatus ?? staffRec.individualstatus ?? ''
                                                const individualInfo = getFarmActivityStatusInfo(individualStatusVal)
                                                return (
                                                    <div
                                                        key={String(staffKey)}
                                                        className="p-4 bg-muted/50 rounded border flex items-start justify-between"
                                                        style={{ minHeight: 92 }}
                                                    >
                                                        <div>
                                                            <div className="font-medium">
                                                                {staffRec.staffFullName ?? staffRec.staffName ?? staffRec.name ?? 'Chưa có'}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Email: {staffRec.staffEmail ?? staffRec.email ?? '-'}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Số điện thoại: {staffRec.staffPhone ?? staffRec.phone ?? '-'}
                                                            </div>
                                                            {individualStatusVal ? (
                                                                <div className="mt-2 text-sm">
                                                                    <span className="text-muted-foreground mr-2"><strong>Trạng thái công việc:</strong></span>
                                                                    <Badge variant={individualInfo.variant as any} className="text-xs">
                                                                        {individualInfo.label}
                                                                    </Badge>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <Badge variant={staffInfo.variant as any} className="text-sm">
                                                                    {staffInfo.label}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Select value={String(staffStatus)} onValueChange={(v) => handleLocalStaffStatusChange(staffKey, v)}>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Chọn trạng thái" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {staffStatusOptions.map(s => (
                                                                            <SelectItem key={s.value} value={s.value}>
                                                                                {s.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <Button
                                                                    size="sm"
                                                                    disabled={staffStatusUpdating !== null && String(staffStatusUpdating) === String(staffKey)}
                                                                    onClick={async () => {
                                                                        await handleUpdateStaffStatus(staffKey, staffStatus)
                                                                    }}
                                                                >
                                                                    {staffStatusUpdating !== null && String(staffStatusUpdating) === String(staffKey) ? 'Đang...' : 'Lưu'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-3">Không có nhân sự phân công</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4">Không có dữ liệu hoạt động.</div>
                    )}

                    {statusEditorOpen && (
                        <div className="p-3 bg-white border rounded mt-2">
                            <div className="mb-2"><strong>Chọn trạng thái mới</strong></div>
                            <div className="mb-3">
                                <Select value={statusEditorValue ?? ''} onValueChange={(v) => setStatusEditorValue(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[
                                            { value: 'ACTIVE', label: 'Hoạt động' },
                                            { value: 'DEACTIVATED', label: 'Vô hiệu hóa' },
                                        ].map(s => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" onClick={() => { setStatusEditorOpen(false); setStatusEditorValue(null) }}>Hủy</Button>
                                <Button
                                    disabled={
                                        statusEditorLoading ||
                                        !statusEditorValue ||
                                        String(statusEditorValue).toUpperCase() === String(selectedFarmActivity.fA_Status ?? selectedFarmActivity.fAStatus ?? selectedFarmActivity.status ?? selectedFarmActivity.Status ?? '').toUpperCase()
                                    }
                                    onClick={async () => {
                                        if (!selectedFarmActivity || !statusEditorValue) return
                                        const id = Number(selectedFarmActivity.farmActivitiesId ?? selectedFarmActivity.farmActivityId ?? selectedFarmActivity.id)
                                        if (!id) return
                                        try {
                                            setStatusEditorLoading(true)
                                            await farmActivityService.changeStatus(id)
                                            showSuccessToast({ message: 'Cập nhật trạng thái thành công' })
                                            await fetchAndSetActivity(id)
                                            try {
                                                await scheduleData.load()
                                                const parent = selectedFarmActivity?._parentSchedule ?? selectedFarmActivity?.raw ?? null
                                                if (parent && scheduleDialogs.scheduleDetail?.scheduleId === parent.scheduleId) {
                                                    await scheduleActions.handleViewDetail(parent, (detail) => {
                                                        scheduleDialogs.setScheduleDetail(detail)
                                                    })
                                                }
                                            } catch (e) {
                                                console.error('Failed to refresh after status update', e)
                                            }
                                            setStatusEditorOpen(false)
                                            setStatusEditorValue(null)
                                        } catch (err) {
                                            showErrorToast(err)
                                        } finally {
                                            setStatusEditorLoading(false)
                                        }
                                    }}
                                >
                                    {statusEditorLoading ? 'Đang lưu...' : 'Lưu'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {assignStaffOpen && (
                        <div className="p-3 bg-white border rounded mt-2">
                            <div className="mb-2"><strong>Gán nhân sự cho hoạt động</strong></div>
                            <div className="mb-3">
                                <Select value={assignStaffIdLocal ? String(assignStaffIdLocal) : ''} onValueChange={(v) => setAssignStaffIdLocal(v ? Number(v) : null)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn nhân viên" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.isArray(scheduleData.staffs) && scheduleData.staffs.length > 0 ? (
                                            scheduleData.staffs.map(s => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none">Không có nhân sự</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" onClick={() => { setAssignStaffOpen(false); setAssignStaffIdLocal(null) }}>Hủy</Button>
                                <Button
                                    disabled={assignStaffLoading || !assignStaffIdLocal}
                                    onClick={async () => {
                                        if (!selectedFarmActivity) return
                                        const idFromState = selectedFarmActivityId
                                        const source = Array.isArray(selectedFarmActivity) ? selectedFarmActivity[0] : selectedFarmActivity
                                        const derivedId = Number(source?.farmActivitiesId ?? source?.farmActivityId ?? source?.id)
                                        const id = Number(idFromState ?? derivedId)
                                        if (!id || !assignStaffIdLocal) return
                                        try {
                                            setAssignStaffLoading(true)
                                            const res = await farmActivityService.addStaffToFarmActivity(id, assignStaffIdLocal)
                                            showSuccessToast(res)
                                            await fetchAndSetActivity(id)
                                            setAssignStaffOpen(false)
                                            setAssignStaffIdLocal(null)
                                        } catch (err) {
                                            showErrorToast(err)
                                        } finally {
                                            setAssignStaffLoading(false)
                                        }
                                    }}
                                >
                                    {assignStaffLoading ? 'Đang gán...' : 'Gán nhân sự'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={showEditFarmActivity} onOpenChange={setShowEditFarmActivity}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Chỉnh Sửa Hoạt Động Nông Trại</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="editActivityType">Loại hoạt động *</Label>
                            <Select value={editFarmActivityForm.activityType} onValueChange={(v) => setEditFarmActivityForm({ ...editFarmActivityForm, activityType: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại hoạt động" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(activityTypeLabels).map(k => (
                                        <SelectItem key={k} value={k}>
                                            {activityTypeLabels[k]}
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
                                value={editFarmActivityForm.startDate}
                                onChange={e => setEditFarmActivityForm({ ...editFarmActivityForm, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="editEndDate">Ngày kết thúc *</Label>
                            <Input
                                id="editEndDate"
                                type="date"
                                min={editFarmActivityForm.startDate || new Date().toISOString().split('T')[0]}
                                value={editFarmActivityForm.endDate}
                                onChange={e => setEditFarmActivityForm({ ...editFarmActivityForm, endDate: e.target.value })}
                            />
                        </div>
                        {/* Staff is not editable via this modal per API contract; removed from form */}
                        <div>
                            <Label htmlFor="editSchedule">Kế hoạch / Thời vụ</Label>
                            <Select
                                value={editFarmActivityForm.scheduleId ? String(editFarmActivityForm.scheduleId) : ''}
                                onValueChange={(v) => setEditFarmActivityForm({ ...editFarmActivityForm, scheduleId: v ? Number(v) : undefined })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn kế hoạch / thời vụ" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.isArray(scheduleData.allSchedules) && scheduleData.allSchedules.length > 0 ? (
                                        scheduleData.allSchedules
                                            .filter(s => s.scheduleId !== undefined && s.scheduleId !== null)
                                            .map(s => {
                                                const label =
                                                    (s.cropView?.cropName ?? s.farmView?.farmName ?? `Kế hoạch #${s.scheduleId}`) +
                                                    (s.startDate || s.endDate ? ` (${formatDate(s.startDate)} - ${formatDate(s.endDate)})` : '')
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
                            <Select value={editFarmActivityForm.status || 'ACTIVE'} onValueChange={(v) => setEditFarmActivityForm({ ...editFarmActivityForm, status: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    {farmActivityStatusOptions.map(status => (
                                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => { setShowEditFarmActivity(false); setEditingFarmActivity(null) }}>Hủy</Button>
                        <Button
                            disabled={editFarmActivitySubmitting}
                            onClick={async () => {
                                if (!editingFarmActivity) return
                                setEditFarmActivitySubmitting(true)
                                try {
                                    const id = editingFarmActivity.farmActivitiesId
                                    const payloadBody: any = {
                                        farmActivityId: id,
                                        activityType: editFarmActivityForm.activityType,
                                        farmActivityStatus: editFarmActivityForm.status || 'ACTIVE',
                                        startDate: editFarmActivityForm.startDate,
                                        endDate: editFarmActivityForm.endDate,
                                        scheduleId: editFarmActivityForm.scheduleId ?? undefined,
                                    }

                                    const res = await farmActivityService.updateFarmActivity(
                                        id,
                                        {
                                            farmActivityId: payloadBody.farmActivityId,
                                            startDate: payloadBody.startDate,
                                            endDate: payloadBody.endDate,
                                            scheduleId: payloadBody.scheduleId,
                                        } as any,
                                        payloadBody.activityType,
                                        payloadBody.farmActivityStatus
                                    )
                                    showSuccessToast(res)
                                    const updated = res?.data ?? null
                                    if (updated) {
                                        setEditingFarmActivity(updated)
                                        setSelectedFarmActivity(updated)
                                    }
                                    await scheduleData.loadAllSchedules()
                                    if (scheduleDialogs.scheduleDetail?.scheduleId) {
                                        await scheduleActions.handleViewDetail(scheduleDialogs.selectedSchedule!, (detail) => {
                                            scheduleDialogs.setScheduleDetail(detail)
                                        })
                                    }
                                } catch (err) {
                                    showErrorToast(err)
                                } finally {
                                    setEditFarmActivitySubmitting(false)
                                }
                            }}
                        >
                            {editFarmActivitySubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ScheduleDetailPage


