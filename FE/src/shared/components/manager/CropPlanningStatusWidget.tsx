import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import type { CropRequirementView } from '@/shared/api/cropRequirementService'

interface CropPlanningStatusWidgetProps {
    requirements: CropRequirementView[]
    className?: string
}

export const CropPlanningStatusWidget: React.FC<CropPlanningStatusWidgetProps> = ({
    requirements,
    className = '',
}) => {
    const planningStats = React.useMemo(() => {
        const total = requirements.length
        const active = requirements.filter((req) => req.isActive).length
        const inactive = total - active

        const withCompleteData = requirements.filter(
            (req) =>
                req.isActive &&
                req.temperature !== null &&
                (req as any).soilMoisture !== null &&
                req.lightRequirement !== null &&
                req.estimatedDate !== null
        ).length

        const missingData = requirements.filter(
            (req) =>
                req.isActive &&
                (req.temperature === null ||
                    (req as any).soilMoisture === null ||
                    req.lightRequirement === null ||
                    req.estimatedDate === null)
        ).length

        const withNotes = requirements.filter(
            (req) => req.isActive && req.notes && req.notes.trim().length > 0
        ).length

        const completionRate = active > 0 ? Math.round((withCompleteData / active) * 100) : 0

        return {
            total,
            active,
            inactive,
            withCompleteData,
            missingData,
            withNotes,
            completionRate,
        }
    }, [requirements])

    const statusItems = [
        {
            label: 'Tổng kế hoạch',
            value: planningStats.total,
            icon: BarChart3,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            description: `${planningStats.active} đang hoạt động`,
        },
        {
            label: 'Hoàn chỉnh',
            value: planningStats.withCompleteData,
            icon: CheckCircle2,
            color: 'text-green-600',
            bg: 'bg-green-50',
            description: `${planningStats.completionRate}% tỷ lệ hoàn thành`,
        },
        {
            label: 'Cần bổ sung',
            value: planningStats.missingData,
            icon: AlertCircle,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
            description: 'Thiếu dữ liệu môi trường',
        },
        {
            label: 'Có ghi chú',
            value: planningStats.withNotes,
            icon: Clock,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            description: 'Kế hoạch chi tiết',
        },
    ]

    return (
        <Card className={`border-0 shadow-lg bg-white ${className}`}>
            <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        Tình trạng kế hoạch
                    </CardTitle>
                    <Badge
                        variant={planningStats.completionRate >= 80 ? 'default' : 'secondary'}
                        className={
                            planningStats.completionRate >= 80
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : ''
                        }
                    >
                        {planningStats.completionRate}% hoàn thành
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Tỷ lệ hoàn thành dữ liệu
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                                {planningStats.completionRate}%
                            </span>
                        </div>
                        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                            <motion.div
                                className={`h-full rounded-full ${planningStats.completionRate >= 80
                                    ? 'bg-green-500'
                                    : planningStats.completionRate >= 50
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${planningStats.completionRate}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {planningStats.withCompleteData} / {planningStats.active} kế hoạch có đầy đủ dữ liệu
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {statusItems.map((item, index) => {
                            const Icon = item.icon
                            return (
                                <motion.div
                                    key={item.label}
                                    className={`p-4 rounded-lg border border-gray-200 ${item.bg} hover:shadow-md transition-all`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Icon className={`h-4 w-4 ${item.color}`} />
                                            <span className="text-sm font-medium text-gray-700">
                                                {item.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 mb-1">
                                        {item.value}
                                    </div>
                                    <p className="text-xs text-gray-600">{item.description}</p>
                                </motion.div>
                            )
                        })}
                    </div>

                    {planningStats.missingData > 0 && (
                        <motion.div
                            className="p-4 rounded-lg bg-yellow-50 border border-yellow-200"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-yellow-900 mb-1">
                                        Cần bổ sung dữ liệu
                                    </p>
                                    <p className="text-xs text-yellow-700">
                                        Có {planningStats.missingData} kế hoạch đang thiếu thông tin môi trường hoặc
                                        thời gian dự kiến. Vui lòng cập nhật để theo dõi chính xác hơn.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {planningStats.total === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                            <p>Chưa có kế hoạch cây trồng</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

