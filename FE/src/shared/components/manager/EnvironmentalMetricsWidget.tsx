import React from 'react'
import { motion } from 'framer-motion'
import { Thermometer, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { CropRequirementView } from '@/shared/api/cropRequirementService'

interface EnvironmentalMetricsWidgetProps {
    requirements: CropRequirementView[]
    sensorData?: {
        temperature?: number | null
        humidity?: number | null
        light?: number | null
    } | null
    className?: string
}

interface MetricStats {
    value: number | null
    min: number | null
    max: number | null
    avg: number | null
    count: number
    status: 'optimal' | 'warning' | 'critical' | 'unknown'
}

const OPTIMAL_RANGES = {
    temperature: { min: 20, max: 30 },
    moisture: { min: 40, max: 70 },
    light: { min: 200, max: 500 },
}

const getMetricStatus = (
    value: number | null,
    type: 'temperature' | 'moisture' | 'light'
): 'optimal' | 'warning' | 'critical' | 'unknown' => {
    if (value === null) return 'unknown'
    const range = OPTIMAL_RANGES[type]
    if (value >= range.min && value <= range.max) return 'optimal'
    const deviation = Math.abs(value - (range.min + range.max) / 2) / ((range.max - range.min) / 2)
    return deviation > 0.5 ? 'critical' : 'warning'
}

export const EnvironmentalMetricsWidget: React.FC<EnvironmentalMetricsWidgetProps> = ({
    requirements,
    sensorData,
    className = '',
}) => {
    const metrics = React.useMemo(() => {
        const activeRequirements = requirements.filter((req) => req.isActive)

        const calculateStats = (
            key: 'temperature' | 'moisture' | 'lightRequirement'
        ): MetricStats => {
            const requirementValues = activeRequirements
                .map((req) => {
                    if (key === 'lightRequirement') return req.lightRequirement
                    if (key === 'temperature') return req.temperature
                    if (key === 'moisture') return req.soilMoisture
                    return null
                })
                .filter((v): v is number => v !== null && v !== undefined)

            let values = requirementValues
            if (values.length === 0 && sensorData) {
                const sensorValue =
                    key === 'temperature' ? sensorData.temperature :
                        key === 'moisture' ? sensorData.humidity :
                            key === 'lightRequirement' ? sensorData.light : null

                if (sensorValue !== null && sensorValue !== undefined && !isNaN(sensorValue)) {
                    values = [sensorValue]
                }
            }

            if (values.length === 0) {
                return {
                    value: null,
                    min: null,
                    max: null,
                    avg: null,
                    count: 0,
                    status: 'unknown',
                }
            }

            const avg = values.reduce((sum, v) => sum + v, 0) / values.length
            const min = Math.min(...values)
            const max = Math.max(...values)
            const status = getMetricStatus(
                avg,
                key === 'lightRequirement' ? 'light' : (key as 'temperature' | 'moisture')
            )

            return {
                value: avg,
                min,
                max,
                avg,
                count: values.length,
                status,
            }
        }

        return {
            temperature: calculateStats('temperature'),
            moisture: calculateStats('moisture'),
            light: calculateStats('lightRequirement'),
            totalActive: activeRequirements.length,
        }
    }, [requirements, sensorData])

    const MetricCard = ({
        title,
        unit,
        stats,
    }: {
        title: string
        unit: string
        stats: MetricStats
    }) => {
        const statusConfig = {
            optimal: {
                icon: CheckCircle,
                color: 'text-green-600',
                bg: 'bg-green-50',
                border: 'border-green-200',
                label: 'Tối ưu',
            },
            warning: {
                icon: AlertTriangle,
                color: 'text-yellow-600',
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                label: 'Cảnh báo',
            },
            critical: {
                icon: AlertTriangle,
                color: 'text-red-600',
                bg: 'bg-red-50',
                border: 'border-red-200',
                label: 'Nguy hiểm',
            },
            unknown: {
                icon: AlertTriangle,
                color: 'text-gray-500',
                bg: 'bg-gray-50',
                border: 'border-gray-200',
                label: 'Chưa có dữ liệu',
            },
        }

        const config = statusConfig[stats.status]

        return (
            <motion.div
                className={`p-4 rounded-lg ${config.bg} hover:shadow-md transition-all`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
                            <p className="text-xs text-gray-500">{stats.count} lô đang theo dõi</p>
                        </div>
                    </div>
                </div>

                {stats.value !== null ? (
                    <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900">
                                {stats.avg?.toFixed(1)}
                            </span>
                            <span className="text-sm text-gray-600">{unit}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
                    </div>
                )}
            </motion.div>
        )
    }

    return (
        <Card className={`border-0 shadow-lg bg-white ${className}`}>
            <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    Chỉ số môi trường
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <MetricCard
                        title="Nhiệt độ"
                        unit="°C"
                        stats={metrics.temperature}
                    />
                    <MetricCard
                        title="Độ ẩm"
                        unit="%"
                        stats={metrics.moisture}
                    />
                    <MetricCard
                        title="Ánh sáng"
                        unit="lux"
                        stats={metrics.light}
                    />
                </div>

                {metrics.totalActive === 0 && (
                    <div className="text-center py-8 text-gray-500 mt-4">
                        <Thermometer className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Chưa có lô cây trồng đang hoạt động</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

