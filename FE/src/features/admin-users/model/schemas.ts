import { z } from 'zod'
import type { UserRole, UserStatus } from '@/shared/lib/localData'

export const userFormSchema = z.object({
  name: z.string().min(1, 'Họ và tên là bắt buộc').min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Vui lòng nhập địa chỉ email hợp lệ'),
  role: z.enum(['CUSTOMER', 'MANAGER', 'STAFF'], {
    required_error: 'Phải chọn một vai trò',
    invalid_type_error: 'Vai trò không hợp lệ',
  }),
  status: z.enum(['Active', 'Inactive']),
  gender: z.enum(['Male', 'Female', 'Other'], {
    required_error: 'Phải chọn giới tính',
    invalid_type_error: 'Giới tính không hợp lệ',
  }),
  phone: z
    .string()
    .min(1, 'Số điện thoại là bắt buộc')
    .regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
  address: z.string().min(1, 'Địa chỉ là bắt buộc').min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
  images: z.string().optional(),
})

export const bulkUserActionSchema = z.object({
  type: z.enum(['activate', 'deactivate', 'assign-role']),
  userIds: z.array(z.string()).min(1, 'Phải chọn ít nhất một người dùng'),
  role: z.enum(['CUSTOMER', 'MANAGER', 'STAFF']).optional(),
})

export type UserFormData = z.infer<typeof userFormSchema>
export type BulkUserAction = z.infer<typeof bulkUserActionSchema>

export const validateUserForm = (data: unknown) => userFormSchema.safeParse(data)
export const validateBulkAction = (data: unknown) => bulkUserActionSchema.safeParse(data)

export const defaultUserFormValues: UserFormData = {
  name: '',
  email: '',
  role: 'STAFF',
  status: 'Active',
  gender: 'Male',
  phone: '',
  address: '',
  images: '',
}

export const availableRoles: { value: UserRole; label: string; description: string }[] = [
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
  {
    value: 'CUSTOMER',
    label: 'Khách hàng',
    description: 'Quyền truy cập khách hàng với các đặc quyền cơ bản',
  },
]

export const statusOptions: {
  value: UserStatus
  label: string
  variant: 'default' | 'secondary'
}[] = [
  { value: 'Active', label: 'Hoạt động', variant: 'default' },
  { value: 'Inactive', label: 'Ngưng hoạt động', variant: 'secondary' },
]

export const genderOptions: {
  value: 'Male' | 'Female' | 'Other'
  label: string
}[] = [
  { value: 'Male', label: 'Nam' },
  { value: 'Female', label: 'Nữ' },
  { value: 'Other', label: 'Khác' },
]
