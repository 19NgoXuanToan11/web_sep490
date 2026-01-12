import React, { useEffect, useMemo } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import CalendarShell from '@/components/Calendar'
import ThresholdPanel from '@/features/thresholds/ThresholdPanel'
import ScheduleLogPanel from '@/features/season/ui/components/ScheduleLogPanel'
import { formatDate } from '@/shared/lib/date-utils'
import { isActiveStatus, getStatusLabel, translatePlantStage, getDiseaseLabel, translateActivityType } from '@/features/season/ui/utils/labels'
import { useScheduleData } from '@/features/season/ui/hooks/useScheduleData'
import { useScheduleDialogs } from '@/features/season/ui/hooks/useScheduleDialogs'
import { useScheduleActions } from '@/features/season/ui/hooks/useScheduleActions'
import { UpdateStageModalDialog, CreateActivityDialog, LogModalDialog } from '@/features/season/ui/dialogs'

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
                const isActive = (fa.status === 1 || String(fa.status).toUpperCase() === 'ACTIVE')
                return {
                    id: String(fa.farmActivitiesId ?? `${detail.scheduleId}-${Math.random()}`),
                    title: translateActivityType(fa.activityType ?? fa.ActivityType ?? '') || `Hoạt động #${fa.farmActivitiesId ?? ''}`,
                    start,
                    end,
                    allDay: true,
                    isActive,
                    color: isActive ? '#F59E0B' : '#9CA3AF',
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
                                                onEventClick={(raw) => {
                                                    if (!raw) return
                                                }}
                                                onEventMenuAction={(_action, _raw) => {
                                                }}
                                                onDayClick={(date, events) => {
                                                    try {
                                                        console.log('Day clicked:', date, events)
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
                staffs={scheduleData.staffs}
                metaLoading={scheduleData.metaLoading}
                onRetryLoadStaffs={scheduleData.loadReferenceData}
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
        </div>
    )
}

export default ScheduleDetailPage


