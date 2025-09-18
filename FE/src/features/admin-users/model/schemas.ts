import { z } from 'zod'
import type { UserRole, UserStatus } from '@/shared/lib/localData'

// Form schemas for Admin User Management
export const userFormSchema = z.object({
  name: z.string().min(1, 'Họ và tên là bắt buộc').min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Vui lòng nhập địa chỉ email hợp lệ'),
  role: z.enum(['CUSTOMER', 'MANAGER', 'STAFF'], {
    required_error: 'Phải chọn một vai trò',
    invalid_type_error: 'Vai trò không hợp lệ',
  }),
  status: z.enum(['Active', 'Inactive']),
})

export const bulkUserActionSchema = z.object({
  type: z.enum(['activate', 'deactivate', 'assign-role', 'delete']),
  userIds: z.array(z.string()).min(1, 'Phải chọn ít nhất một người dùng'),
  role: z.enum(['CUSTOMER', 'MANAGER', 'STAFF']).optional(),
})

// Type exports
export type UserFormData = z.infer<typeof userFormSchema>
export type BulkUserAction = z.infer<typeof bulkUserActionSchema>

// Validation helpers
export const validateUserForm = (data: unknown) => userFormSchema.safeParse(data)
export const validateBulkAction = (data: unknown) => bulkUserActionSchema.safeParse(data)

// Default form values
export const defaultUserFormValues: UserFormData = {
  name: '',
  email: '',
  role: 'STAFF', // Default role
  status: 'Active',
}

// Available roles list with descriptions (matching backend Roles enum)
export const availableRoles: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'CUSTOMER',
    label: 'Khách hàng',
    description: 'Quyền truy cập khách hàng với các đặc quyền cơ bản',
  },
  {
    value: 'MANAGER',
    label: 'Quản lý nông trại',
    description: 'Kiểm soát hoạt động các tính năng quản lý nông trại',
  },
  {
    value: 'STAFF',
    label: 'Nhân viên đồng ruộng',
    description: 'Quyền truy cập hạn chế cho hoạt động đồng ruộng và quản lý nhiệm vụ',
  },
]

// Status options
export const statusOptions: {
  value: UserStatus
  label: string
  variant: 'default' | 'secondary'
}[] = [
  { value: 'Active', label: 'Hoạt động', variant: 'default' },
  { value: 'Inactive', label: 'Ngưng hoạt động', variant: 'secondary' },
]
