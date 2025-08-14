import { z } from 'zod'

// Form schemas for Admin Role Management
export const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must be less than 50 characters')
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      'Role name must be uppercase with underscores only (e.g., CUSTOM_ROLE)'
    ),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(200, 'Description must be less than 200 characters'),
  permissions: z.array(z.string()).min(1, 'At least one permission must be selected'),
})

export const bulkRoleActionSchema = z.object({
  type: z.enum(['delete']),
  roleIds: z.array(z.string()).min(1, 'At least one role must be selected'),
})

// Type exports
export type RoleFormData = z.infer<typeof roleFormSchema>
export type BulkRoleAction = z.infer<typeof bulkRoleActionSchema>

// Validation helpers
export const validateRoleForm = (data: unknown) => roleFormSchema.safeParse(data)
export const validateBulkRoleAction = (data: unknown) => bulkRoleActionSchema.safeParse(data)

// Default form values
export const defaultRoleFormValues: RoleFormData = {
  name: '',
  description: '',
  permissions: [],
}

// Permission categories for grouping in UI
export interface PermissionCategory {
  id: string
  name: string
  description: string
  permissionIds: string[]
}

export const permissionCategories: PermissionCategory[] = [
  {
    id: 'user-management',
    name: 'User Management',
    description: 'User accounts, roles, and access control',
    permissionIds: ['perm-1', 'perm-2'],
  },
  {
    id: 'system-admin',
    name: 'System Administration',
    description: 'System configuration and settings',
    permissionIds: ['perm-3'],
  },
  {
    id: 'farm-operations',
    name: 'Farm Operations',
    description: 'Day-to-day farm management activities',
    permissionIds: ['perm-4', 'perm-9', 'perm-10'],
  },
  {
    id: 'inventory-management',
    name: 'Inventory & Products',
    description: 'Product catalog and inventory control',
    permissionIds: ['perm-5'],
  },
  {
    id: 'field-operations',
    name: 'Field Operations',
    description: 'Field work, quality checks, and logging',
    permissionIds: ['perm-7', 'perm-8'],
  },
  {
    id: 'reporting',
    name: 'Reports & Analytics',
    description: 'Access to system reports and analytics',
    permissionIds: ['perm-6'],
  },
]

// Action types for permission display
export const actionLabels: Record<string, string> = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
}

// Action colors for UI
export const actionColors: Record<string, string> = {
  create: 'text-green-600',
  read: 'text-blue-600',
  update: 'text-yellow-600',
  delete: 'text-red-600',
}

// Built-in system roles that cannot be deleted
export const SYSTEM_ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'VIEWER', 'OPERATOR']

// Permission matrix interface for the permissions UI
export interface PermissionMatrix {
  [permissionId: string]: {
    granted: boolean
    actions: string[]
  }
}
