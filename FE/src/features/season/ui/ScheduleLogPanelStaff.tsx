import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Loader2, Edit } from 'lucide-react'
import { scheduleLogService, type ScheduleLogItem } from '@/shared/api/scheduleLogService'

export default function ScheduleLogPanelStaff({ scheduleId, onEdit, registerUpdater }: { scheduleId: number; onEdit: (log: ScheduleLogItem) => void; registerUpdater?: (fn: (item: ScheduleLogItem | { id: number }, mode: 'create' | 'update' | 'delete') => void) => void }) {
    const [logs, setLogs] = useState<ScheduleLogItem[]>([])
    const [_page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [_total, setTotal] = useState<number | null>(null)

    const PAGE_SIZE = 5
    const containerRef = useRef<HTMLDivElement | null>(null)
    const loadingRef = useRef(false)

    const safeFormat = (iso?: string | null) => {
        if (!iso) return '—'
        const d = new Date(iso)
        if (Number.isNaN(d.getTime())) return '—'
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        const mmth = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = String(d.getFullYear())
        return `${hh}:${mm} • ${dd}/${mmth}/${yyyy}`
    }

    const load = useCallback(async (p = 1) => {
        if (!scheduleId) return
        loadingRef.current = true
        setLoading(true)
        try {
            const data = await scheduleLogService.getLogsBySchedule(scheduleId, p, PAGE_SIZE)
            if (p === 1) {
                setLogs(data.items || [])
            } else {
                setLogs(prev => [...prev, ...(data.items || [])])
            }
            setPage(data.pageIndex || p)
            setHasMore((data.items?.length || 0) >= PAGE_SIZE)
            setTotal(data.totalItemCount ?? null)
        } catch (err) {
        } finally {
            loadingRef.current = false
            setLoading(false)
        }
    }, [scheduleId])

    useEffect(() => {
        if (!scheduleId) return
        load(1)
    }, [scheduleId, load])

    useEffect(() => {
        if (!registerUpdater) return
        const fn = (item: ScheduleLogItem | { id: number }, mode: 'create' | 'update' | 'delete') => {
            if (mode === 'create') {
                setLogs(prev => [item as ScheduleLogItem, ...prev])
                return
            }
            if (mode === 'update') {
                const it = item as ScheduleLogItem
                setLogs(prev => prev.map(p => (p.id === it.id ? it : p)))
                return
            }
            if (mode === 'delete') {
                const it = item as { id: number }
                setLogs(prev => prev.filter(p => p.id !== it.id))
                return
            }
        }
        registerUpdater(fn)
    }, [registerUpdater])

    return (
        <div>
            {logs.length === 0 && !loading ? (
                <div className="py-6 text-center text-muted-foreground">Chưa có ghi nhận cho thời vụ này.</div>
            ) : (
                <>
                    <div className="space-y-2 max-h-80 overflow-y-auto" ref={containerRef}>
                        {logs.map(l => {
                            return (
                                <div key={l.id} className="p-3 border rounded-md flex items-start justify-between">
                                    <div className="min-w-0">
                                        <div className="text-xs text-muted-foreground">{safeFormat(l.createdAt)}</div>
                                        <div className="font-medium truncate">{(l.notes || '').split('\n')[0]}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            <div>
                                                <strong>Người tạo</strong>: {l.staffNameCreate ?? (l.createdBy ?? 'Không xác định')}
                                                {l.createdAt ? ` • ${safeFormat(l.createdAt)}` : ''}
                                            </div>
                                            {l.updatedAt ? (
                                                <div className="mt-1">
                                                    <strong>Người sửa</strong>: {l.staffNameUpdate ?? (l.updatedBy ?? 'Không xác định')} • {safeFormat(l.updatedAt)}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => onEdit(l)}><Edit className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="mt-3 text-center">
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                        ) : hasMore ? (
                            <div className="text-xs text-muted-foreground">Kéo xuống để xem thêm</div>
                        ) : (
                            <div className="text-xs text-muted-foreground">Đã xem hết ghi nhận</div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}


