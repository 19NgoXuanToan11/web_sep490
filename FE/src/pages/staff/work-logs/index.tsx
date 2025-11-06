import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  FileText,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Table } from '@/shared/ui/table'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { useWorkLogsStore } from '@/features/work-logs/store/workLogsStore'
import { useToast } from '@/shared/ui/use-toast'
import { priorityConfig, statusConfig, zoneOptions } from '@/features/work-logs/model/schemas'
import type { WorkLogData } from '@/features/work-logs/model/schemas'
import { WorkLogDetailsModal } from '@/features/work-logs/ui/WorkLogDetailsModal'
import { WorkLogEditModal } from '@/features/work-logs/ui/WorkLogEditModal'

const StaffWorkLogsPage: React.FC = () => {
  const { toast } = useToast()
  const [selectedLog, setSelectedLog] = useState<WorkLogData | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const {
    initializeData,
    searchState,
    selectedLogIds,
    filters,
    setSearch,
    setFilters,
    clearFilters,
    deleteWorkLog,
    clearSelection,
    getPaginatedWorkLogs,
    getWorkLogsByStatus,
    getTodayWorkLogs,
    getOverdueTasks,
  } = useWorkLogsStore()

  useEffect(() => {
    initializeData()
  }, [initializeData])

  const paginatedLogs = getPaginatedWorkLogs()
  const statusCounts = getWorkLogsByStatus()
  const todayLogs = getTodayWorkLogs()
  const overdueTasks = getOverdueTasks()

  const handleViewLog = (log: WorkLogData) => {
    setSelectedLog(log)
    setViewModalOpen(true)
  }

  const handleEditLog = (log: WorkLogData) => {
    setSelectedLog(log)
    setEditModalOpen(true)
  }

  const handleDeleteLog = async (log: WorkLogData) => {
    if (!log?.id) return

    try {
      await deleteWorkLog(log.id)
      toast({
        title: 'Đã xóa nhật ký công việc',
        description: 'Nhật ký công việc đã được xóa thành công.',
      })
      setViewModalOpen(false)
      setSelectedLog(null)
    } catch (error) {
      toast({
        title: 'Xóa thất bại',
        description: error instanceof Error ? error.message : 'Không thể xóa nhật ký công việc',
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
        {}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <FileText className="h-8 w-8 mr-3 text-green-600" />
              Nhật ký công việc
            </h1>
            <p className="text-gray-600">Theo dõi hoạt động hàng ngày và quản lý nhiệm vụ</p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nhật ký mới
            </Button>
          </div>
        </div>

        {}
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
                  <p className="text-sm font-medium text-gray-500">Nhiệm vụ hôm nay</p>
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
                  <p className="text-sm font-medium text-gray-500">Hoàn thành</p>
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
                  <p className="text-sm font-medium text-gray-500">Đang thực hiện</p>
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
                  <p className="text-sm font-medium text-gray-500">Quá hạn</p>
                  <p className="text-2xl font-bold text-gray-900">{overdueTasks.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {}
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            {}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm nhật ký công việc theo nhiệm vụ, khu vực hoặc mô tả..."
                value={searchState.query}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {}
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Lọc theo:</span>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={filters.status || 'all'}
                  onValueChange={value => setFilters({ status: value as any })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="in-progress">Đang thực hiện</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.priority || 'all'}
                  onValueChange={value => setFilters({ priority: value as any })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Chọn độ ưu tiên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả độ ưu tiên</SelectItem>
                    <SelectItem value="urgent">Khẩn cấp</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="low">Thấp</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.zone || 'all'}
                  onValueChange={value => setFilters({ zone: value === 'all' ? '' : value })}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Chọn khu vực" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả khu vực</SelectItem>
                    {zoneOptions.map(zone => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </div>

          {}
          {selectedLogIds.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-700">
                {selectedLogIds.length} nhật ký đã chọn
              </span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={clearSelection}>
                  Xóa lựa chọn
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Thao tác hàng loạt
                </Button>
              </div>
            </div>
          )}
        </Card>

        {}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày & Giờ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhiệm vụ & Khu vực
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Độ ưu tiên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người thực hiện
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
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
                      <div className="text-sm text-gray-900">
                        {log.assignedTo || 'Chưa phân công'}
                      </div>
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
                          onClick={() => handleEditLog(log)}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy nhật ký công việc
              </h3>
              <p className="text-gray-500">
                Không có nhật ký công việc nào phù hợp với bộ lọc hiện tại. Hãy thử điều chỉnh tiêu
                chí tìm kiếm.
              </p>
            </div>
          )}
        </Card>

        {}
        <WorkLogDetailsModal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          workLog={selectedLog}
          onEdit={handleEditLog}
          onDelete={handleDeleteLog}
        />

        {}
        <WorkLogEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          workLog={selectedLog}
          onSave={async _workLogData => {
            try {

              toast({
                title: 'Cập nhật thành công',
                description: 'Nhật ký công việc đã được cập nhật.',
              })
              setEditModalOpen(false)
              setSelectedLog(null)
            } catch (error) {
              toast({
                title: 'Cập nhật thất bại',
                description: error instanceof Error ? error.message : 'Không thể cập nhật nhật ký',
                variant: 'destructive',
              })
            }
          }}
        />

        {}
        <WorkLogEditModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          workLog={null}
          onSave={async _workLogData => {
            try {

              toast({
                title: 'Tạo thành công',
                description: 'Nhật ký công việc mới đã được tạo.',
              })
              setCreateModalOpen(false)
            } catch (error) {
              toast({
                title: 'Tạo thất bại',
                description: error instanceof Error ? error.message : 'Không thể tạo nhật ký mới',
                variant: 'destructive',
              })
            }
          }}
        />
      </div>
    </StaffLayout>
  )
}

export default StaffWorkLogsPage
