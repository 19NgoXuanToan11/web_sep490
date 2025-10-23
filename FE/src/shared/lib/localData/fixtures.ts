import type {
  Device,
  IrrigationSchedule,
  IrrigationRule,
  SystemSettings,
  StaffDevice,
  WorkLog,
  QualityCheck,
} from '@/shared/lib/localData'

// Tạo dữ liệu thử nghiệm thực tế cho tất cả các tính năng
export const devices: Device[] = [
  {
    id: 'dev-1',
    zone: 'Khu A - Nhà kính 1',
    name: 'Hệ thống phun nước A1',
    status: 'Idle',
    lastRun: '2024-01-15T06:00:00Z',
    nextRun: '2024-01-16T06:00:00Z',
    uptimePct: 95.2,
  },
  {
    id: 'dev-2',
    zone: 'Khu A - Nhà kính 1',
    name: 'Hệ thống nhỏ giọt A2',
    status: 'Running',
    lastRun: '2024-01-15T14:00:00Z',
    nextRun: '2024-01-15T18:00:00Z',
    uptimePct: 98.7,
  },
  {
    id: 'dev-3',
    zone: 'Khu B - Cánh đồng ngoài trời',
    name: 'Hệ thống phun nước B1',
    status: 'Paused',
    lastRun: '2024-01-14T19:00:00Z',
    nextRun: '2024-01-16T05:30:00Z',
    uptimePct: 92.1,
  },
  {
    id: 'dev-4',
    zone: 'Khu B - Cánh đồng ngoài trời',
    name: 'Hệ thống nhỏ giọt B2',
    status: 'Idle',
    lastRun: '2024-01-15T08:00:00Z',
    nextRun: '2024-01-16T08:00:00Z',
    uptimePct: 96.8,
  },
  {
    id: 'dev-5',
    zone: 'Khu C - Nhà kính 2',
    name: 'Hệ thống phun sương C1',
    status: 'Running',
    lastRun: '2024-01-15T10:00:00Z',
    nextRun: '2024-01-15T16:00:00Z',
    uptimePct: 99.1,
  },
  {
    id: 'dev-6',
    zone: 'Khu C - Nhà kính 2',
    name: 'Hệ thống phun nước C2',
    status: 'Idle',
    lastRun: '2024-01-15T12:00:00Z',
    nextRun: '2024-01-16T12:00:00Z',
    uptimePct: 94.5,
  },
  {
    id: 'dev-7',
    zone: 'Khu D - Vườn ươm',
    name: 'Hệ thống nhỏ giọt D1',
    status: 'Idle',
    lastRun: '2024-01-15T07:00:00Z',
    nextRun: '2024-01-16T07:00:00Z',
    uptimePct: 97.3,
  },
  {
    id: 'dev-8',
    zone: 'Khu D - Vườn ươm',
    name: 'Hệ thống phun sương D2',
    status: 'Running',
    lastRun: '2024-01-15T13:00:00Z',
    nextRun: '2024-01-15T19:00:00Z',
    uptimePct: 93.8,
  },
  {
    id: 'dev-9',
    zone: 'Khu E - Khu nghiên cứu',
    name: 'Hệ thống nhỏ giọt chính xác E1',
    status: 'Idle',
    lastRun: '2024-01-15T09:00:00Z',
    nextRun: '2024-01-16T09:00:00Z',
    uptimePct: 98.9,
  },
  {
    id: 'dev-10',
    zone: 'Khu E - Khu nghiên cứu',
    name: 'Hệ thống phun nước thông minh E2',
    status: 'Paused',
    lastRun: '2024-01-15T11:00:00Z',
    nextRun: '2024-01-16T11:00:00Z',
    uptimePct: 91.7,
  },
]

export const irrigationSchedules: IrrigationSchedule[] = [
  {
    id: 'sched-1',
    deviceId: 'dev-1',
    title: 'Tưới nước nhà kính buổi sáng',
    recurrenceText: 'Hàng ngày lúc 6:00 sáng',
    startTime: '06:00',
    endTime: '06:30',
    moistureThresholdPct: 30,
    enabled: true,
    nextRun: '2024-01-16T06:00:00Z',
    status: 'Scheduled',
  },
  {
    id: 'sched-2',
    deviceId: 'dev-2',
    title: 'Chu trình nhỏ giọt buổi chiều',
    recurrenceText: 'Mỗi 6 giờ',
    startTime: '14:00',
    endTime: '14:45',
    moistureThresholdPct: 25,
    enabled: true,
    nextRun: '2024-01-15T20:00:00Z',
    status: 'Running',
  },
  {
    id: 'sched-3',
    deviceId: 'dev-3',
    title: 'Tưới cánh đồng - Sáng sớm',
    recurrenceText: 'Hàng ngày lúc 5:30 sáng',
    startTime: '05:30',
    endTime: '07:00',
    moistureThresholdPct: 35,
    enabled: false,
    nextRun: '2024-01-16T05:30:00Z',
    status: 'Paused',
  },
  {
    id: 'sched-4',
    deviceId: 'dev-4',
    title: 'Hệ thống nhỏ giọt cánh đồng',
    recurrenceText: 'Hàng ngày lúc 8:00 sáng',
    startTime: '08:00',
    endTime: '09:00',
    moistureThresholdPct: 28,
    enabled: true,
    nextRun: '2024-01-16T08:00:00Z',
    status: 'Scheduled',
  },
  {
    id: 'sched-5',
    deviceId: 'dev-5',
    title: 'Phun sương nhà kính 2',
    recurrenceText: 'Mỗi 6 giờ',
    startTime: '10:00',
    endTime: '10:15',
    moistureThresholdPct: 40,
    enabled: true,
    nextRun: '2024-01-15T16:00:00Z',
    status: 'Running',
  },
  // ... more schedules (truncated for brevity)
]

