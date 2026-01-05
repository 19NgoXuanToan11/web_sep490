import { useState, useCallback } from 'react'
import type { ScheduleListItem, CreateScheduleRequest } from '../types'
import { buildEmptyScheduleForm } from '../utils/form'
import type { ScheduleLogItem } from '@/shared/api/scheduleLogService'

export function useScheduleDialogs() {
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showAssignStaff, setShowAssignStaff] = useState(false)
  const [showUpdateStageModal, setShowUpdateStageModal] = useState(false)
  const [showThresholdInline, setShowThresholdInline] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showCreateActivity, setShowCreateActivity] = useState(false)

  const [detailActiveTab, setDetailActiveTab] = useState<'info' | 'calendar' | 'logs'>('info')

  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleListItem | null>(null)
  const [scheduleDetail, setScheduleDetail] = useState<any>(null)
  const [editForm, setEditForm] = useState<CreateScheduleRequest>(buildEmptyScheduleForm())
  const [assignStaffId, setAssignStaffId] = useState<number>(0)
  const [customToday, setCustomToday] = useState<string>('')
  const [logModalMode, setLogModalMode] = useState<'create' | 'edit'>('create')
  const [editingLog, setEditingLog] = useState<ScheduleLogItem | null>(null)
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null)

  const [form, setForm] = useState<CreateScheduleRequest>(buildEmptyScheduleForm())
  const [createActivityForm, setCreateActivityForm] = useState<{
    activityType: string
    startDate: string
    endDate: string
    staffId?: number
  }>({
    activityType: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    staffId: 0,
  })

  const handleCreateDialogChange = useCallback((open: boolean) => {
    setShowCreate(open)
    if (!open) {
      setForm(buildEmptyScheduleForm())
    }
  }, [])

  const handleEditDialogChange = useCallback((open: boolean) => {
    setShowEdit(open)
    if (!open) {
      setSelectedSchedule(null)
      setEditForm(buildEmptyScheduleForm())
      setEditingScheduleId(null)
    }
  }, [])

  const handleAssignStaffDialogChange = useCallback((open: boolean) => {
    setShowAssignStaff(open)
    if (!open) {
      setAssignStaffId(0)
    }
  }, [])

  const handleCreateActivityDialogChange = useCallback((open: boolean) => {
    setShowCreateActivity(open)
    if (!open) {
      setCreateActivityForm({
        activityType: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        staffId: 0,
      })
    }
  }, [])

  const openCreateActivityForSchedule = useCallback((schedule: ScheduleListItem | null) => {
    if (!schedule) return
    setSelectedSchedule(schedule)
    setCreateActivityForm({
      activityType: '',
      startDate: schedule.startDate
        ? new Date(schedule.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      endDate: schedule.endDate
        ? new Date(schedule.endDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      staffId: schedule.staffId ?? 0,
    })
    setShowCreateActivity(true)
  }, [])

  const openCreateLogForSchedule = useCallback((schedule: ScheduleListItem) => {
    setSelectedSchedule(schedule)
    setLogModalMode('create')
    setEditingLog(null)
    setShowLogModal(true)
  }, [])

  const openEditLog = useCallback((log: ScheduleLogItem) => {
    setEditingLog(log)
    setLogModalMode('edit')
    setShowLogModal(true)
  }, [])

  const resetDialogStates = useCallback(() => {
    setShowDetail(false)
    setShowThresholdInline(false)
    setScheduleDetail(null)
    setSelectedSchedule(null)
    setDetailActiveTab('info')
  }, [])

  return {
    showCreate,
    showDetail,
    showEdit,
    showAssignStaff,
    showUpdateStageModal,
    showThresholdInline,
    showLogModal,
    showCreateActivity,

    detailActiveTab,
    selectedSchedule,
    scheduleDetail,
    editForm,
    assignStaffId,
    customToday,
    logModalMode,
    editingLog,
    editingScheduleId,
    form,
    createActivityForm,

    setShowCreate,
    setShowDetail,
    setShowEdit,
    setShowAssignStaff,
    setShowUpdateStageModal,
    setShowThresholdInline,
    setShowLogModal,
    setShowCreateActivity,
    setDetailActiveTab,
    setSelectedSchedule,
    setScheduleDetail,
    setEditForm,
    setAssignStaffId,
    setCustomToday,
    setLogModalMode,
    setEditingLog,
    setEditingScheduleId,
    setForm,
    setCreateActivityForm,

    handleCreateDialogChange,
    handleEditDialogChange,
    handleAssignStaffDialogChange,
    handleCreateActivityDialogChange,
    openCreateActivityForSchedule,
    openCreateLogForSchedule,
    openEditLog,
    resetDialogStates,
  }
}
