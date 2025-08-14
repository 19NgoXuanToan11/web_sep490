import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Download,
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
import { Select } from '@/shared/ui/select'
import { Table } from '@/shared/ui/table'
import { Dialog } from '@/shared/ui/dialog'
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

const StaffQualityChecksPage: React.FC = () => {
  const { toast } = useToast()
  const [selectedCheck, setSelectedCheck] = useState<QualityCheckData | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const {
    initializeData,
    searchState,
    selectedCheckIds,
    filters,
    loadingStates,
    setSearch,
    setFilters,
    clearFilters,
    deleteQualityCheck,
    exportQualityChecksCSV,
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

  const handleDeleteCheck = (check: QualityCheckData) => {
    setSelectedCheck(check)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCheck?.id) return

    try {
      await deleteQualityCheck(selectedCheck.id)
      toast({
        title: 'Quality Check Deleted',
        description: 'Quality check has been successfully deleted.',
      })
      setDeleteConfirmOpen(false)
      setSelectedCheck(null)
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete quality check',
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
              Quality Checks
            </h1>
            <p className="text-gray-600">Monitor crop health and quality standards</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportQualityChecksCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Quality Check
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
                  <p className="text-sm font-medium text-gray-500">Today's Checks</p>
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
                  <p className="text-sm font-medium text-gray-500">Avg Health Score</p>
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
                  <p className="text-sm font-medium text-gray-500">Failed Checks</p>
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
                  <p className="text-sm font-medium text-gray-500">Need Follow-up</p>
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
                  <h3 className="text-sm font-medium text-red-800">Critical Issues Detected</h3>
                  <p className="text-sm text-red-700">
                    {criticalIssues.length} quality check{criticalIssues.length === 1 ? '' : 's'}{' '}
                    require immediate attention
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
                placeholder="Search quality checks by crop, zone, or inspector..."
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
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="warning">Warning</option>
                  <option value="pending">Pending</option>
                </Select>

                <Select
                  value={filters.checkType || 'all'}
                  onValueChange={value => setFilters({ checkType: value as any })}
                >
                  <option value="all">All Types</option>
                  <option value="routine">Routine</option>
                  <option value="disease">Disease</option>
                  <option value="pest">Pest</option>
                  <option value="growth">Growth</option>
                  <option value="harvest-ready">Harvest Ready</option>
                </Select>

                <Select
                  value={filters.priority || 'all'}
                  onValueChange={value => setFilters({ priority: value as any })}
                >
                  <option value="all">All Priority</option>
                  <option value="critical">Critical</option>
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
          {selectedCheckIds.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-700">
                {selectedCheckIds.length} check{selectedCheckIds.length === 1 ? '' : 's'} selected
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

        {/* Quality Checks Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crop & Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspector
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quality checks found</h3>
              <p className="text-gray-500">
                No quality checks match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          )}
        </Card>

        {/* View Modal */}
        {selectedCheck && (
          <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
            <div className="max-w-4xl mx-auto p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Check Details</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="text-sm text-gray-900">{selectedCheck.date}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time</label>
                      <p className="text-sm text-gray-900">{selectedCheck.time}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Crop Type</label>
                      <p className="text-sm text-gray-900">{selectedCheck.cropType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Zone</label>
                      <p className="text-sm text-gray-900">{selectedCheck.zone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Inspector</label>
                      <p className="text-sm text-gray-900">{selectedCheck.inspector}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Check Type</label>
                      <p className="text-sm text-gray-900">
                        {checkTypeConfig[selectedCheck.checkType].label}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Health Assessment */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Health Assessment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Overall Health
                      </label>
                      <p
                        className={`text-sm font-medium ${getHealthScoreColor(selectedCheck.overallHealth)}`}
                      >
                        {selectedCheck.overallHealth}/10
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Growth Stage
                      </label>
                      <p className="text-sm text-gray-900">
                        {growthStageConfig[selectedCheck.growthStage].label}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Disease Present
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedCheck.diseasePresent ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Pest Present
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedCheck.pestPresent ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Environmental Data */}
                {(selectedCheck.soilMoisture ||
                  selectedCheck.temperature ||
                  selectedCheck.humidity) && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Environmental Data</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedCheck.soilMoisture && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Soil Moisture
                          </label>
                          <p className="text-sm text-gray-900">{selectedCheck.soilMoisture}%</p>
                        </div>
                      )}
                      {selectedCheck.temperature && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Temperature
                          </label>
                          <p className="text-sm text-gray-900">{selectedCheck.temperature}°C</p>
                        </div>
                      )}
                      {selectedCheck.humidity && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Humidity
                          </label>
                          <p className="text-sm text-gray-900">{selectedCheck.humidity}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Issues and Actions */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Issues & Actions</h4>
                  {selectedCheck.issues && selectedCheck.issues.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Issues Detected
                      </label>
                      <ul className="text-sm text-gray-900 list-disc list-inside">
                        {selectedCheck.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedCheck.recommendedActions &&
                    selectedCheck.recommendedActions.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Recommended Actions
                        </label>
                        <ul className="text-sm text-gray-900 list-disc list-inside">
                          {selectedCheck.recommendedActions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>

              {selectedCheck.notes && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedCheck.notes}
                  </p>
                </div>
              )}

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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Quality Check</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this quality check? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={loadingStates[`delete-quality-check-${selectedCheck?.id}`]?.isLoading}
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

export default StaffQualityChecksPage