export const irrigationRules: IrrigationRule[] = [
  {
    id: 'rule-1',
    name: 'Khẩn cấp độ ẩm thấp',
    conditionText: 'Nếu độ ẩm đất < 15%, chạy ngay lập tức trong 30 phút',
    enabled: true,
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'rule-2',
    name: 'Tăng cường nhà kính buổi sáng',
    conditionText: 'Nếu độ ẩm đất < 30% từ 5:00-6:00 sáng, chạy trong 15 phút',
    enabled: true,
    createdAt: '2024-01-08T14:30:00Z',
  },
  {
    id: 'rule-3',
    name: 'Gia hạn ngày nóng',
    conditionText: 'Nếu nhiệt độ > 85°F và độ ẩm đất < 40%, kéo dài thời gian chạy thêm 10 phút',
    enabled: true,
    createdAt: '2024-01-05T09:15:00Z',
  },
  // ... more rules (truncated for brevity)
]

// =======================================================
// DỮ LIỆU ADMIN & NHÂN VIÊN - DỮ LIỆU MỞ RỘNG
// =======================================================

// Cài đặt Hệ thống
export const systemSettings: SystemSettings = {
  general: {
    systemName: 'IFMS - Hệ thống Quản lý Trang trại Tích hợp',
    primaryColor: '#16a34a', // green-600
    logoUrl: '/images/ifms-logo.png',
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    alertFrequency: 'daily',
  },
  iotConfig: {
    defaultPollingInterval: 15, // minutes
    sensorThresholds: {
      temperature: { min: 10, max: 35 }, // Celsius
      moisture: { min: 20, max: 80 }, // percentage
      ph: { min: 6.0, max: 7.5 }, // pH scale
    },
  },
  updatedAt: '2024-01-15T10:30:00Z',
}

// Thiết bị Nhân viên cho Vận hành
export const staffDevices: StaffDevice[] = [
  {
    id: 'staff-dev-1',
    name: 'Hệ thống phun nước Nhà kính A1',
    zone: 'Khu A - Nhà kính 1',
    status: 'Running',
    lastAction: '2024-01-15T14:30:00Z',
    nextSchedule: '2024-01-16T06:00:00Z',
    needsMaintenance: false,
    uptimePct: 97.5,
  },
  {
    id: 'staff-dev-2',
    name: 'Hệ thống nhỏ giọt Cánh đồng B2',
    zone: 'Khu B - Cánh đồng ngoài trời',
    status: 'Idle',
    lastAction: '2024-01-15T08:15:00Z',
    nextSchedule: '2024-01-16T08:00:00Z',
    batteryLevel: 85,
    needsMaintenance: false,
    uptimePct: 94.2,
  },
  // ... more staff devices (truncated for brevity)
]

// Nhật ký Công việc cho Nhân viên
export const workLogs: WorkLog[] = [
  {
    id: 'log-1',
    date: '2024-01-15T14:30:00Z',
    taskType: 'Irrigation',
    notes: 'Bắt đầu chu trình tưới buổi sáng cho nhà kính A1. Hệ thống hoạt động bình thường.',
    deviceId: 'staff-dev-1',
    duration: 45,
    createdBy: 'user-3',
    createdAt: '2024-01-15T14:35:00Z',
    updatedAt: '2024-01-15T14:35:00Z',
  },
  {
    id: 'log-2',
    date: '2024-01-15T08:15:00Z',
    taskType: 'Maintenance',
    notes: 'Thực hiện vệ sinh bộ lọc định kỳ cho hệ thống nhỏ giọt B2. Không phát hiện vấn đề.',
    deviceId: 'staff-dev-2',
    duration: 30,
    createdBy: 'user-4',
    createdAt: '2024-01-15T08:45:00Z',
    updatedAt: '2024-01-15T08:45:00Z',
  },
  // ... more work logs (truncated for brevity)
]

// Kiểm tra Chất lượng cho Nhân viên
export const qualityChecks: QualityCheck[] = [
  {
    id: 'qc-1',
    productBatchId: 'batch-2024-001',
    productName: 'Cà chua bi',
    checkedDate: '2024-01-15T14:20:00Z',
    checkedBy: 'user-14',
    items: [
      { id: 'qci-1', name: 'Tính nhất quán màu sắc', passed: true },
      { id: 'qci-2', name: 'Tính đồng nhất kích thước', passed: true },
      { id: 'qci-3', name: 'Kiểm tra độ cứng', passed: true },
      { id: 'qci-4', name: 'Kiểm tra hư hại sâu bệnh', passed: true },
      {
        id: 'qci-5',
        name: 'Hàm lượng đường Brix',
        passed: true,
        comments: '8.5° Brix - độ ngọt xuất sắc',
      },
    ],
    overallStatus: 'Pass',
    createdAt: '2024-01-15T14:25:00Z',
    updatedAt: '2024-01-15T14:25:00Z',
  },
  // ... more quality checks (truncated for brevity)
]
