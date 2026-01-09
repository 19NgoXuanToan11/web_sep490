import React from 'react'
import { motion } from 'framer-motion'
import { Sprout } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { CropRequirementView, PlantStage } from '@/shared/api/cropRequirementService'

const PLANT_STAGE_CONFIG: Record<PlantStage, { label: string; color: string; description: string }> = {
    Preparation: {
        label: 'Chuẩn bị gieo trồng',
        color: 'bg-blue-500',
        description: 'Chuẩn bị đất và gieo giống (0–7 ngày)',
    },
    Seedling: {
        label: 'Nảy mầm',
        color: 'bg-green-400',
        description: 'Theo dõi độ ẩm và sự phát triển mầm (8–18 ngày)',
    },
    Vegetative: {
        label: 'Tăng trưởng lá',
        color: 'bg-emerald-500',
        description: 'Phát triển thân lá, tăng cường ánh sáng và dinh dưỡng (19–35 ngày)',
    },
    Harvest: {
        label: 'Thu hoạch',
        color: 'bg-yellow-500',
        description: 'Sẵn sàng thu hoạch và đánh giá chất lượng (36–37 ngày)',
    },
}

interface CropGrowthStagesWidgetProps {
    requirements: CropRequirementView[]
    className?: string
}

export const CropGrowthStagesWidget: React.FC<CropGrowthStagesWidgetProps> = ({
    requirements,
    className = '',
}) => {
    const stageDistribution = React.useMemo(() => {
        const total = requirements.length
        const distribution = Object.keys(PLANT_STAGE_CONFIG).map((stage) => {
            const count = requirements.filter(
                (req) => req.plantStage === stage
            ).length
            const percent = total > 0 ? Math.round((count / total) * 100) : 0
            return {
                stage: stage as PlantStage,
                count,
                percent,
                config: PLANT_STAGE_CONFIG[stage as PlantStage],
            }
        })

        return {
            total,
            active: requirements.filter((req) => req.isActive).length,
            stages: distribution,
        }
    }, [requirements])

    return (
        <Card className={`border-0 shadow-lg bg-white ${className}`}>
            <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        Phân bố giai đoạn tăng trưởng
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="space-y-3">
                        {stageDistribution.stages.map((stage, index) => (
                            <motion.div
                                key={stage.stage}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-700">
                                            {stage.config.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 font-medium">
                                            {stage.count}
                                        </span>
                                        <span className="text-xs text-gray-500 w-12 text-right">
                                            ({stage.percent}%)
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                    <motion.div
                                        className={`h-full ${stage.config.color} rounded-full`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stage.percent}%` }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {stageDistribution.total === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <Sprout className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                            <p>Chưa có dữ liệu cây trồng</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

