export const APP_CONFIG = {
  DEFAULT_USER: {
    name: 'Quản lý nông trại',
    email: 'manager@farm.com',
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
  },
  ROLES: {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    STAFF: 'Staff',
    CUSTOMER: 'Customer',
  },
  STATUS: {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
  },
  DEVICE_STATUS: {
    IDLE: 'Idle',
    RUNNING: 'Running',
    PAUSED: 'Paused',
  },
  SENSOR_RANGES: {
    TEMPERATURE: { min: 0, max: 60 },
    HUMIDITY: { min: 0, max: 100 },
    SOIL_MOISTURE: { min: 0, max: 100 },
    RAIN_LEVEL: { min: 0, max: 100 },
    LIGHT: { min: 0, max: 1200 },
    SERVO_ANGLE: { min: 0, max: 180 },
  },
  SIMULATION: {
    STATUS_UPDATE_INTERVAL: 3000,
    ERROR_RATE: 0.1,
    LATENCY_RANGE: { min: 200, max: 500 },
  },
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ADMIN: {
    USERS: '/admin/users',
  },
  MANAGER: {
    DASHBOARD: '/manager/dashboard',
    ORDERS: '/manager/orders',
    PRODUCTS: '/manager/products',
    IOT_DASHBOARD: '/manager/iot-dashboard',
    IOT_DEVICES: '/manager/iot-devices',
    FARM_ACTIVITIES: '/manager/farm-activities',
  },
  STAFF: {
    OPERATIONS: '/staff/operations',
    WORK_LOGS: '/staff/work-logs',
  },
} as const

export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Đăng nhập thành công',
    LOGOUT: 'Đăng xuất thành công',
    CREATE: 'Tạo mới thành công',
    UPDATE: 'Cập nhật thành công',
    DELETE: 'Xóa thành công',
  },
  ERROR: {
    LOGIN_FAILED: 'Đăng nhập thất bại',
    NETWORK_ERROR: 'Lỗi kết nối mạng',
    UNAUTHORIZED: 'Không có quyền truy cập',
    NOT_FOUND: 'Không tìm thấy dữ liệu',
    VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
    UNKNOWN_ERROR: 'Đã xảy ra lỗi không xác định',
  },
} as const
