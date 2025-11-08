import type {
  IrrigationSchedule,
  SystemSettings,
  StaffDevice,
  WorkLog,
  QualityCheck,
} from '@/shared/lib/localData'

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
]

export const systemSettings: SystemSettings = {
  general: {
    systemName: 'IFMS - Hệ thống Quản lý Trang trại Tích hợp',
    primaryColor: '#16a34a',
    logoUrl: '/images/ifms-logo.png',
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    alertFrequency: 'daily',
  },
  iotConfig: {
    defaultPollingInterval: 15,
    sensorThresholds: {
      temperature: { min: 10, max: 35 },
      moisture: { min: 20, max: 80 },
      ph: { min: 6.0, max: 7.5 },
    },
  },
  updatedAt: '2024-01-15T10:30:00Z',
}

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
]

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
]

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
]
