import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from '@/shared/ui/drawer'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { ScheduleListItem } from '@/shared/api/scheduleService'
import type { CalendarEvent } from './IrrigationCalendar'
import { formatDate, formatDateTime } from '@/shared/lib/date-utils'
    
const plantStageLabels: Record<string, string> = {
    Sowing: 'Gieo hạt',
    Germination: 'Nảy mầm',
    Seedling: 'Cây con',
    Vegetative: 'Sinh trưởng',
    CotyledonLeaves: 'Ra lá mầm',
    TrueLeavesGrowth: 'Phát triển lá thật',
    VigorousGrowth: 'Tăng trưởng mạnh',
    ReadyForHarvest: 'Sẵn sàng thu hoạch',
    Harvest: 'Thu hoạch',
    PostHarvest: 'Sau thu hoạch',
}

const translatePlantStage = (stage?: string | null) => {
    if (!stage) return '-'
    return plantStageLabels[stage] ?? stage
}

interface ScheduleDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'day' | 'event' | null
  selectedDate: Date | null
  selectedEvent: CalendarEvent | null
  daySchedules: CalendarEvent[]
  loading?: boolean
  getScheduleLabel: (schedule: ScheduleListItem) => string
  getStatusBadge: (status: number | string, isActive?: boolean) => React.ReactNode
  onEdit?: (schedule: ScheduleListItem) => void
  onAssignStaff?: (schedule: ScheduleListItem) => void
  onToggleStatus?: (schedule: ScheduleListItem) => void
}

