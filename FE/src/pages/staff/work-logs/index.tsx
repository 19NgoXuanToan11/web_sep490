import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  FileText,
  Users,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Select } from '@/shared/ui/select'
import { Table } from '@/shared/ui/table'
import { Dialog } from '@/shared/ui/dialog'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { useWorkLogsStore } from '@/features/work-logs/store/workLogsStore'
import { useToast } from '@/shared/ui/use-toast'
import {
  priorityConfig,
  statusConfig,
  taskCategories,
  zoneOptions,
} from '@/features/work-logs/model/schemas'
import type { WorkLogData } from '@/features/work-logs/model/schemas'

const StaffWorkLogsPage: React.FC = () => {
  const { toast } = useToast()
  const [selectedLog, setSelectedLog] = useState<WorkLogData | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const {
    initializeData,
    workLogs,
    searchState,
    selectedLogIds,
    filters,
    loadingStates,
    setSearch,
    setFilters,
    clearFilters,
    deleteWorkLog,
    exportWorkLogsCSV,
    clearSelection,
    getPaginatedWorkLogs,
    getTotalCount,
    getWorkLogsByStatus,
    getWorkLogsByPriority,
    getTodayWorkLogs,
    getUpcomingTasks,
    getOverdueTasks,
  } = useWorkLogsStore()

  // Initialize data on mount
  useEffect(() => {
    initializeData()
  }, [initializeData])

  const paginatedLogs = getPaginatedWorkLogs()
  const totalCount = getTotalCount()
  const statusCounts = getWorkLogsByStatus()
  const priorityCounts = getWorkLogsByPriority()
  const todayLogs = getTodayWorkLogs()
  const upcomingTasks = getUpcomingTasks()
  const overdueTasks = getOverdueTasks()

  const handleViewLog = (log: WorkLogData) => {
    setSelectedLog(log)
    setViewModalOpen(true)
  }

  const handleDeleteLog = (log: WorkLogData) => {
    setSelectedLog(log)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedLog?.id) return

    try {
      await deleteWorkLog(selectedLog.id)
      toast({
        title: 'Work Log Deleted',
        description: 'Work log has been successfully deleted.',
      })
      setDeleteConfirmOpen(false)
      setSelectedLog(null)
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete work log',
        variant: 'destructive',
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'in-progress':
        return <Clock className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig]
    return (
      <Badge variant="secondary" className={`${config.color} ${config.bgColor} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${config.bgColor}`}>
        {getStatusIcon(status)}
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>
    )
  }

  return (
    <StaffLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <FileText className="h-8 w-8 mr-3 text-green-600" />
              Work Logs
            </h1>
            <p className="text-gray-600">Track daily operations and task management</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportWorkLogsCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Work Log
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Today's Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{todayLogs.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.completed || 0}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statusCounts['in-progress'] || 0}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{overdueTasks.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search work logs by task, zone, or description..."
                value={searchState.query}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Filter by:
              </span>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={filters.status || 'all'}
                  onValueChange={value => setFilters({ status: value as any })}
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="cancelled">Cancelled</option>
                </Select>

                <Select
                  value={filters.priority || 'all'}
                  onValueChange={value => setFilters({ priority: value as any })}
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>

                <Select
                  value={filters.zone || ''}
                  onValueChange={value => setFilters({ zone: value })}
                >
                  <option value="">All Zones</option>
                  {zoneOptions.map(zone => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </Select>

                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Count */}
          {selectedLogIds.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-700">
                {selectedLogIds.length} log{selectedLogIds.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={clearSelection}>
                  Clear Selection
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Bulk Actions
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Work Logs Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task & Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(log.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.startTime} - {log.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {log.task}
                      </div>
                      <div className="text-sm text-gray-500">{log.zone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(log.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(log.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.assignedTo || 'Unassigned'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewLog(log)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLog(log)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {paginatedLogs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No work logs found</h3>
              <p className="text-gray-500">
                No work logs match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          )}
        </Card>

        {/* View Modal */}
        {selectedLog && (
          <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
            <div className="max-w-2xl mx-auto p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Log Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="text-sm text-gray-900">{selectedLog.date}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <p className="text-sm text-gray-900">
                      {selectedLog.startTime} - {selectedLog.endTime}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Task</label>
                  <p className="text-sm text-gray-900">{selectedLog.task}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Zone</label>
                  <p className="text-sm text-gray-900">{selectedLog.zone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedLog.description}</p>
                </div>
                {selectedLog.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-sm text-gray-900">{selectedLog.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Dialog>
        )}

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <div className="max-w-md mx-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Work Log</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this work log? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={loadingStates[`delete-work-log-${selectedLog?.id}`]?.isLoading}
              >
                Delete
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </StaffLayout>
  )
}

export default StaffWorkLogsPage
