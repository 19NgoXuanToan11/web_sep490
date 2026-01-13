import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  scheduleService,
  type PaginatedSchedules,
  type ScheduleListItem,
} from '@/shared/api/scheduleService'
import { farmService } from '@/shared/api/farmService'
import { cropService } from '@/shared/api/cropService'
import { accountApi } from '@/shared/api/auth'
import { farmActivityService, type FarmActivity } from '@/shared/api/farmActivityService'
import { handleFetchError } from '@/shared/lib/error-handler'
import { formatDate } from '@/shared/lib/date-utils'
import type { ActivityOption, SortOption } from '../types'

export const BULK_PAGE_SIZE = 50

export function useScheduleData() {
  const [pageIndex, setPageIndex] = useState(1)
  const [pageSize] = useState(10)
  const [data, setData] = useState<PaginatedSchedules | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [newlyCreatedIds, setNewlyCreatedIds] = useState<Set<number>>(new Set())
  const previousMaxIdRef = useRef<number>(0)

  const [farms, setFarms] = useState<{ id: number; name: string }[]>([])
  const [crops, setCrops] = useState<{ id: number; name: string; status?: string }[]>([])
  const [staffs, setStaffs] = useState<{ id: number; name: string }[]>([])
  const [activities, setActivities] = useState<ActivityOption[]>([])
  const [metaLoading, setMetaLoading] = useState(false)
  const loadReferencePromise = useRef<Promise<any> | null>(null)
  const loadStaffsPromise = useRef<Promise<any> | null>(null)
  const [allSchedules, setAllSchedules] = useState<ScheduleListItem[]>([])

  const filteredSchedules = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return (
      data?.data.items.filter(schedule => {
        if (statusFilter !== 'all') {
          const isActive =
            typeof schedule.status === 'number'
              ? schedule.status === 1
              : schedule.status === 'ACTIVE'
          if (statusFilter === 'active' && !isActive) return false
          if (statusFilter === 'inactive' && isActive) return false
        }

        if (normalizedSearch) {
          const cropName = (schedule.cropView?.cropName || '').toLowerCase()
          const farmName = (schedule.farmView?.farmName || '').toLowerCase()
          const staffName = (schedule.staff?.fullname || schedule.staffName || '').toLowerCase()
          if (
            !cropName.includes(normalizedSearch) &&
            !farmName.includes(normalizedSearch) &&
            !staffName.includes(normalizedSearch)
          ) {
            return false
          }
        }

        return true
      }) ?? []
    )
  }, [data?.data.items, searchTerm, statusFilter])

  const sortedSchedules = useMemo(() => {
    const sorted = [...filteredSchedules]

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => {
          const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
          const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
          if (aActive !== bActive) {
            return aActive ? -1 : 1
          }
          const aId = a.scheduleId || 0
          const bId = b.scheduleId || 0
          return bId - aId
        })

      case 'startDate':
        return sorted.sort((a, b) => {
          const aDate = new Date(a.startDate).getTime()
          const bDate = new Date(b.startDate).getTime()
          if (aDate === bDate) {
            const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
            const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
            if (aActive !== bActive) return aActive ? -1 : 1
            return (b.scheduleId || 0) - (a.scheduleId || 0)
          }
          return aDate - bDate
        })

      case 'cropName':
        return sorted.sort((a, b) => {
          const nameA = (a.cropView?.cropName || '').toLowerCase()
          const nameB = (b.cropView?.cropName || '').toLowerCase()
          if (nameA === nameB) {
            const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
            const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
            if (aActive !== bActive) return aActive ? -1 : 1
            return (b.scheduleId || 0) - (a.scheduleId || 0)
          }
          return nameA.localeCompare(nameB, 'vi')
        })

      case 'farmName':
        return sorted.sort((a, b) => {
          const nameA = (a.farmView?.farmName || '').toLowerCase()
          const nameB = (b.farmView?.farmName || '').toLowerCase()
          if (nameA === nameB) {
            const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
            const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
            if (aActive !== bActive) return aActive ? -1 : 1
            return (b.scheduleId || 0) - (a.scheduleId || 0)
          }
          return nameA.localeCompare(nameB, 'vi')
        })

      default:
        return sorted
    }
  }, [filteredSchedules, sortBy])

  const serverTotalPages = useMemo(() => {
    return data?.data?.totalPagesCount ?? Math.max(1, Math.ceil(sortedSchedules.length / pageSize))
  }, [data?.data?.totalPagesCount, sortedSchedules.length, pageSize])

  const serverTotalItems = useMemo(() => {
    return data?.data?.totalItemCount ?? sortedSchedules.length
  }, [data?.data?.totalItemCount, sortedSchedules.length])

  const paginatedSchedules = useMemo(() => {
    if (data?.data?.items) {
      return sortedSchedules
    }
    const start = (pageIndex - 1) * pageSize
    return sortedSchedules.slice(start, start + pageSize)
  }, [sortedSchedules, pageIndex, pageSize, data?.data?.items])

  const groupedSchedules = useMemo(() => {
    const groups = new Map<string, ScheduleListItem[]>()
    const groupOrder: string[] = []

    paginatedSchedules.forEach(schedule => {
      const key = schedule.cropView?.cropName || 'Khác'
      if (!groups.has(key)) {
        groups.set(key, [])
        groupOrder.push(key)
      }
      groups.get(key)!.push(schedule)
    })

    return groupOrder.map(key => [key, groups.get(key)!] as [string, ScheduleListItem[]])
  }, [paginatedSchedules])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await scheduleService.getScheduleList(pageIndex, pageSize)

      const currentMaxId = Math.max(...res.data.items.map(s => s.scheduleId || 0), 0)

      if (currentMaxId > previousMaxIdRef.current && previousMaxIdRef.current > 0) {
        setNewlyCreatedIds(new Set([currentMaxId]))
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      }

      previousMaxIdRef.current = currentMaxId

      setData(res)
    } catch (e) {
      handleFetchError(e, { error: () => {} }, 'thời vụ')
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize])

  const loadAllSchedules = useCallback(async (silent = false): Promise<ScheduleListItem[]> => {
    try {
      const first = await scheduleService.getScheduleList(1, BULK_PAGE_SIZE)
      let items = [...first.data.items]
      const totalPages = first.data.totalPagesCount
      if (totalPages > 1) {
        const requests: Promise<PaginatedSchedules>[] = []
        for (let page = 2; page <= totalPages; page++) {
          requests.push(scheduleService.getScheduleList(page, BULK_PAGE_SIZE))
        }
        const results = await Promise.all(requests)
        results.forEach(res => {
          items = items.concat(res.data.items)
        })
      }
      setAllSchedules(items)
      return items
    } catch (e) {
      if (!silent) {
        handleFetchError(e, { error: () => {} }, 'thời vụ (toàn bộ)')
      }
      return []
    }
  }, [])

  const loadReferenceData = useCallback(async () => {
    if (farms.length > 0 && crops.length > 0) {
      return {
        farmOptions: farms,
        cropOptions: crops,
        staffOptions: staffs,
        activityOptions: activities,
      }
    }

    if (loadReferencePromise.current) {
      return loadReferencePromise.current
    }

    const promise = (async () => {
      const [farmRes, cropRes, staffResRaw, fa] = await Promise.all([
        farmService.getAllFarms(),
        cropService.getAllCropsActive(),
        accountApi.getAvailableStaff(),
        farmActivityService.getActiveFarmActivities({ pageIndex: 1, pageSize: 1000 }),
      ])

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const validActivities = (fa.items || []).filter((a: FarmActivity) => {
        const end = a.endDate ? new Date(a.endDate) : null
        if (end && !Number.isNaN(end.getTime())) {
          return end >= today
        }
        return true
      })

      const formatDateSafe = (value?: string) => {
        if (!value) return ''
        try {
          return formatDate(value)
        } catch {
          return value
        }
      }

      return {
        farmOptions: (Array.isArray(farmRes) ? farmRes : []).map(f => ({
          id: f.farmId,
          name: f.farmName,
        })),
        cropOptions: (Array.isArray(cropRes) ? cropRes : []).map(c => ({
          id: c.cropId,
          name: c.cropName,
          status: c.status,
        })),
        staffOptions: (() => {
          const staffList = Array.isArray(staffResRaw)
            ? staffResRaw
            : (staffResRaw && (staffResRaw as any).items) || []
          return staffList.map((s: any) => ({
            id: s.accountId,
            name: s.accountProfile?.fullname ?? s.fullname ?? s.email ?? s.username ?? '',
          }))
        })(),
        activityOptions: validActivities.map((a: FarmActivity) => {
          const start = formatDateSafe(a.startDate)
          const end = formatDateSafe(a.endDate)
          const dateLabel = start || end ? ` (${start || '...'} → ${end || '...'})` : ''
          return {
            id: a.farmActivitiesId,
            name: `${(a as any).activityType ? (a as any).activityType : 'Unknown'}${dateLabel}`,
          }
        }),
      }
    })()

    loadReferencePromise.current = promise
    try {
      const res = await promise
      setFarms(res.farmOptions)
      setCrops(res.cropOptions)
      setStaffs(res.staffOptions)
      setActivities(res.activityOptions)
      return res
    } finally {
      loadReferencePromise.current = null
    }
  }, [farms.length, crops.length, staffs.length, activities.length])

  const loadStaffs = useCallback(async () => {
    if (loadStaffsPromise.current) {
      return loadStaffsPromise.current
    }

    setMetaLoading(true)

    const promise = (async () => {
      const staffResRaw = await accountApi.getAvailableStaff()
      const staffList = Array.isArray(staffResRaw)
        ? staffResRaw
        : (staffResRaw && (staffResRaw as any).items) || []
      const mapped = staffList.map((s: any) => ({
        id: s.accountId,
        name: s.accountProfile?.fullname ?? s.fullname ?? s.email ?? s.username ?? '',
      }))
      setStaffs(mapped)
      return mapped
    })()

    loadStaffsPromise.current = promise
    try {
      const res = await promise
      return res
    } finally {
      loadStaffsPromise.current = null
      setMetaLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadAllSchedules(true)
  }, [loadAllSchedules])

  useEffect(() => {
    setPageIndex(1)
  }, [searchTerm, statusFilter, sortBy])

  useEffect(() => {
    if (newlyCreatedIds.size > 0) {
      const timer = setTimeout(() => {
        setNewlyCreatedIds(new Set())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [newlyCreatedIds])

  return {
    pageIndex,
    pageSize,
    data,
    loading,
    searchTerm,
    statusFilter,
    sortBy,
    newlyCreatedIds,
    farms,
    crops,
    staffs,
    activities,
    metaLoading,
    allSchedules,
    filteredSchedules,
    sortedSchedules,
    serverTotalPages,
    serverTotalItems,
    paginatedSchedules,
    groupedSchedules,

    setPageIndex,
    setSearchTerm,
    setStatusFilter,
    setSortBy,
    setNewlyCreatedIds,
    setFarms,
    setCrops,
    setStaffs,
    setActivities,
    setMetaLoading,
    setAllSchedules,

    load,
    loadAllSchedules,
    loadReferenceData,
    loadStaffs,
  }
}
