import { z } from 'zod'

export const qualityCheckSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, 'Ngày là bắt buộc'),
  time: z.string().min(1, 'Thời gian là bắt buộc'),
  zone: z.string().min(1, 'Khu vực là bắt buộc'),
  cropType: z.string().min(1, 'Loại cây trồng là bắt buộc'),
  checkType: z.enum(['routine', 'disease', 'pest', 'growth', 'harvest-ready']),
  status: z.enum(['pass', 'fail', 'warning', 'pending']),
  inspector: z.string().min(1, 'Người kiểm tra là bắt buộc'),

  overallHealth: z.number().min(1).max(10),
  growthStage: z.enum(['seedling', 'vegetative', 'flowering', 'fruiting', 'mature']),

  diseasePresent: z.boolean(),
  pestPresent: z.boolean(),
  nutrientDeficiency: z.boolean(),

  plantHeight: z.number().optional(),
  leafColor: z.enum(['healthy-green', 'light-green', 'yellow', 'brown', 'other']).optional(),
  fruitCount: z.number().optional(),

  soilMoisture: z.number().min(0).max(100).optional(),
  temperature: z.number().optional(),
  humidity: z.number().min(0).max(100).optional(),

  issues: z.array(z.string()).optional(),
  recommendedActions: z.array(z.string()).optional(),
  notes: z.string().optional(),

  photos: z.array(z.string()).optional(),

  requiresFollowUp: z.boolean(),
  followUpDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
})

export const qualityCheckFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  zone: z.string().optional(),
  cropType: z.string().optional(),
  checkType: z.enum(['all', 'routine', 'disease', 'pest', 'growth', 'harvest-ready']).optional(),
  status: z.enum(['all', 'pass', 'fail', 'warning', 'pending']).optional(),
  inspector: z.string().optional(),
  priority: z.enum(['all', 'low', 'medium', 'high', 'critical']).optional(),
  requiresFollowUp: z.boolean().optional(),
})

export type QualityCheckData = z.infer<typeof qualityCheckSchema>
export type QualityCheckFilterData = z.infer<typeof qualityCheckFilterSchema>

export const validateQualityCheck = (data: unknown) => qualityCheckSchema.safeParse(data)
export const validateQualityCheckFilter = (data: unknown) =>
  qualityCheckFilterSchema.safeParse(data)

export const cropTypes = [
  'Cà chua',
  'Dưa chuột',
  'Ớt',
  'Xà lách',
  'Rau bina',
  'Rau thơm',
  'Dâu tây',
  'Cà tím',
  'Đậu',
  'Đậu Hà Lan',
  'Cà rốt',
  'Củ cải',
  'Khác',
]

export const zoneOptions = [
  'Zone A - Greenhouse 1',
  'Zone B - Outdoor Field',
  'Zone C - Nursery',
  'Zone D - Research Area',
  'Zone E - Field Extension',
  'Zone F - Hydroponic Greenhouse',
  'Zone G - Cold Storage',
  'Zone H - Seedling Area',
]

export const defaultQualityCheckValues: QualityCheckData = {
  date: new Date().toISOString().split('T')[0],
  time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  zone: zoneOptions[0],
  cropType: cropTypes[0],
  checkType: 'routine',
  status: 'pending',
  inspector: '',
  overallHealth: 7,
  growthStage: 'vegetative',
  diseasePresent: false,
  pestPresent: false,
  nutrientDeficiency: false,
  leafColor: 'healthy-green',
  issues: [],
  recommendedActions: [],
  notes: '',
  photos: [],
  requiresFollowUp: false,
  priority: 'medium',
}

