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
import type { FarmActivity } from '@/shared/api/farmActivityService'
import type { CalendarEvent } from './ActivitiesCalendar'

interface ActivityDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'day' | 'event' | null
  selectedDate: Date | null
  selectedEvent: CalendarEvent | null
  dayActivities: CalendarEvent[]
  loading?: boolean
  getActivityTypeLabel: (type: string | null | undefined) => string
  getStatusBadge: (status: string, isOverdue?: boolean) => React.ReactNode
  formatDisplayDate: (date: string | undefined | null) => string
  getActivityProgress: (activity: FarmActivity) => number
  getDaysUntilDue: (activity: FarmActivity) => number | null
  isActivityOverdue: (activity: FarmActivity) => boolean
  onViewActivity: (activity: FarmActivity) => void
  onEditActivity: (activity: FarmActivity) => void
  onToggleStatus: (activity: FarmActivity) => void
  onCreateActivity?: (date: Date) => void
}

export function ActivityDrawer({
  open,
  onOpenChange,
  mode,
  selectedDate,
  selectedEvent,
  dayActivities,
  loading = false,
  getActivityTypeLabel,
  getStatusBadge,
  formatDisplayDate,
  getActivityProgress,
  getDaysUntilDue,
  isActivityOverdue,
  onViewActivity,
  onEditActivity,
  onToggleStatus,
  onCreateActivity,
}: ActivityDrawerProps) {
  const formatDate = (date: Date | null): string => {
    if (!date) return ''
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Detect mobile for responsive drawer
  const [isMobile, setIsMobile] = React.useState(false)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Focus trap and ESC key handling
  const drawerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) {
      // Restore body scroll when drawer closes
      document.body.style.overflow = ''
      return
    }

    // Prevent body scroll when drawer is open
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

  // Day Drawer
  if (mode === 'day' && selectedDate) {
    if (isMobile) {
      // Mobile: bottom sheet
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Hoạt động ngày {formatDate(selectedDate)}</DrawerTitle>
              <DrawerDescription>
                {dayActivities.length} hoạt động trong ngày này
              </DrawerDescription>
            </DrawerHeader>

            <div className="overflow-y-auto px-4 pb-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : dayActivities.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-slate-600 mb-4">Không có hoạt động nào trong ngày này</p>
                  {onCreateActivity && (
                    <Button
                      onClick={() => {
                        onCreateActivity(selectedDate)
                        onOpenChange(false)
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Tạo hoạt động mới
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {dayActivities.map(event => {
                    const activity = event.resource
                    const progress = getActivityProgress(activity)
                    const daysUntilDue = getDaysUntilDue(activity)
                    const overdue = isActivityOverdue(activity)
                    const status = (activity.status || '').toUpperCase()
                    const isActive = status === 'ACTIVE' || status === 'IN_PROGRESS'
                    const isCompleted = status === 'COMPLETED'

                    return (
                      <Card
                        key={activity.farmActivitiesId}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onViewActivity(activity)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900 truncate">
                                  {getActivityTypeLabel(activity.activityType)}
                                </h4>
                                {getStatusBadge(activity.status, overdue)}
                              </div>

                              <div className="text-xs text-slate-600">
                                {formatDisplayDate(activity.startDate)} -{' '}
                                {formatDisplayDate(activity.endDate)}
                              </div>

                              {isActive && !isCompleted && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-600">Tiến độ</span>
                                    <span className="font-semibold text-slate-900">{progress}%</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${status === 'ACTIVE'
                                        ? 'bg-emerald-500'
                                        : status === 'IN_PROGRESS'
                                          ? 'bg-blue-500'
                                          : 'bg-slate-400'
                                        } transition-all`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {daysUntilDue !== null && !isCompleted && (
                                <div
                                  className={`
                                    text-xs font-medium px-2 py-0.5 rounded w-fit
                                    ${overdue
                                      ? 'bg-red-50 text-red-700'
                                      : daysUntilDue <= 2
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-slate-50 text-slate-600'
                                    }
                                  `}
                                >
                                  {overdue
                                    ? `Quá hạn ${Math.abs(daysUntilDue)} ngày`
                                    : daysUntilDue === 0
                                      ? 'Hôm nay'
                                      : daysUntilDue === 1
                                        ? 'Còn 1 ngày'
                                        : `Còn ${daysUntilDue} ngày`}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation()
                                  onEditActivity(activity)
                                }}
                              >
                                Sửa
                              </Button>
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

    // Desktop: right-side drawer
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
                  Hoạt động ngày {formatDate(selectedDate)}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {dayActivities.length} hoạt động trong ngày này
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
              ) : dayActivities.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-slate-600 mb-4">Không có hoạt động nào trong ngày này</p>
                  {onCreateActivity && (
                    <Button
                      onClick={() => {
                        onCreateActivity(selectedDate)
                        onOpenChange(false)
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Tạo hoạt động mới
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {dayActivities.map(event => {
                    const activity = event.resource
                    const progress = getActivityProgress(activity)
                    const daysUntilDue = getDaysUntilDue(activity)
                    const overdue = isActivityOverdue(activity)
                    const status = (activity.status || '').toUpperCase()
                    const isActive = status === 'ACTIVE' || status === 'IN_PROGRESS'
                    const isCompleted = status === 'COMPLETED'

                    return (
                      <Card
                        key={activity.farmActivitiesId}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onViewActivity(activity)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900 truncate">
                                  {getActivityTypeLabel(activity.activityType)}
                                </h4>
                                {getStatusBadge(activity.status, overdue)}
                              </div>

                              <div className="text-xs text-slate-600">
                                {formatDisplayDate(activity.startDate)} -{' '}
                                {formatDisplayDate(activity.endDate)}
                              </div>

                              {isActive && !isCompleted && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-600">Tiến độ</span>
                                    <span className="font-semibold text-slate-900">{progress}%</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${status === 'ACTIVE'
                                        ? 'bg-emerald-500'
                                        : status === 'IN_PROGRESS'
                                          ? 'bg-blue-500'
                                          : 'bg-slate-400'
                                        } transition-all`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {daysUntilDue !== null && !isCompleted && (
                                <div
                                  className={`
                                    text-xs font-medium px-2 py-0.5 rounded w-fit
                                    ${overdue
                                      ? 'bg-red-50 text-red-700'
                                      : daysUntilDue <= 2
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-slate-50 text-slate-600'
                                    }
                                  `}
                                >
                                  {overdue
                                    ? `Quá hạn ${Math.abs(daysUntilDue)} ngày`
                                    : daysUntilDue === 0
                                      ? 'Hôm nay'
                                      : daysUntilDue === 1
                                        ? 'Còn 1 ngày'
                                        : `Còn ${daysUntilDue} ngày`}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation()
                                  onEditActivity(activity)
                                }}
                              >
                                Sửa
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-auto p-6 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      </>
    )

    return typeof window !== 'undefined' && document.body
      ? createPortal(drawerContent, document.body)
      : drawerContent
  }

  // Event Drawer
  if (mode === 'event' && selectedEvent) {
    const activity = selectedEvent.resource
    const progress = getActivityProgress(activity)
    const daysUntilDue = getDaysUntilDue(activity)
    const overdue = isActivityOverdue(activity)
    const status = (activity.status || '').toUpperCase()
    const isActive = status === 'ACTIVE' || status === 'IN_PROGRESS'
    const isCompleted = status === 'COMPLETED'

    if (isMobile) {
      // Mobile: bottom sheet
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>{getActivityTypeLabel(activity.activityType)}</DrawerTitle>
              <DrawerDescription>Chi tiết hoạt động nông trại</DrawerDescription>
            </DrawerHeader>

            <div className="overflow-y-auto px-4 pb-4 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Loại hoạt động</label>
                      <p className="mt-1 text-base text-slate-900">
                        {getActivityTypeLabel(activity.activityType)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Ngày bắt đầu</label>
                        <p className="mt-1 text-base text-slate-900">
                          {formatDisplayDate(activity.startDate)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Ngày kết thúc</label>
                        <p className="mt-1 text-base text-slate-900">
                          {formatDisplayDate(activity.endDate)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-600">Trạng thái</label>
                      <div className="mt-1">{getStatusBadge(activity.status, overdue)}</div>
                    </div>

                    {isActive && !isCompleted && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Tiến độ</label>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Hoàn thành</span>
                            <span className="font-semibold text-slate-900">{progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-blue-500'
                                } transition-all`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {daysUntilDue !== null && !isCompleted && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Thời hạn</label>
                        <div className="mt-1">
                          <div
                            className={`
                              text-sm font-medium px-3 py-1.5 rounded w-fit
                              ${overdue
                                ? 'bg-red-50 text-red-700'
                                : daysUntilDue <= 2
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-50 text-slate-600'
                              }
                            `}
                          >
                            {overdue
                              ? `Quá hạn ${Math.abs(daysUntilDue)} ngày`
                              : daysUntilDue === 0
                                ? 'Hôm nay'
                                : daysUntilDue === 1
                                  ? 'Còn 1 ngày'
                                  : `Còn ${daysUntilDue} ngày`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <DrawerFooter className="flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => onEditActivity(activity)}
                className="flex-1"
              >
                Chỉnh sửa
              </Button>
              <Button
                variant="outline"
                onClick={() => onToggleStatus(activity)}
                className="flex-1"
              >
                {status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt'}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">
                  Đóng
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )
    }

    // Desktop: right-side drawer with enterprise action layout
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
                  {getActivityTypeLabel(activity.activityType)}
                </h2>
                <p className="text-sm text-slate-600 mt-1">Chi tiết hoạt động nông trại</p>
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

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Loại hoạt động</label>
                      <p className="mt-1 text-base text-slate-900">
                        {getActivityTypeLabel(activity.activityType)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Ngày bắt đầu</label>
                        <p className="mt-1 text-base text-slate-900">
                          {formatDisplayDate(activity.startDate)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">Ngày kết thúc</label>
                        <p className="mt-1 text-base text-slate-900">
                          {formatDisplayDate(activity.endDate)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-600">Trạng thái</label>
                      <div className="mt-1">{getStatusBadge(activity.status, overdue)}</div>
                    </div>

                    {isActive && !isCompleted && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Tiến độ</label>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Hoàn thành</span>
                            <span className="font-semibold text-slate-900">{progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-blue-500'
                                } transition-all`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {daysUntilDue !== null && !isCompleted && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Thời hạn</label>
                        <div className="mt-1">
                          <div
                            className={`
                              text-sm font-medium px-3 py-1.5 rounded w-fit
                              ${overdue
                                ? 'bg-red-50 text-red-700'
                                : daysUntilDue <= 2
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-50 text-slate-600'
                              }
                            `}
                          >
                            {overdue
                              ? `Quá hạn ${Math.abs(daysUntilDue)} ngày`
                              : daysUntilDue === 0
                                ? 'Hôm nay'
                                : daysUntilDue === 1
                                  ? 'Còn 1 ngày'
                                  : `Còn ${daysUntilDue} ngày`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="mt-auto p-6 border-t space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onEditActivity(activity)}
                  className="flex-1"
                >
                  Chỉnh sửa
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onToggleStatus(activity)}
                  className="flex-1"
                >
                  {status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt'}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      </>
    )

    return typeof window !== 'undefined' && document.body
      ? createPortal(drawerContent, document.body)
      : drawerContent
  }

  return null
}