export function ScheduleDrawer({
  open,
  onOpenChange,
  mode,
  selectedDate,
  selectedEvent,
  daySchedules,
  loading = false,
  getScheduleLabel,
  getStatusBadge,
  onEdit,
  onAssignStaff,
  onToggleStatus,
}: ScheduleDrawerProps) {
    const formatDateLong = (date: Date | null): string => {
        if (!date) return ''
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const [isMobile, setIsMobile] = React.useState(false)
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const drawerRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!open) {
            document.body.style.overflow = ''
            return
        }

        document.body.style.overflow = 'hidden'

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onOpenChange(false)
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [open, onOpenChange])

    if (mode === 'day' && selectedDate) {
        if (isMobile) {
            return (
                <Drawer open={open} onOpenChange={onOpenChange}>
                    <DrawerContent className="max-h-[90vh]">
                        <DrawerHeader>
                            <DrawerTitle>Lịch tưới ngày {formatDateLong(selectedDate)}</DrawerTitle>
                            <DrawerDescription>
                                {daySchedules.length} lịch tưới trong ngày này
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="overflow-y-auto px-4 pb-4">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} className="h-20 w-full" />
                                    ))}
                                </div>
                            ) : daySchedules.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-slate-600 mb-4">Không có lịch tưới nào trong ngày này</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {daySchedules.map(event => {
                                        const schedule = event.resource
                                        const isActive = typeof schedule.status === 'number' ? schedule.status === 1 : schedule.status === 'ACTIVE'

                                        return (
                                            <Card
                                                key={schedule.scheduleId || `${schedule.farmId}-${schedule.cropId}`}
                                                className="cursor-pointer hover:shadow-md transition-shadow"
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold text-slate-900 truncate">
                                                                    {getScheduleLabel(schedule)}
                                                                </h4>
                                                                {getStatusBadge(schedule.status, isActive)}
                                                            </div>

                                                            <div className="text-xs text-slate-600">
                                                                {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                                                            </div>

                                                            {schedule.farmView?.farmName && (
                                                                <div className="text-xs text-slate-600">
                                                                    Nông trại: {schedule.farmView.farmName}
                                                                </div>
                                                            )}

                                                            {schedule.staffName && (
                                                                <div className="text-xs text-slate-600">
                                                                    Nhân viên: {schedule.staffName}
                                                                </div>
                                                            )}

                                                            <div className="text-xs text-slate-600">
                                                                Số lượng: {schedule.quantity} cây
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <DrawerFooter>
                            <DrawerClose asChild>
                                <Button variant="outline">Đóng</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            )
        }

        const drawerContent = (
            <>
                {open && (
                    <div
                        className="fixed inset-0 z-[60] bg-black/50 transition-opacity"
                        style={{
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            position: 'fixed',
                            width: '100vw',
                            height: '100vh'
                        }}
                        onClick={() => onOpenChange(false)}
                        aria-hidden="true"
                    />
                )}
                <div
                    ref={drawerRef}
                    className={cn(
                        'fixed top-0 right-0 z-[70] h-full w-full md:w-[480px] bg-white shadow-xl transition-transform duration-300 ease-in-out overflow-hidden m-0',
                        open ? 'translate-x-0' : 'translate-x-full'
                    )}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="drawer-title"
                >
                    <div className="flex flex-col h-full m-0">
                        <div className="flex items-center justify-between p-6 border-b m-0">
                            <div>
                                <h2 id="drawer-title" className="text-lg font-semibold text-slate-900">
                                    Lịch tưới ngày {formatDateLong(selectedDate)}
                                </h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    {daySchedules.length} lịch tưới trong ngày này
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="h-8 w-8 p-0"
                                aria-label="Đóng"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} className="h-20 w-full" />
                                    ))}
                                </div>
                            ) : daySchedules.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-slate-600">Không có lịch tưới nào trong ngày này</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {daySchedules.map(event => {
                                        const schedule = event.resource
                                        const isActive = typeof schedule.status === 'number' ? schedule.status === 1 : schedule.status === 'ACTIVE'

                                        return (
                                            <Card
                                                key={schedule.scheduleId || `${schedule.farmId}-${schedule.cropId}`}
                                                className="cursor-pointer hover:shadow-md transition-shadow"
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold text-slate-900 truncate">
                                                                    {getScheduleLabel(schedule)}
                                                                </h4>
                                                                {getStatusBadge(schedule.status, isActive)}
                                                            </div>

                                                            <div className="text-sm text-slate-600">
                                                                {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                                                            </div>

                                                            {schedule.farmView?.farmName && (
                                                                <div className="text-sm text-slate-600">
                                                                    Nông trại: {schedule.farmView.farmName}
                                                                </div>
                                                            )}

                                                            {schedule.staffName && (
                                                                <div className="text-sm text-slate-600">
                                                                    Nhân viên: {schedule.staffName}
                                                                </div>
                                                            )}

                                                            <div className="text-sm text-slate-600">
                                                                Số lượng: {schedule.quantity} cây
                                                            </div>

                                                            {schedule.currentPlantStage && (
                                                                <div className="text-sm text-slate-600">
                                                                    Giai đoạn: {translatePlantStage(schedule.currentPlantStage)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        )

        return createPortal(drawerContent, document.body)
    }

    if (mode === 'event' && selectedEvent) {
        const schedule = selectedEvent.resource
        const isActive = typeof schedule.status === 'number' ? schedule.status === 1 : schedule.status === 'ACTIVE'

        if (isMobile) {
            return (
                <Drawer open={open} onOpenChange={onOpenChange}>
                    <DrawerContent className="max-h-[90vh]">
                        <DrawerHeader>
                            <DrawerTitle>Chi tiết lịch tưới</DrawerTitle>
                            <DrawerDescription>
                                {getScheduleLabel(schedule)}
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="overflow-y-auto px-4 pb-4">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            {getStatusBadge(schedule.status, isActive)}
                                            <h4 className="text-base font-semibold">
                                                {getScheduleLabel(schedule)}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Thời gian</p>
                                            <p className="text-sm font-medium">
                                                {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                                            </p>
                                        </div>

                                        {schedule.farmView && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Nông trại</p>
                                                <p className="text-sm font-medium">{schedule.farmView.farmName}</p>
                                                {schedule.farmView.location && (
                                                    <p className="text-xs text-muted-foreground mt-1">{schedule.farmView.location}</p>
                                                )}
                                            </div>
                                        )}

                                        {schedule.staffName && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Nhân viên</p>
                                                <p className="text-sm font-medium">{schedule.staffName}</p>
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Số lượng</p>
                                            <p className="text-sm font-medium">{schedule.quantity} cây</p>
                                        </div>

                                        {schedule.currentPlantStage && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Giai đoạn hiện tại</p>
                                                <p className="text-sm font-medium">{translatePlantStage(schedule.currentPlantStage)}</p>
                                            </div>
                                        )}

                                        {schedule.diseaseStatus !== null && schedule.diseaseStatus !== undefined && schedule.diseaseStatus >= 0 && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Tình trạng bệnh</p>
                                                <p className="text-sm font-medium">
                                                    {schedule.diseaseStatus === -1 ? 'Không có bệnh' : `Bệnh #${schedule.diseaseStatus}`}
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Tạo lúc</p>
                                            <p className="text-sm font-medium">{formatDateTime(schedule.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DrawerFooter>
                            <DrawerClose asChild>
                                <Button variant="outline">Đóng</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            )
        }

        const drawerContent = (
            <>
                {open && (
                    <div
                        className="fixed inset-0 z-[60] bg-black/50 transition-opacity"
                        style={{
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            position: 'fixed',
                            width: '100vw',
                            height: '100vh'
                        }}
                        onClick={() => onOpenChange(false)}
                        aria-hidden="true"
                    />
                )}
                <div
                    ref={drawerRef}
                    className={cn(
                        'fixed top-0 right-0 z-[70] h-full w-full md:w-[480px] bg-white shadow-xl transition-transform duration-300 ease-in-out overflow-hidden m-0',
                        open ? 'translate-x-0' : 'translate-x-full'
                    )}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="drawer-title"
                >
                    <div className="flex flex-col h-full m-0">
                        <div className="flex items-center justify-between p-6 border-b m-0">
                            <div>
                                <h2 id="drawer-title" className="text-lg font-semibold text-slate-900">
                                    Chi tiết lịch tưới
                                </h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    {getScheduleLabel(schedule)}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="h-8 w-8 p-0"
                                aria-label="Đóng"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            {getStatusBadge(schedule.status, isActive)}
                                            <h4 className="text-base font-semibold">
                                                {getScheduleLabel(schedule)}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Thời gian</p>
                                            <p className="text-sm font-medium">
                                                {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                                            </p>
                                        </div>

                                        {schedule.farmView && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Nông trại</p>
                                                <p className="text-sm font-medium">{schedule.farmView.farmName}</p>
                                                {schedule.farmView.location && (
                                                    <p className="text-xs text-muted-foreground mt-1">{schedule.farmView.location}</p>
                                                )}
                                            </div>
                                        )}

                                        {schedule.staffName && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Nhân viên</p>
                                                <p className="text-sm font-medium">{schedule.staffName}</p>
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Số lượng</p>
                                            <p className="text-sm font-medium">{schedule.quantity} cây</p>
                                        </div>

                                        {schedule.currentPlantStage && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Giai đoạn hiện tại</p>
                                                <p className="text-sm font-medium">{translatePlantStage(schedule.currentPlantStage)}</p>
                                            </div>
                                        )}

                                        {schedule.diseaseStatus !== null && schedule.diseaseStatus !== undefined && schedule.diseaseStatus >= 0 && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Tình trạng bệnh</p>
                                                <p className="text-sm font-medium">
                                                    {schedule.diseaseStatus === -1 ? 'Không có bệnh' : `Bệnh #${schedule.diseaseStatus}`}
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Tạo lúc</p>
                                            <p className="text-sm font-medium">{formatDateTime(schedule.createdAt)}</p>
                                        </div>
                                    </div>

                                    {(onEdit || onAssignStaff || onToggleStatus) && (
                                        <div className="pt-4 border-t space-y-2">
                                            {onEdit && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() => {
                                                        onEdit(schedule)
                                                        onOpenChange(false)
                                                    }}
                                                >
                                                    Chỉnh sửa
                                                </Button>
                                            )}
                                            {onAssignStaff && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() => {
                                                        onAssignStaff(schedule)
                                                        onOpenChange(false)
                                                    }}
                                                >
                                                    Phân công nhân viên
                                                </Button>
                                            )}
                                            {onToggleStatus && (
                                                <Button
                                                    variant={isActive ? 'destructive' : 'default'}
                                                    className="w-full"
                                                    onClick={() => {
                                                        onToggleStatus(schedule)
                                                        onOpenChange(false)
                                                    }}
                                                >
                                                    {isActive ? 'Vô hiệu hóa lịch' : 'Kích hoạt lịch'}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        )

        return createPortal(drawerContent, document.body)
    }

    return null
}

