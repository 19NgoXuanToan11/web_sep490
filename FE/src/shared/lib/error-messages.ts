// Centralized error message mapping for Vietnamese localization

export interface ErrorMessage {
  code: string
  vietnamese: string
  context?: string
}

// HTTP Status Code Error Messages
export const HTTP_ERROR_MESSAGES: Record<number, ErrorMessage> = {
  400: {
    code: 'BAD_REQUEST',
    vietnamese: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra thông tin và thử lại.',
    context: 'Invalid request data'
  },
  401: {
    code: 'UNAUTHORIZED',
    vietnamese: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    context: 'Authentication required'
  },
  403: {
    code: 'FORBIDDEN',
    vietnamese: 'Bạn không có quyền thực hiện thao tác này.',
    context: 'Access denied'
  },
  404: {
    code: 'NOT_FOUND',
    vietnamese: 'Không tìm thấy dữ liệu yêu cầu.',
    context: 'Resource not found'
  },
  409: {
    code: 'CONFLICT',
    vietnamese: 'Dữ liệu đã tồn tại hoặc có xung đột. Vui lòng kiểm tra lại.',
    context: 'Data conflict'
  },
  422: {
    code: 'VALIDATION_ERROR',
    vietnamese: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra và nhập lại.',
    context: 'Validation failed'
  },
  429: {
    code: 'TOO_MANY_REQUESTS',
    vietnamese: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
    context: 'Rate limit exceeded'
  },
  500: {
    code: 'INTERNAL_SERVER_ERROR',
    vietnamese: 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
    context: 'Server error'
  },
  502: {
    code: 'BAD_GATEWAY',
    vietnamese: 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.',
    context: 'Gateway error'
  },
  503: {
    code: 'SERVICE_UNAVAILABLE',
    vietnamese: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
    context: 'Service unavailable'
  },
  504: {
    code: 'GATEWAY_TIMEOUT',
    vietnamese: 'Kết nối quá chậm. Vui lòng thử lại.',
    context: 'Gateway timeout'
  }
}

// Network and Connection Error Messages
export const NETWORK_ERROR_MESSAGES: Record<string, ErrorMessage> = {
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    vietnamese: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.',
    context: 'Network connection failed'
  },
  TIMEOUT_ERROR: {
    code: 'TIMEOUT_ERROR',
    vietnamese: 'Kết nối quá chậm. Vui lòng thử lại.',
    context: 'Request timeout'
  },
  ABORT_ERROR: {
    code: 'ABORT_ERROR',
    vietnamese: 'Yêu cầu đã bị hủy.',
    context: 'Request aborted'
  }
}

