import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { RefreshCw, MoreHorizontal } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Pagination } from '@/shared/ui/pagination'
import { formatDate } from '@/shared/lib/date-utils'
import CalendarShell from '@/components/Calendar'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { ManagementPageHeader } from '@/shared/ui'
import { useToast } from '@/shared/ui/use-toast'
import { scheduleService, type ScheduleListItem, type ScheduleStatusString } from '@/shared/api/scheduleService'
import { farmActivityService } from '@/shared/api/farmActivityService'

interface DisplaySchedule extends Omit<ScheduleListItem, 'diseaseStatus'> {
    id: string
    currentPlantStage?: string
    diseaseStatus?: string | number
    cropRequirement?: any[]
}

const statusLabelMap: Record<ScheduleStatusString | number, string> = {
    ACTIVE: 'Hoạt động',
    DEACTIVATED: 'Vô hiệu hóa',
    1: 'Hoạt động',
    0: 'Vô hiệu hóa',
}

const getStatusLabel = (status: ScheduleListItem['status']) => {
    if (typeof status === 'string') {
        return statusLabelMap[status as ScheduleStatusString] ?? status
    }
    return statusLabelMap[status] ?? String(status)
}

const getStatusVariant = (status: ScheduleListItem['status']): 'default' | 'secondary' | 'destructive' => {
    if (typeof status === 'string') {
        return status === 'ACTIVE' ? 'default' : 'destructive'
    }
    return status === 1 ? 'default' : 'destructive'
}

const getDiseaseStatusLabel = (diseaseStatus?: string | number) => {
    if (!diseaseStatus) return 'Không có'
    if (typeof diseaseStatus === 'string') {
        const labels: Record<string, string> = {
            DownyMildew: 'Sương mai',
            PowderyMildew: 'Phấn trắng',
            Blight: 'Bệnh cháy lá',
        }
        return labels[diseaseStatus] || diseaseStatus
    }
    return String(diseaseStatus)
}

const getPlantStageLabel = (stage?: string) => {
    if (!stage) return 'N/A'
    const labels: Record<string, string> = {
        Germination: 'Gieo hạt',
        Seedling: 'Nảy mầm',
        Vegetative: 'Tăng trưởng lá',
        Flowering: 'Ra hoa',
        Harvest: 'Thu hoạch',
    }
    return labels[stage] || stage
}

const activityTypeLabels: Record<string, string> = {
    SoilPreparation: 'Chuẩn bị đất',
    Sowing: 'Gieo hạt',
    Thinning: 'Tỉa cây con',
    FertilizingDiluted: 'Bón phân (pha loãng)',
    Weeding: 'Nhổ cỏ',
    PestControl: 'Phòng trừ sâu bệnh',
    FertilizingLeaf: 'Bón phân cho lá',
    Harvesting: 'Thu hoạch',
    CleaningFarmArea: 'Dọn dẹp nông trại',
}

const translateActivityType = (type?: string | null) => {
    if (!type) return ''
    return activityTypeLabels[type] ?? type
}

