import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/shared/ui/button'
import { Loader2, Edit } from 'lucide-react'
import { scheduleLogService, type ScheduleLogItem } from '@/shared/api/scheduleLogService'
import { toastManager } from '@/shared/lib/toast-manager'

function ScheduleLogPanel({ scheduleId, onEdit, registerUpdater }: { scheduleId: number; onEdit: (log: ScheduleLogItem) => void; registerUpdater?: (fn: (item: ScheduleLogItem | { id: number }, mode: 'create' | 'update' | 'delete') => void) => void }) {
  const [logs, setLogs] = useState<ScheduleLogItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState<number | null>(null)

  const PAGE_SIZE = 5
  const VISIBLE_THRESHOLD = PAGE_SIZE
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const loadingRef = React.useRef(false)

  const safeFormat = (iso?: string) => {
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
    setLoading(true)
    loadingRef.current = true
    try {
      const data = await scheduleLogService.getLogsBySchedule(scheduleId, p, PAGE_SIZE)
      const incomingItems = data.items || []
      if (p === 1) {
        setLogs(incomingItems)
      } else {
        setLogs(prev => {
          const existingIds = new Set(prev.map(i => i.id))
          const incoming = incomingItems.filter(it => !existingIds.has(it.id))
          return [...prev, ...incoming]
        })
      }
      const totalItems = data.totalItemCount ?? 0
      const more = p * PAGE_SIZE < totalItems
      setHasMore(more)
      setPage(p)
      setTotal(totalItems)
    } catch {
      toastManager.error('Không thể tải nhật ký')
    } finally {
      setLoading(false)
      loadingRef.current = false
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

  const isEmptyState = (total === 0 && logs.length === 0)

  return (
    <div>
      {isEmptyState ? (
        <div className="py-6 text-center text-muted-foreground">Không có ghi nhận</div>
      ) : (
        <>
          <div
            className={`space-y-2 ${hasMore || logs.length > VISIBLE_THRESHOLD ? 'max-h-[360px] overflow-y-auto' : ''}`}
            ref={containerRef}
            onScroll={() => {
              const el = containerRef.current
              if (!el) return
              const threshold = 200
              if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
                if (!loadingRef.current && hasMore) {
                  load(page + 1)
                }
              }
            }}
          >
            {logs.map(l => {
              return (
                <div key={l.id} className="p-3 border rounded-md flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{safeFormat(l.createdAt ?? undefined)}</div>
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

export default ScheduleLogPanel
