import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Loader2, Edit } from 'lucide-react'
import { scheduleLogService, type ScheduleLogItem } from '@/shared/api/scheduleLogService'

export default function ScheduleLogPanelStaff({ scheduleId, farmActivityId, onEdit, registerUpdater }: { scheduleId: number; farmActivityId?: number | null; onEdit: (log: ScheduleLogItem) => void; registerUpdater?: (fn: (item: ScheduleLogItem | { id: number }, mode: 'create' | 'update' | 'delete') => void) => void }) {
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

        const tryParse = (s: string) => {
            try {
                const d = new Date(s)
                if (Number.isNaN(d.getTime())) return null
                return d
            } catch {
                return null
            }
        }

        const asIs = tryParse(iso)
        const noZ = iso.endsWith('Z') ? tryParse(iso.replace(/Z$/, '')) : null

        let d: Date | null = null
        if (noZ && asIs) {
            d = (Math.abs(Date.now() - noZ.getTime()) < Math.abs(Date.now() - asIs.getTime())) ? noZ : asIs
        } else {
            d = asIs || noZ
        }

        if (!d) return '—'

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
            let items: ScheduleLogItem[] = (data.items || []).slice()
            if (farmActivityId != null) {
                items = items.filter(it => {
                    const fid = (it.farmActivityId ?? (it as any).farm_activity_id ?? null)
                    return fid != null && Number(fid) === Number(farmActivityId)
                })
            }
            items.sort((a, b) => {
                const ta = a.createdAt ?? a.updatedAt ?? null
                const tb = b.createdAt ?? b.updatedAt ?? null
                const da = ta ? new Date(ta).getTime() : (a.id || 0)
                const db = tb ? new Date(tb).getTime() : (b.id || 0)
                return db - da
            })
            if (p === 1) {
                setLogs(items)
            } else {
                setLogs(prev => [...prev, ...items])
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
            if (mode === 'create' || mode === 'update') {
                void load(1)
                return
            }
            if (mode === 'delete') {
                const it = item as { id: number }
                setLogs(prev => prev.filter(p => p.id !== it.id))
                return
            }
        }
        registerUpdater(fn)
    }, [registerUpdater, load])

    return (
        <div className="flex flex-col h-full">
            {logs.length === 0 && !loading ? (
                <div className="py-6 text-center text-muted-foreground">Chưa có ghi nhận cho thời vụ này.</div>
            ) : (
                <>
                    <div className="space-y-2 overflow-y-auto flex-1" ref={containerRef}>
                        {logs.map((l, idx) => {
                            const isLatest = idx === 0
                            return (
                                <div
                                    key={l.id}
                                    className={`p-3 border rounded-md flex items-start justify-between ${isLatest ? 'bg-green-50 border-green-200' : ''}`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs text-muted-foreground">{safeFormat(l.createdAt ?? undefined)}</div>
                                            {isLatest ? (
                                                <div className="text-xs text-white bg-emerald-600 rounded-full px-2 py-0.5 font-medium">
                                                    Mới nhất
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="font-medium truncate">{(l.notes || '').split('\n')[0]}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            <div>
                                                <strong>Người tạo</strong>: {l.staffNameCreate ?? 'Không xác định'}
                                                {l.createdAt ? ` • ${safeFormat(l.createdAt ?? undefined)}` : ''}
                                            </div>
                                            {l.updatedAt && (() => {
                                                const name = l.staffNameUpdate
                                                if (!name) return null
                                                const trimmed = String(name).trim()
                                                if (!trimmed) return null
                                                const placeholders = ['Không lấy được tên người dùng', 'Không lấy được', 'Unknown', 'N/A']
                                                const lower = trimmed.toLowerCase()
                                                const isInvalid = placeholders.some(ph => lower === ph.toLowerCase() || lower.includes(ph.toLowerCase()))
                                                if (isInvalid) return null
                                                return (
                                                    <div className="mt-1">
                                                        <strong>Người sửa</strong>: {trimmed} • {safeFormat(l.updatedAt ?? undefined)}
                                                    </div>
                                                )
                                            })()}
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