const StaffSchedulesPage: React.FC = () => {
    const { toast } = useToast()
    const [schedules, setSchedules] = useState<DisplaySchedule[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize] = useState(10)

    const [isScheduleDetailOpen, setIsScheduleDetailOpen] = useState(false)
    const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<DisplaySchedule | null>(null)

    const transformApiSchedule = (apiSchedule: any): DisplaySchedule => {
        return {
            ...apiSchedule,
            id: String(apiSchedule.scheduleId || ''),
            currentPlantStage: apiSchedule.currentPlantStage,
            diseaseStatus: apiSchedule.diseaseStatus,
            cropRequirement: apiSchedule.cropRequirement || apiSchedule.cropView?.cropRequirement || [],
        }
    }

    const fetchSchedules = useCallback(
        async () => {
            try {
                setLoading(true)
                const response = await scheduleService.getSchedulesByStaff()

                const transformedSchedules = (response.data || [])
                    .map((apiSchedule: any) => {
                        try {
                            return transformApiSchedule(apiSchedule)
                        } catch (error) {
                            console.error('Error transforming schedule:', error)
                            return null
                        }
                    })
                    .filter((schedule): schedule is DisplaySchedule => schedule !== null)

                setSchedules(transformedSchedules)
            } catch (error) {
                toast({
                    title: 'Lỗi tải dữ liệu',
                    description: 'Không thể tải danh sách lịch làm việc. Vui lòng thử lại.',
                    variant: 'destructive',
                })
            } finally {
                setLoading(false)
            }
        },
        [toast]
    )

    useEffect(() => {
        fetchSchedules()
    }, [fetchSchedules])

    useEffect(() => {
        setPageIndex(1)
    }, [schedules])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchSchedules()
        setIsRefreshing(false)
        toast({
            title: 'Dữ liệu đã được cập nhật',
            description: 'Thông tin lịch làm việc đã được làm mới.',
        })
    }

    const [isCompleting, setIsCompleting] = useState(false)
    const [isConfirmCompleteOpen, setIsConfirmCompleteOpen] = useState(false)

    const handleCompleteFarmActivity = useCallback(async () => {
        if (!selectedScheduleDetail?.farmActivityView?.farmActivitiesId) return
        const activityId = selectedScheduleDetail.farmActivityView.farmActivitiesId
        setIsCompleting(true)
        try {
            await farmActivityService.completeFarmActivity(activityId, selectedScheduleDetail.farmView?.location)
            toast({ title: 'Hoàn thành', description: 'Hoạt động đã được đánh dấu hoàn thành', variant: 'success' })
            await fetchSchedules()
            if (selectedScheduleDetail?.scheduleId) {
                const res = await scheduleService.getScheduleById(selectedScheduleDetail.scheduleId)
                if (res?.data) {
                    setSelectedScheduleDetail(transformApiSchedule(res.data))
                }
            } else {
                setSelectedScheduleDetail(null)
                setIsScheduleDetailOpen(false)
            }
        } catch (error: any) {
            toast({ title: 'Lỗi', description: error?.message || 'Không thể hoàn thành hoạt động', variant: 'destructive' })
        } finally {
            setIsCompleting(false)
        }
    }, [selectedScheduleDetail, fetchSchedules, toast])

    const filteredSchedules = useMemo(() => schedules, [schedules])

    const sortedSchedules = useMemo(() => {
        return [...filteredSchedules]
    }, [filteredSchedules])

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(sortedSchedules.length / pageSize))
    }, [sortedSchedules.length, pageSize])

    const paginatedSchedules = useMemo(() => {
        const start = (pageIndex - 1) * pageSize
        return sortedSchedules.slice(start, start + pageSize)
    }, [sortedSchedules, pageIndex, pageSize])

    const handlePageChange = (page: number) => {
        setPageIndex(page)
    }

    const handleViewDetail = useCallback((schedule: DisplaySchedule) => {
        const scheduleCopy: DisplaySchedule = {
            ...schedule,
            farmView: schedule.farmView ? { ...schedule.farmView } : undefined,
            cropView: schedule.cropView ? { ...schedule.cropView } : undefined,
            cropRequirement: schedule.cropRequirement
                ? [...(schedule.cropRequirement || [])]
                : undefined,
        }
        setSelectedScheduleDetail(scheduleCopy)
        setIsScheduleDetailOpen(true)
    }, [])

    const formatDateOnly = useCallback((dateString: string) => {
        return formatDate(dateString)
    }, [])

    const handleModalOpenChange = useCallback((open: boolean) => {
        setIsScheduleDetailOpen(open)
        if (!open) {
            setSelectedScheduleDetail(null)
        }
    }, [])


    const calendarEvents = useMemo(() => {
        return filteredSchedules.map(s => {
            const activityTitle = s.farmActivityView?.activityType ? translateActivityType(s.farmActivityView.activityType) : ''
            const title = activityTitle || (s.cropView?.cropName ?? `Cây #${s.cropId ?? ''}`)

            const start = s.startDate ? new Date(s.startDate) : undefined
            const end = s.endDate ? new Date(s.endDate) : undefined

            const color = (typeof s.status === 'string' ? s.status === 'ACTIVE' : s.status === 1) ? '#16a34a' : '#dc2626'

            return {
                id: String(s.id),
                title,
                start,
                end,
                allDay: true,
                backgroundColor: color,
                borderColor: color,
                extendedProps: { original: s },
            }
        })
    }, [filteredSchedules])

    return (
        <StaffLayout>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ManagementPageHeader
                    className="mb-8"
                    title="Quản lý lịch làm việc"
                    description="Xem và quản lý lịch làm việc được giao cho bạn"
                    actions={
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                    }
                />

                <div className="mb-6">
                    <Card>
                        <CardContent>
                            <CalendarShell
                                events={calendarEvents.map(ev => ({
                                    id: String(ev.id),
                                    title: ev.title,
                                    start: ev.start ?? null,
                                    end: ev.end ?? null,
                                    color: ev.backgroundColor ?? undefined,
                                    participants: ev.extendedProps?.original ? [{
                                        id: String(ev.extendedProps.original.managerName || 'm1'),
                                        name: ev.extendedProps.original.managerName,
                                    }] : [],
                                    raw: ev.extendedProps?.original ?? null,
                                }))}
                                onEventClick={(raw) => {
                                    if (!raw) return;
                                    handleViewDetail(raw)
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

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
                                {'Chưa có lịch làm việc'}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                {'Bạn chưa có lịch làm việc nào được giao.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {paginatedSchedules.map((schedule) => {
                                return (
                                    <Card
                                        key={schedule.id}
                                        className="hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => handleViewDetail(schedule)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base font-semibold text-gray-900 truncate mb-2">
                                                        {schedule.cropView?.cropName || `Cây trồng #${schedule.cropId || 'N/A'}`}
                                                    </h3>
                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                        {schedule.currentPlantStage && (
                                                            <Badge variant="outline" className="h-6 items-center whitespace-nowrap text-xs">
                                                                {getPlantStageLabel(schedule.currentPlantStage)}
                                                            </Badge>
                                                        )}
                                                        <Badge
                                                            variant={getStatusVariant(schedule.status)}
                                                            className="h-6 items-center whitespace-nowrap text-xs"
                                                        >
                                                            {getStatusLabel(schedule.status)}
                                                        </Badge>
                                                    </div>
                                                    {schedule.farmView?.farmName && (
                                                        <p className="text-xs text-gray-500 mb-1">
                                                            Nông trại: {schedule.farmView.farmName}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-600 mb-1">
                                                        Thời gian: {formatDateOnly(schedule.startDate)} - {formatDateOnly(schedule.endDate)}
                                                    </p>
                                                    {schedule.quantity && (
                                                        <p className="text-xs text-gray-500">
                                                            Số lượng cây trồng: {schedule.quantity}
                                                        </p>
                                                    )}
                                                </div>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu modal={false}>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48" sideOffset={5}>
                                                            {schedule.scheduleId && (
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.preventDefault()
                                                                        e.stopPropagation()
                                                                        setTimeout(() => {
                                                                            handleViewDetail(schedule)
                                                                        }, 0)
                                                                    }}
                                                                    className="cursor-pointer focus:bg-gray-100"
                                                                >
                                                                    Xem chi tiết
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-6">
                                <Pagination
                                    currentPage={pageIndex}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </>
                )}

                <Dialog open={isScheduleDetailOpen} onOpenChange={handleModalOpenChange}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Chi tiết lịch làm việc
                            </DialogTitle>
                        </DialogHeader>

                        {selectedScheduleDetail ? (
                            <div className="space-y-6">
                                <Card>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <span className="font-medium">Trạng thái:</span>
                                                <span className="ml-2">
                                                    <Badge variant={getStatusVariant(selectedScheduleDetail.status)}>
                                                        {getStatusLabel(selectedScheduleDetail.status)}
                                                    </Badge>
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Ngày bắt đầu:</span>
                                                <span className="ml-2">{formatDateOnly(selectedScheduleDetail.startDate)}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Ngày kết thúc:</span>
                                                <span className="ml-2">{formatDateOnly(selectedScheduleDetail.endDate)}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Giai đoạn hiện tại:</span>
                                                <span className="ml-2">
                                                    <Badge variant="outline">
                                                        {getPlantStageLabel(selectedScheduleDetail.currentPlantStage)}
                                                    </Badge>
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Số lượng:</span>
                                                <span className="ml-2">{selectedScheduleDetail.quantity || 0}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Thuốc BVTV:</span>
                                                <span className="ml-2">
                                                    {selectedScheduleDetail.pesticideUsed ? 'Có' : 'Không'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Tình trạng bệnh:</span>
                                                <span className="ml-2">
                                                    {getDiseaseStatusLabel(selectedScheduleDetail.diseaseStatus)}
                                                </span>
                                            </div>
                                            {selectedScheduleDetail.managerName && (
                                                <div>
                                                    <span className="font-medium">Người quản lý:</span>
                                                    <span className="ml-2">{selectedScheduleDetail.managerName}</span>
                                                </div>
                                            )}
                                            {selectedScheduleDetail.createdAt && (
                                                <div>
                                                    <span className="font-medium">Ngày tạo:</span>
                                                    <span className="ml-2">{formatDateOnly(selectedScheduleDetail.createdAt)}</span>
                                                </div>
                                            )}
                                            {selectedScheduleDetail.updatedAt && (
                                                <div>
                                                    <span className="font-medium">Ngày cập nhật:</span>
                                                    <span className="ml-2">{formatDateOnly(selectedScheduleDetail.updatedAt)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {selectedScheduleDetail.farmActivityView &&
                                    selectedScheduleDetail.farmActivityView.status !== 'COMPLETED' && (
                                        <div className="flex justify-end px-6">
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setIsConfirmCompleteOpen(true)
                                                }}
                                                disabled={isCompleting}
                                            >
                                                {isCompleting ? 'Đang xử lý...' : 'Hoàn thành'}
                                            </Button>
                                        </div>
                                    )}

                                <Dialog open={isConfirmCompleteOpen} onOpenChange={setIsConfirmCompleteOpen}>
                                    <DialogContent className="max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>Xác nhận hoàn thành</DialogTitle>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <p>Bạn có chắc muốn đánh dấu hoạt động này là <strong>Hoàn thành</strong> không?</p>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsConfirmCompleteOpen(false)}
                                                disabled={isCompleting}
                                            >
                                                Hủy
                                            </Button>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setIsConfirmCompleteOpen(false)
                                                    void handleCompleteFarmActivity()
                                                }}
                                                disabled={isCompleting}
                                            >
                                                {isCompleting ? 'Đang xử lý...' : 'Xác nhận'}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                {(selectedScheduleDetail.farmView || selectedScheduleDetail.cropView) && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {selectedScheduleDetail.farmView && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-base font-semibold text-gray-700 border-b pb-2">
                                                            Thông tin nông trại
                                                        </h3>
                                                        <div className="space-y-2">
                                                            <div>
                                                                <span className="text-sm text-gray-600">Tên nông trại:</span>
                                                                <p className="font-medium mt-0.5">
                                                                    {selectedScheduleDetail.farmView.farmName || 'N/A'}
                                                                </p>
                                                            </div>
                                                            {selectedScheduleDetail.farmView.location && (
                                                                <div>
                                                                    <span className="text-sm text-gray-600">Địa điểm:</span>
                                                                    <p className="font-medium mt-0.5">
                                                                        {selectedScheduleDetail.farmView.location}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedScheduleDetail.cropView && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-base font-semibold text-gray-700 border-b pb-2">
                                                            Thông tin cây trồng
                                                        </h3>
                                                        <div className="space-y-2">
                                                            <div>
                                                                <span className="text-sm text-gray-600">Tên cây trồng:</span>
                                                                <p className="font-medium mt-0.5">
                                                                    {selectedScheduleDetail.cropView.cropName || 'N/A'}
                                                                </p>
                                                            </div>
                                                            {selectedScheduleDetail.cropView.description && (
                                                                <div>
                                                                    <span className="text-sm text-gray-600">Mô tả:</span>
                                                                    <p className="text-sm text-gray-700 mt-0.5">
                                                                        {selectedScheduleDetail.cropView.description}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {selectedScheduleDetail.cropView.status && (
                                                                <div>
                                                                    <span className="text-sm text-gray-600">Trạng thái:</span>
                                                                    <div className="mt-0.5">
                                                                        <Badge variant={selectedScheduleDetail.cropView.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                                            {selectedScheduleDetail.cropView.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        ) : null}
                    </DialogContent>
                </Dialog>
            </div>
        </StaffLayout>
    )
}

export default StaffSchedulesPage