// Application-specific Error Messages
export const APP_ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Authentication & Authorization
  LOGIN_FAILED: {
    code: 'LOGIN_FAILED',
    vietnamese: 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.',
    context: 'Login credentials invalid'
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    vietnamese: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    context: 'Authentication token expired'
  },
  ACCESS_DENIED: {
    code: 'ACCESS_DENIED',
    vietnamese: 'Bạn không có quyền truy cập tính năng này.',
    context: 'Insufficient permissions'
  },

  // Data Operations
  FETCH_FAILED: {
    code: 'FETCH_FAILED',
    vietnamese: 'Không thể tải dữ liệu. Vui lòng thử lại.',
    context: 'Failed to fetch data'
  },
  CREATE_FAILED: {
    code: 'CREATE_FAILED',
    vietnamese: 'Không thể tạo mới. Vui lòng thử lại.',
    context: 'Failed to create record'
  },
  UPDATE_FAILED: {
    code: 'UPDATE_FAILED',
    vietnamese: 'Không thể cập nhật. Vui lòng thử lại.',
    context: 'Failed to update record'
  },
  DELETE_FAILED: {
    code: 'DELETE_FAILED',
    vietnamese: 'Không thể xóa. Vui lòng thử lại.',
    context: 'Failed to delete record'
  },
  SAVE_FAILED: {
    code: 'SAVE_FAILED',
    vietnamese: 'Không thể lưu dữ liệu. Vui lòng thử lại.',
    context: 'Failed to save data'
  },

  // Validation Errors
  REQUIRED_FIELD: {
    code: 'REQUIRED_FIELD',
    vietnamese: 'Vui lòng điền đầy đủ thông tin bắt buộc.',
    context: 'Required field missing'
  },
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    vietnamese: 'Địa chỉ email không hợp lệ.',
    context: 'Invalid email format'
  },
  INVALID_PHONE: {
    code: 'INVALID_PHONE',
    vietnamese: 'Số điện thoại không hợp lệ.',
    context: 'Invalid phone format'
  },
  INVALID_DATE: {
    code: 'INVALID_DATE',
    vietnamese: 'Ngày tháng không hợp lệ.',
    context: 'Invalid date format'
  },
  INVALID_NUMBER: {
    code: 'INVALID_NUMBER',
    vietnamese: 'Số liệu không hợp lệ.',
    context: 'Invalid number format'
  },

  // File Operations
  UPLOAD_FAILED: {
    code: 'UPLOAD_FAILED',
    vietnamese: 'Không thể tải lên tệp. Vui lòng thử lại.',
    context: 'File upload failed'
  },
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    vietnamese: 'Tệp quá lớn. Vui lòng chọn tệp nhỏ hơn.',
    context: 'File size exceeds limit'
  },
  INVALID_FILE_TYPE: {
    code: 'INVALID_FILE_TYPE',
    vietnamese: 'Loại tệp không được hỗ trợ.',
    context: 'Unsupported file type'
  },

  // Business Logic Errors
  INSUFFICIENT_STOCK: {
    code: 'INSUFFICIENT_STOCK',
    vietnamese: 'Không đủ hàng trong kho.',
    context: 'Stock quantity insufficient'
  },
  DUPLICATE_ENTRY: {
    code: 'DUPLICATE_ENTRY',
    vietnamese: 'Dữ liệu đã tồn tại trong hệ thống.',
    context: 'Duplicate record'
  },
  OPERATION_NOT_ALLOWED: {
    code: 'OPERATION_NOT_ALLOWED',
    vietnamese: 'Thao tác không được phép trong trạng thái hiện tại.',
    context: 'Operation not permitted'
  },

  // System Errors
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    vietnamese: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
    context: 'Unknown system error'
  },
  MAINTENANCE_MODE: {
    code: 'MAINTENANCE_MODE',
    vietnamese: 'Hệ thống đang bảo trì. Vui lòng thử lại sau.',
    context: 'System under maintenance'
  }
}

// Common English error patterns to Vietnamese mapping
export const ENGLISH_TO_VIETNAMESE_PATTERNS: Array<{
  pattern: RegExp
  vietnamese: string
  context?: string
}> = [
  {
    pattern: /failed to fetch/i,
    vietnamese: 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.',
    context: 'Network fetch failed'
  },
  {
    pattern: /network error/i,
    vietnamese: 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.',
    context: 'Network connection error'
  },
  {
    pattern: /timeout/i,
    vietnamese: 'Kết nối quá chậm. Vui lòng thử lại.',
    context: 'Request timeout'
  },
  {
    pattern: /unauthorized/i,
    vietnamese: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    context: 'Authentication required'
  },
  {
    pattern: /forbidden/i,
    vietnamese: 'Bạn không có quyền thực hiện thao tác này.',
    context: 'Access forbidden'
  },
  {
    pattern: /not found/i,
    vietnamese: 'Không tìm thấy dữ liệu yêu cầu.',
    context: 'Resource not found'
  },
  {
    pattern: /bad request/i,
    vietnamese: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra thông tin và thử lại.',
    context: 'Invalid request'
  },
  {
    pattern: /internal server error/i,
    vietnamese: 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
    context: 'Server error'
  },
  {
    pattern: /validation error|validation failed/i,
    vietnamese: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra và nhập lại.',
    context: 'Validation error'
  },
  {
    pattern: /duplicate/i,
    vietnamese: 'Dữ liệu đã tồn tại trong hệ thống.',
    context: 'Duplicate data'
  },
  {
    pattern: /connection refused|connection failed/i,
    vietnamese: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
    context: 'Connection failed'
  }
]

// Default fallback message
export const DEFAULT_ERROR_MESSAGE: ErrorMessage = {
  code: 'UNKNOWN_ERROR',
  vietnamese: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
  context: 'Unknown error'
}
