import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { RefreshCw, Search, MoreHorizontal } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Pagination } from '@/shared/ui/pagination'
import { formatDate } from '@/shared/lib/date-utils'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import viLocale from '@fullcalendar/core/locales/vi'

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
import { ManagementPageHeader, StaffFilterBar } from '@/shared/ui'
import { useToast } from '@/shared/ui/use-toast'
import { scheduleService, type ScheduleListItem, type ScheduleStatusString } from '@/shared/api/scheduleService'
// Irrigation calendar helpers were previously imported but are unused here.

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
        Germination: 'Nảy mầm',
        Seedling: 'Cây con',
        Vegetative: 'Sinh trưởng',
        Flowering: 'Ra hoa',
        Harvest: 'Thu hoạch',
    }
    return labels[stage] || stage
}

type SortOption = 'newest' | 'cropName' | 'farmName' | 'status' | 'date'

const StaffSchedulesPage: React.FC = () => {
    const { toast } = useToast()
    const [schedules, setSchedules] = useState<DisplaySchedule[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<SortOption>('newest')
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize] = useState(10)

    const [isScheduleDetailOpen, setIsScheduleDetailOpen] = useState(false)
    const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<DisplaySchedule | null>(null)

    // Calendar state removed: not used in this staff page (keeps UI simpler)

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
    }, [searchQuery, statusFilter, sortBy])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchSchedules()
        setIsRefreshing(false)
        toast({
            title: 'Dữ liệu đã được cập nhật',
            description: 'Thông tin lịch làm việc đã được làm mới.',
        })
    }

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status)
    }

    const filteredSchedules = useMemo(() => {
        return schedules.filter(schedule => {
            if (searchQuery.trim()) {
                const searchTerm = searchQuery.toLowerCase()
                const farmName = schedule.farmView?.farmName?.toLowerCase() || ''
                const cropName = schedule.cropView?.cropName?.toLowerCase() || ''
                const scheduleId = String(schedule.scheduleId || '').toLowerCase()

                if (
                    !farmName.includes(searchTerm) &&
                    !cropName.includes(searchTerm) &&
                    !scheduleId.includes(searchTerm)
                ) {
                    return false
                }
            }

            if (statusFilter !== 'all') {
                if (statusFilter === 'ACTIVE') {
                    if (typeof schedule.status === 'string') {
                        if (schedule.status !== 'ACTIVE') return false
                    } else {
                        if (schedule.status !== 1) return false
                    }
                } else if (statusFilter === 'DEACTIVATED') {
                    if (typeof schedule.status === 'string') {
                        if (schedule.status !== 'DEACTIVATED') return false
                    } else {
                        if (schedule.status !== 0) return false
                    }
                }
            }

            return true
        })
    }, [schedules, searchQuery, statusFilter])

    const sortedSchedules = useMemo(() => {
        const sorted = [...filteredSchedules]

        switch (sortBy) {
            case 'newest':
                return sorted.sort((a, b) => (b.scheduleId || 0) - (a.scheduleId || 0))
            case 'cropName':
                return sorted.sort((a, b) => {
                    const aName = a.cropView?.cropName || ''
                    const bName = b.cropView?.cropName || ''
                    return aName.localeCompare(bName)
                })
            case 'farmName':
                return sorted.sort((a, b) => {
                    const aName = a.farmView?.farmName || ''
                    const bName = b.farmView?.farmName || ''
                    return aName.localeCompare(bName)
                })
            case 'status':
                return sorted.sort((a, b) => {
                    const aActive = typeof a.status === 'string' ? a.status === 'ACTIVE' : a.status === 1
                    const bActive = typeof b.status === 'string' ? b.status === 'ACTIVE' : b.status === 1
                    if (aActive !== bActive) return aActive ? -1 : 1
                    return (a.cropView?.cropName || '').localeCompare(b.cropView?.cropName || '')
                })
            case 'date':
                return sorted.sort((a, b) => {
                    const aDate = new Date(a.startDate).getTime()
                    const bDate = new Date(b.startDate).getTime()
                    return bDate - aDate
                })
            default:
                return sorted
        }
    }, [filteredSchedules, sortBy])

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

    const scheduleStats = useMemo(
        () => ({
            total: schedules.length,
            active: schedules.filter(s => {
                if (typeof s.status === 'string') return s.status === 'ACTIVE'
                return s.status === 1
            }).length,
            inactive: schedules.filter(s => {
                if (typeof s.status === 'string') return s.status === 'DEACTIVATED'
                return s.status === 0
            }).length,
        }),
        [schedules]
    )

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

    // Calendar handlers removed because they're not used on this page.
    // We'll use the local `calendarEvents` memo below which derives from filteredSchedules.

    const formatDateOnly = useCallback((dateString: string) => {
        return formatDate(dateString)
    }, [])

    const handleModalOpenChange = useCallback((open: boolean) => {
        setIsScheduleDetailOpen(open)
        if (!open) {
            setSelectedScheduleDetail(null)
        }
    }, [])

    const memoizedCropRequirements = useMemo(() => {
        if (!selectedScheduleDetail?.cropRequirement) return []
        return selectedScheduleDetail.cropRequirement
    }, [selectedScheduleDetail?.cropRequirement])

    const calendarEvents = useMemo(() => {
        return filteredSchedules.map(s => {
            const cropName = s.cropView?.cropName ?? `Cây #${s.cropId ?? ''}`
            const farmName = s.farmView?.farmName ?? `Nông trại #${s.farmId ?? ''}`
            const stageLabel = getPlantStageLabel(s.currentPlantStage)
            let title = `${cropName} — ${farmName}`
            if (stageLabel) title += ` • ${stageLabel}`
            if (s.quantity) title += ` • ${s.quantity} cây`

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

    const handleCalendarEventClick = (arg: any) => {
        const original: DisplaySchedule | undefined = arg.event.extendedProps?.original
        if (!original) return
        handleViewDetail(original)
    }

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

                {/* Stats Cards */}
                <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Tổng lịch làm việc</p>
                                    <p className="text-2xl font-semibold mt-1">{scheduleStats.total}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Tổng số lịch làm việc được giao cho bạn
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Đang hoạt động</p>
                                    <p className="text-2xl font-semibold mt-1 text-green-600">
                                        {scheduleStats.active}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Lịch làm việc đang được thực hiện
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Đã tạm dừng</p>
                                    <p className="text-2xl font-semibold mt-1 text-orange-600">
                                        {scheduleStats.inactive}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Lịch làm việc đã bị vô hiệu hóa
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Bar */}
                <StaffFilterBar>
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm theo tên nông trại, cây trồng hoặc mã lịch..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tất cả trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                                <SelectItem value="DEACTIVATED">Vô hiệu hóa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select value={sortBy} onValueChange={value => setSortBy(value as SortOption)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sắp xếp" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Mới nhất</SelectItem>
                                <SelectItem value="cropName">Tên cây trồng</SelectItem>
                                <SelectItem value="farmName">Tên nông trại</SelectItem>
                                <SelectItem value="status">Trạng thái</SelectItem>
                                <SelectItem value="date">Ngày bắt đầu</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </StaffFilterBar>

                {/* Calendar View */}
                <div className="mb-6">
                    <Card>
                        <CardContent>
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                                }}
                                locale={viLocale}
                                events={calendarEvents}
                                eventClick={handleCalendarEventClick}
                                height="auto"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Card-based Layout */}
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
                                    if (searchQuery) return 'Không tìm thấy lịch làm việc nào'
                                    if (statusFilter === 'ACTIVE') return 'Chưa có lịch làm việc đang hoạt động'
                                    if (statusFilter === 'DEACTIVATED') return 'Chưa có lịch làm việc vô hiệu hóa'
                                    return 'Chưa có lịch làm việc'
                                })()}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                {(() => {
                                    if (searchQuery) return 'Không có lịch làm việc nào phù hợp với điều kiện tìm kiếm.'
                                    if (statusFilter === 'ACTIVE') return 'Hãy chờ quản lý giao lịch làm việc mới.'
                                    if (statusFilter === 'DEACTIVATED') return 'Không có lịch làm việc nào đã bị vô hiệu hóa.'
                                    return 'Bạn chưa có lịch làm việc nào được giao.'
                                })()}
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

                        {/* Pagination Controls */}
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

                {/* Schedule Detail Dialog */}
                <Dialog open={isScheduleDetailOpen} onOpenChange={handleModalOpenChange}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Chi tiết lịch làm việc
                            </DialogTitle>
                        </DialogHeader>

                        {selectedScheduleDetail ? (
                            <div className="space-y-6">
                                {/* Schedule Information */}
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

                                {/* Farm and Crop Information - Combined */}
                                {(selectedScheduleDetail.farmView || selectedScheduleDetail.cropView) && (
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Farm Information */}
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

                                                {/* Crop Information */}
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

                                {/* Crop Requirements */}
                                {memoizedCropRequirements && memoizedCropRequirements.length > 0 && (
                                    <Card>
                                        <CardContent className="p-6 space-y-4">
                                            <h3 className="text-lg font-semibold mb-4">Yêu cầu cây trồng</h3>
                                            <div className="space-y-4">
                                                {memoizedCropRequirements.map((req: any, index: number) => (
                                                    <div key={req.cropRequirementId || index} className="border rounded-lg p-4 bg-gray-50">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div>
                                                                <span className="font-medium">Giai đoạn:</span>
                                                                <span className="ml-2">{getPlantStageLabel(req.plantStage)}</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Số ngày ước tính:</span>
                                                                <span className="ml-2">{req.estimatedDate || 'N/A'} ngày</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Độ ẩm:</span>
                                                                <span className="ml-2">{req.moisture ? `${req.moisture}%` : 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Nhiệt độ:</span>
                                                                <span className="ml-2">{req.temperature || 'N/A'}°C</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Phân bón:</span>
                                                                <span className="ml-2">{req.fertilizer || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Ánh sáng:</span>
                                                                <span className="ml-2">{req.lightRequirement || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Tần suất tưới:</span>
                                                                <span className="ml-2">{req.wateringFrequency ? `${req.wateringFrequency} lần/ngày` : 'N/A'}</span>
                                                            </div>
                                                            {req.notes && (
                                                                <div className="md:col-span-2">
                                                                    <span className="font-medium">Ghi chú:</span>
                                                                    <p className="mt-1 text-gray-600">{req.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
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