export const checkTypeConfig = {
  routine: {
    label: 'Kiểm tra định kỳ',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: 'calendar',
    description: 'Kiểm tra thường xuyên theo lịch',
  },
  disease: {
    label: 'Kiểm tra bệnh tật',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'alert-triangle',
    description: 'Phát hiện và theo dõi bệnh tật',
  },
  pest: {
    label: 'Kiểm tra sâu bệnh',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: 'bug',
    description: 'Đánh giá tình trạng sâu bệnh',
  },
  growth: {
    label: 'Kiểm tra tăng trưởng',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'trending-up',
    description: 'Đánh giá tiến độ tăng trưởng',
  },
  'harvest-ready': {
    label: 'Sẵn sàng thu hoạch',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: 'harvest',
    description: 'Đánh giá sẵn sàng thu hoạch',
  },
}

export const statusConfig = {
  pass: {
    label: 'Đạt',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'check-circle',
    description: 'Đạt tiêu chuẩn chất lượng',
  },
  fail: {
    label: 'Không đạt',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'x-circle',
    description: 'Không đạt tiêu chuẩn chất lượng',
  },
  warning: {
    label: 'Cảnh báo',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'alert-triangle',
    description: 'Phát hiện vấn đề, cần theo dõi',
  },
  pending: {
    label: 'Đang chờ',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'clock',
    description: 'Đang trong quá trình đánh giá',
  },
}

export const priorityConfig = {
  low: {
    label: 'Thấp',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Theo dõi trong lần kiểm tra định kỳ tiếp theo',
  },
  medium: {
    label: 'Trung bình',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Xử lý trong vài ngày tới',
  },
  high: {
    label: 'Cao',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Cần chú ý ngay lập tức',
  },
  critical: {
    label: 'Khẩn cấp',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Cần hành động tức thì',
  },
}

export const growthStageConfig = {
  seedling: { label: 'Cây con', color: 'text-green-400' },
  vegetative: { label: 'Sinh trưởng', color: 'text-green-600' },
  flowering: { label: 'Ra hoa', color: 'text-pink-600' },
  fruiting: { label: 'Kết quả', color: 'text-orange-600' },
  mature: { label: 'Chín', color: 'text-purple-600' },
}

export const leafColorOptions = [
  { value: 'healthy-green', label: 'Xanh khỏe mạnh', color: 'bg-green-500' },
  { value: 'light-green', label: 'Xanh nhạt', color: 'bg-green-300' },
  { value: 'yellow', label: 'Vàng', color: 'bg-yellow-400' },
  { value: 'brown', label: 'Nâu', color: 'bg-yellow-800' },
  { value: 'other', label: 'Khác', color: 'bg-gray-400' },
]

export const commonIssues = [
  'Lá vàng',
  'Tăng trưởng chậm',
  'Sâu bệnh tấn công',
  'Triệu chứng bệnh tật',
  'Thiếu dinh dưỡng',
  'Tưới quá nhiều nước',
  'Thiếu nước',
  'Căng thẳng nhiệt độ',
  'Phát triển quả kém',
  'Héo úa',
  'Đổi màu',
  'Mô hình tăng trưởng bất thường',
]

export const recommendedActions = [
  'Tăng tần suất tưới nước',
  'Giảm tần suất tưới nước',
  'Bón phân',
  'Xử lý sâu bệnh',
  'Điều trị bệnh tật',
  'Điều chỉnh nhiệt độ',
  'Cải thiện thông gió',
  'Cắt tỉa vùng bị ảnh hưởng',
  'Thu hoạch ngay lập tức',
  'Theo dõi chặt chẽ',
  'Cách ly cây bị ảnh hưởng',
  'Tham khảo chuyên gia',
]

export const qualityCheckSortOptions = [
  { value: 'date', label: 'Ngày' },
  { value: 'priority', label: 'Độ ưu tiên' },
  { value: 'status', label: 'Trạng thái' },
  { value: 'overallHealth', label: 'Sức khỏe tổng thể' },
  { value: 'zone', label: 'Khu vực' },
  { value: 'cropType', label: 'Loại cây trồng' },
  { value: 'inspector', label: 'Người kiểm tra' },
]
