import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Shield,
  TrendingUp,
  Activity,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Table } from '@/shared/ui/table'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { useQualityChecksStore } from '@/features/quality-checks/store/qualityChecksStore'
import { useToast } from '@/shared/ui/use-toast'
import {
  checkTypeConfig,
  statusConfig,
  priorityConfig,
  growthStageConfig,
  zoneOptions,
} from '@/features/quality-checks/model/schemas'
import type { QualityCheckData } from '@/features/quality-checks/model/schemas'
import { QualityCheckDetailsModal } from '@/features/quality-checks/ui/QualityCheckDetailsModal'
import { QualityCheckEditModal } from '@/features/quality-checks/ui/QualityCheckEditModal'

const StaffQualityChecksPage: React.FC = () => {
  const { toast } = useToast()
  const [selectedCheck, setSelectedCheck] = useState<QualityCheckData | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const {
    initializeData,
    searchState,
    selectedCheckIds,
    filters,
    setSearch,
    setFilters,
    clearFilters,
    deleteQualityCheck,
    updateQualityCheck,
    createQualityCheck,
    clearSelection,
    getPaginatedQualityChecks,
    getTodayChecks,
    getFailedChecks,
    getChecksRequiringFollowUp,
    getAverageHealthScore,
    getCriticalIssues,
  } = useQualityChecksStore()

  // Initialize data on mount
  useEffect(() => {
    initializeData()
  }, [initializeData])

  const paginatedChecks = getPaginatedQualityChecks()
  const todayChecks = getTodayChecks()
  const failedChecks = getFailedChecks()
  const followUpChecks = getChecksRequiringFollowUp()
  const averageHealth = getAverageHealthScore()
  const criticalIssues = getCriticalIssues()

  const handleViewCheck = (check: QualityCheckData) => {
    setSelectedCheck(check)
    setViewModalOpen(true)
  }

  const handleEditCheck = (check: QualityCheckData) => {
    setSelectedCheck(check)
    setViewModalOpen(false)
    setEditModalOpen(true)
  }

  const handleSaveCheck = async (data: QualityCheckData) => {
    if (!data.id) return

    try {
      await updateQualityCheck(data.id, data)
      toast({
        title: 'Đã cập nhật kiểm tra chất lượng',
        description: 'Thông tin kiểm tra chất lượng đã được cập nhật thành công.',
      })
      setEditModalOpen(false)
      setSelectedCheck(null)
    } catch (error) {
      toast({
        title: 'Cập nhật thất bại',
        description:
          error instanceof Error ? error.message : 'Không thể cập nhật kiểm tra chất lượng',
        variant: 'destructive',
      })
    }
  }

  const handleCreateCheck = async (data: Omit<QualityCheckData, 'id'>) => {
    try {
      await createQualityCheck(data)
      toast({
        title: 'Đã tạo kiểm tra chất lượng',
        description: 'Kiểm tra chất lượng mới đã được tạo thành công.',
      })
      setCreateModalOpen(false)
    } catch (error) {
      toast({
        title: 'Tạo thất bại',
        description: error instanceof Error ? error.message : 'Không thể tạo kiểm tra chất lượng',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteCheck = async (check: QualityCheckData) => {
    if (!check?.id) return

    try {
      await deleteQualityCheck(check.id)
      toast({
        title: 'Đã xóa kiểm tra chất lượng',
        description: 'Kiểm tra chất lượng đã được xóa thành công.',
      })
      setViewModalOpen(false)
      setSelectedCheck(null)
    } catch (error) {
      toast({
        title: 'Xóa thất bại',
        description: error instanceof Error ? error.message : 'Không thể xóa kiểm tra chất lượng',
        variant: 'destructive',
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4" />
      case 'fail':
        return <XCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
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

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig]
    return (
      <Badge variant="secondary" className={`${config.color} ${config.bgColor} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getCheckTypeBadge = (checkType: string) => {
    const config = checkTypeConfig[checkType as keyof typeof checkTypeConfig]
    return (
      <Badge variant="outline" className={`${config.color} border-current`}>
        {config.label}
      </Badge>
    )
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    if (score >= 4) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <StaffLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Shield className="h-8 w-8 mr-3 text-blue-600" />
              Kiểm tra chất lượng
            </h1>
            <p className="text-gray-600">Giám sát sức khỏe cây trồng và tiêu chuẩn chất lượng</p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Kiểm tra chất lượng mới
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
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Kiểm tra hôm nay</p>
                  <p className="text-2xl font-bold text-gray-900">{todayChecks.length}</p>
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
                  <TrendingUp className={`h-8 w-8 ${getHealthScoreColor(averageHealth)}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Điểm sức khỏe TB</p>
                  <p className={`text-2xl font-bold ${getHealthScoreColor(averageHealth)}`}>
                    {averageHealth}/10
                  </p>
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
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Kiểm tra thất bại</p>
                  <p className="text-2xl font-bold text-gray-900">{failedChecks.length}</p>
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
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Cần theo dõi</p>
                  <p className="text-2xl font-bold text-gray-900">{followUpChecks.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Critical Issues Alert */}
        {criticalIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Phát hiện vấn đề nghiêm trọng
                  </h3>
                  <p className="text-sm text-red-700">
                    {criticalIssues.length} kiểm tra chất lượng cần chú ý ngay lập tức
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm kiểm tra chất lượng theo cây trồng, khu vực hoặc người kiểm tra..."
                value={searchState.query}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
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
                    <SelectItem value="pass">Đạt</SelectItem>
                    <SelectItem value="fail">Không đạt</SelectItem>
                    <SelectItem value="warning">Cảnh báo</SelectItem>
                    <SelectItem value="pending">Đang chờ</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.checkType || 'all'}
                  onValueChange={value => setFilters({ checkType: value as any })}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Chọn loại kiểm tra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    <SelectItem value="routine">Kiểm tra định kỳ</SelectItem>
                    <SelectItem value="disease">Kiểm tra bệnh tật</SelectItem>
                    <SelectItem value="pest">Kiểm tra sâu bệnh</SelectItem>
                    <SelectItem value="growth">Kiểm tra tăng trưởng</SelectItem>
                    <SelectItem value="harvest-ready">Sẵn sàng thu hoạch</SelectItem>
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
                    <SelectItem value="critical">Khẩn cấp</SelectItem>
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

          {/* Selected Count */}
          {selectedCheckIds.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-700">
                {selectedCheckIds.length} kiểm tra đã chọn
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

        {/* Quality Checks Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày & Giờ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cây trồng & Khu vực
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại kiểm tra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm sức khỏe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Độ ưu tiên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người kiểm tra
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedChecks.map(check => (
                  <tr key={check.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(check.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">{check.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{check.cropType}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{check.zone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCheckTypeBadge(check.checkType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(check.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${getHealthScoreColor(check.overallHealth)}`}
                      >
                        {check.overallHealth}/10
                      </div>
                      <div className="text-xs text-gray-500">
                        {growthStageConfig[check.growthStage].label}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(check.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{check.inspector}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewCheck(check)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditCheck(check)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCheck(check)}
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

          {paginatedChecks.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy kiểm tra chất lượng
              </h3>
              <p className="text-gray-500">
                Không có kiểm tra chất lượng nào phù hợp với bộ lọc hiện tại. Hãy thử điều chỉnh
                tiêu chí tìm kiếm.
              </p>
            </div>
          )}
        </Card>

        {/* Details Modal */}
        <QualityCheckDetailsModal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          qualityCheck={selectedCheck}
          onEdit={handleEditCheck}
          onDelete={handleDeleteCheck}
        />

        {/* Edit Modal */}
        <QualityCheckEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          qualityCheck={selectedCheck}
          onSave={handleSaveCheck}
        />

        {/* Create Modal */}
        <QualityCheckEditModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          qualityCheck={null}
          onSave={handleCreateCheck as any}
        />
      </div>
    </StaffLayout>
  )
}

export default StaffQualityChecksPage
