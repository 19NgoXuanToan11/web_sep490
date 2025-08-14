import { z } from 'zod'
import type { UserRole, UserStatus } from '@/shared/lib/localData'

// Form schemas for Admin User Management
export const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  roles: z
    .array(z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER', 'OPERATOR']))
    .min(1, 'At least one role is required'),
  status: z.enum(['Active', 'Inactive']),
})

export const bulkUserActionSchema = z.object({
  type: z.enum(['activate', 'deactivate', 'assign-role', 'delete']),
  userIds: z.array(z.string()).min(1, 'At least one user must be selected'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER', 'OPERATOR']).optional(),
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
  roles: [],
  status: 'Active',
}

// Available roles list with descriptions
export const availableRoles: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'ADMIN',
    label: 'Administrator',
    description: 'Full system access with administrative privileges',
  },
  {
    value: 'MANAGER',
    label: 'Farm Manager',
    description: 'Operational control over farm management features',
  },
  {
    value: 'STAFF',
    label: 'Field Staff',
    description: 'Limited access for field operations and quality checks',
  },
  {
    value: 'VIEWER',
    label: 'Viewer',
    description: 'Read-only access to reports and system status',
  },
  {
    value: 'OPERATOR',
    label: 'Device Operator',
    description: 'Control access for irrigation devices and schedules',
  },
]

// Status options
export const statusOptions: {
  value: UserStatus
  label: string
  variant: 'default' | 'secondary'
}[] = [
  { value: 'Active', label: 'Active', variant: 'default' },
  { value: 'Inactive', label: 'Inactive', variant: 'secondary' },
]
