import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Clock,
  Calendar,
  MapPin,
  User,
  FileText,
  Camera,
  Wrench,
  Thermometer,
  Droplets,
  Cloud,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { priorityConfig, statusConfig, equipmentOptions } from '../model/schemas'
import type { WorkLogData } from '../model/schemas'

interface WorkLogDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  workLog: WorkLogData | null
  onEdit?: (workLog: WorkLogData) => void
  onDelete?: (workLog: WorkLogData) => void
}

export const WorkLogDetailsModal: React.FC<WorkLogDetailsModalProps> = ({
  isOpen,
  onClose,
  workLog,
  onEdit,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!workLog) return null

  const statusConf = statusConfig[workLog.status as keyof typeof statusConfig]
  const priorityConf = priorityConfig[workLog.priority as keyof typeof priorityConfig]

  const getStatusIcon = () => {
    switch (workLog.status) {
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

  const getDuration = () => {
    if (!workLog.startTime || !workLog.endTime) return null
    const start = new Date(`2000-01-01 ${workLog.startTime}`)
    const end = new Date(`2000-01-01 ${workLog.endTime}`)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  const duration = getDuration()

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConf.bgColor}`}>
              <div className={statusConf.color}>{getStatusIcon()}</div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{workLog.task}</h2>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {workLog.zone}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>Chi tiết thông tin nhật ký công việc</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tổng quan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Trạng thái</p>
                  <Badge className={`${statusConf.bgColor} ${statusConf.color} border-0`}>
                    {statusConf.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Độ ưu tiên</p>
                  <Badge className={`${priorityConf.bgColor} ${priorityConf.color} border-0`}>
                    {priorityConf.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Thời gian</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">
                      {workLog.startTime} - {workLog.endTime}
                    </span>
                  </div>
                </div>
                {duration && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Thời lượng</p>
                    <span className="text-sm font-medium text-green-600">{duration}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Ngày thực hiện</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">
                      {new Date(workLog.date).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                {workLog.assignedTo && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Người thực hiện</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{workLog.assignedTo}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Mô tả công việc</p>
                <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded-lg leading-relaxed">
                  {workLog.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Used */}
          {workLog.equipment && workLog.equipment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Thiết bị sử dụng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {workLog.equipment.map((equipmentId, index) => {
                    const equipmentName = equipmentOptions[parseInt(equipmentId)] || equipmentId
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <Wrench className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-blue-900">{equipmentName}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weather Conditions */}
          {workLog.weather && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Điều kiện thời tiết
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {workLog.weather.temperature && (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Thermometer className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">Nhiệt độ</p>
                        <p className="text-lg font-bold text-orange-700">
                          {workLog.weather.temperature}°C
                        </p>
                      </div>
                    </div>
                  )}
                  {workLog.weather.humidity && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Độ ẩm</p>
                        <p className="text-lg font-bold text-blue-700">
                          {workLog.weather.humidity}%
                        </p>
                      </div>
                    </div>
                  )}
                  {workLog.weather.conditions && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Cloud className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Điều kiện</p>
                        <p className="text-sm font-bold text-green-700">
                          {workLog.weather.conditions}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {workLog.photos && workLog.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Hình ảnh ({workLog.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {workLog.photos.map((_, index) => (
                    <div
                      key={index}
                      className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Ảnh {index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {workLog.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ghi chú
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-line">
                    {workLog.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-900 mb-1">
                  Xác nhận xóa nhật ký công việc
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  Bạn có chắc chắn muốn xóa nhật ký "{workLog.task}" này? Hành động này không thể
                  hoàn tác.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-gray-600"
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      onDelete?.(workLog)
                      setShowDeleteConfirm(false)
                    }}
                  >
                    Xác nhận xóa
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  onEdit(workLog)
                  onClose()
                }}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
