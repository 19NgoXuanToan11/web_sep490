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
  Calendar,
  Clock,
  MapPin,
  User,
  Ruler,
  Thermometer,
  Droplets,
  Leaf,
  Bug,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Edit,
  Trash2,
  Shield,
  Camera,
  FileText,
  TrendingUp,
} from 'lucide-react'
import {
  checkTypeConfig,
  statusConfig,
  priorityConfig,
  growthStageConfig,
  leafColorOptions,
  cropTypes,
} from '../model/schemas'
import type { QualityCheckData } from '../model/schemas'

interface QualityCheckDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  qualityCheck: QualityCheckData | null
  onEdit?: (qualityCheck: QualityCheckData) => void
  onDelete?: (qualityCheck: QualityCheckData) => void
}

export const QualityCheckDetailsModal: React.FC<QualityCheckDetailsModalProps> = ({
  isOpen,
  onClose,
  qualityCheck,
  onEdit,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!qualityCheck) return null

  const statusConf = statusConfig[qualityCheck.status as keyof typeof statusConfig]
  const priorityConf = priorityConfig[qualityCheck.priority as keyof typeof priorityConfig]
  const checkTypeConf = checkTypeConfig[qualityCheck.checkType as keyof typeof checkTypeConfig]
  const growthStageConf =
    growthStageConfig[qualityCheck.growthStage as keyof typeof growthStageConfig]
  const leafColorConf = leafColorOptions.find(color => color.value === qualityCheck.leafColor)

  const getStatusIcon = () => {
    switch (qualityCheck.status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4" />
      case 'fail':
        return <XCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'pending':
        return <ClockIcon className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    if (score >= 4) return 'text-orange-600'
    return 'text-red-600'
  }

  const getHealthScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-100'
    if (score >= 6) return 'bg-yellow-100'
    if (score >= 4) return 'bg-orange-100'
    return 'bg-red-100'
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConf.bgColor}`}>
              <div className={statusConf.color}>{getStatusIcon()}</div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{checkTypeConf.label}</h2>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {qualityCheck.zone} -{' '}
                {cropTypes[parseInt(qualityCheck.cropType)] || qualityCheck.cropType}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>Chi tiết thông tin kiểm tra chất lượng</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
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
                  <p className="text-sm font-medium text-gray-700">Loại kiểm tra</p>
                  <Badge className={`${checkTypeConf.bgColor} ${checkTypeConf.color} border-0`}>
                    {checkTypeConf.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Độ ưu tiên</p>
                  <Badge className={`${priorityConf.bgColor} ${priorityConf.color} border-0`}>
                    {priorityConf.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Sức khỏe tổng thể</p>
                  <div
                    className={`px-3 py-1 rounded-full ${getHealthScoreBg(qualityCheck.overallHealth)}`}
                  >
                    <span
                      className={`text-sm font-bold ${getHealthScoreColor(qualityCheck.overallHealth)}`}
                    >
                      {qualityCheck.overallHealth}/10
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Ngày & Thời gian</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">
                      {new Date(qualityCheck.date).toLocaleDateString('vi-VN')} -{' '}
                      {qualityCheck.time}
                    </span>
                  </div>
                </div>
                {qualityCheck.inspector && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Người kiểm tra</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{qualityCheck.inspector}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plant Health Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Chi tiết sức khỏe cây trồng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Giai đoạn tăng trưởng</span>
                  </div>
                  <Badge className={`${growthStageConf.color} bg-opacity-10 border-0`}>
                    {growthStageConf.label}
                  </Badge>
                </div>

                {qualityCheck.leafColor && leafColorConf && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Màu lá</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${leafColorConf.color}`}></div>
                      <span className="text-sm">{leafColorConf.label}</span>
                    </div>
                  </div>
                )}

                {qualityCheck.plantHeight && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Ruler className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Chiều cao cây</span>
                    </div>
                    <span className="text-lg font-bold text-blue-700">
                      {qualityCheck.plantHeight} cm
                    </span>
                  </div>
                )}

                {qualityCheck.fruitCount !== undefined && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Số lượng quả</span>
                    </div>
                    <span className="text-lg font-bold text-orange-700">
                      {qualityCheck.fruitCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Health Indicators */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  className={`p-3 rounded-lg border-2 ${qualityCheck.diseasePresent ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`h-4 w-4 ${qualityCheck.diseasePresent ? 'text-red-600' : 'text-green-600'}`}
                    />
                    <span className="text-sm font-medium">Bệnh tật</span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${qualityCheck.diseasePresent ? 'text-red-700' : 'text-green-700'}`}
                  >
                    {qualityCheck.diseasePresent ? 'Có dấu hiệu bệnh tật' : 'Không có bệnh tật'}
                  </p>
                </div>

                <div
                  className={`p-3 rounded-lg border-2 ${qualityCheck.pestPresent ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <Bug
                      className={`h-4 w-4 ${qualityCheck.pestPresent ? 'text-red-600' : 'text-green-600'}`}
                    />
                    <span className="text-sm font-medium">Sâu bệnh</span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${qualityCheck.pestPresent ? 'text-red-700' : 'text-green-700'}`}
                  >
                    {qualityCheck.pestPresent ? 'Có sâu bệnh' : 'Không có sâu bệnh'}
                  </p>
                </div>

                <div
                  className={`p-3 rounded-lg border-2 ${qualityCheck.nutrientDeficiency ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <Droplets
                      className={`h-4 w-4 ${qualityCheck.nutrientDeficiency ? 'text-yellow-600' : 'text-green-600'}`}
                    />
                    <span className="text-sm font-medium">Dinh dưỡng</span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${qualityCheck.nutrientDeficiency ? 'text-yellow-700' : 'text-green-700'}`}
                  >
                    {qualityCheck.nutrientDeficiency ? 'Thiếu dinh dưỡng' : 'Đủ dinh dưỡng'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environmental Conditions */}
          {(qualityCheck.soilMoisture || qualityCheck.temperature || qualityCheck.humidity) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Điều kiện môi trường
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {qualityCheck.temperature && (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Thermometer className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">Nhiệt độ</p>
                        <p className="text-lg font-bold text-orange-700">
                          {qualityCheck.temperature}°C
                        </p>
                      </div>
                    </div>
                  )}
                  {qualityCheck.humidity && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Độ ẩm</p>
                        <p className="text-lg font-bold text-blue-700">{qualityCheck.humidity}%</p>
                      </div>
                    </div>
                  )}
                  {qualityCheck.soilMoisture && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Droplets className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Độ ẩm đất</p>
                        <p className="text-lg font-bold text-green-700">
                          {qualityCheck.soilMoisture}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Issues & Recommendations */}
          {((qualityCheck.issues?.length ?? 0) > 0 ||
            (qualityCheck.recommendedActions?.length ?? 0) > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Vấn đề & Khuyến nghị
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(qualityCheck.issues?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Vấn đề phát hiện</h4>
                      <div className="space-y-2">
                        {(qualityCheck.issues ?? []).map((issue, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-red-50 rounded-lg"
                          >
                            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <span className="text-sm text-red-700">{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(qualityCheck.recommendedActions?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Hành động khuyến nghị
                      </h4>
                      <div className="space-y-2">
                        {(qualityCheck.recommendedActions ?? []).map((action, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"
                          >
                            <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-blue-700">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Follow-up */}
          {qualityCheck.requiresFollowUp && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Theo dõi tiếp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Cần theo dõi tiếp</span>
                  </div>
                  {qualityCheck.followUpDate && (
                    <p className="text-sm text-yellow-700">
                      Ngày theo dõi:{' '}
                      {new Date(qualityCheck.followUpDate).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {qualityCheck.photos && qualityCheck.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Hình ảnh ({qualityCheck.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {qualityCheck.photos.map((_, index) => (
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
          {qualityCheck.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ghi chú
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-line">
                    {qualityCheck.notes}
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
                  Xác nhận xóa kiểm tra chất lượng
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  Bạn có chắc chắn muốn xóa bản kiểm tra "{checkTypeConf.label}" này? Hành động này
                  không thể hoàn tác.
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
                      onDelete?.(qualityCheck)
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
                  onEdit(qualityCheck)
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
