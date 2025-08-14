import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Shield, Save, ShieldPlus, Edit, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Textarea } from '@/shared/ui/textarea'
import { Badge } from '@/shared/ui/badge'
import { useToast } from '@/shared/ui/use-toast'
import { useAdminRolesStore } from '../store/adminRolesStore'
import { PermissionsMatrix } from './PermissionsMatrix'
import { roleFormSchema, defaultRoleFormValues, SYSTEM_ROLES } from '../model/schemas'
import type { RoleFormData } from '../model/schemas'
import type { Role } from '@/shared/lib/localData'

interface RoleFormModalProps {
  isOpen: boolean
  onClose: () => void
  role?: Role | null // For editing - null for creating
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({ isOpen, onClose, role }) => {
  const { createRole, updateRole, loadingStates } = useAdminRolesStore()
  const { toast } = useToast()

  const isEditing = Boolean(role)
  const isSystemRole = role && SYSTEM_ROLES.includes(role.name)
  const loadingKey = isEditing ? `update-role-${role?.id}` : 'create-role'
  const isLoading = loadingStates[loadingKey]?.isLoading

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: defaultRoleFormValues,
    mode: 'onChange',
  })

  const watchedPermissions = watch('permissions', [])

  // Reset form when modal opens/closes or role changes
  useEffect(() => {
    if (isOpen) {
      if (role) {
        reset({
          name: role.name,
          description: role.description,
          permissions: role.permissions,
        })
      } else {
        reset(defaultRoleFormValues)
      }
    }
  }, [isOpen, role, reset])

  const handleClose = () => {
    reset(defaultRoleFormValues)
    onClose()
  }

  const onSubmit = async (data: RoleFormData) => {
    try {
      if (isEditing && role) {
        await updateRole(role.id, data)
        toast({
          title: 'Role updated successfully',
          description: `${data.name} role has been updated.`,
        })
      } else {
        await createRole(data)
        toast({
          title: 'Role created successfully',
          description: `${data.name} role has been added to the system.`,
        })
      }
      handleClose()
    } catch (error) {
      // Error handling is done in the store with loading states
    }
  }

  const handlePermissionChange = (permissionId: string, granted: boolean) => {
    const currentPermissions = watchedPermissions
    const newPermissions = granted
      ? [...currentPermissions, permissionId]
      : currentPermissions.filter(p => p !== permissionId)

    setValue('permissions', newPermissions, { shouldValidate: true })
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <Edit className="h-5 w-5" /> : <ShieldPlus className="h-5 w-5" />}
            {isEditing ? `Edit Role: ${role?.name}` : 'Create New Role'}
            {isSystemRole && (
              <Badge variant="outline" className="ml-2">
                System Role
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modify role details and permissions. System roles have limited editing options.'
              : 'Create a new custom role with specific permissions for your organization.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Display */}
          {loadingStates[loadingKey]?.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {loadingStates[loadingKey]?.error}
            </motion.div>
          )}

          {/* System Role Warning */}
          {isSystemRole && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2"
            >
              <Shield className="h-4 w-4 flex-shrink-0" />
              This is a system role. Only the description and permissions can be modified.
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  placeholder="CUSTOM_ROLE_NAME"
                  {...register('name')}
                  disabled={isSystemRole}
                  error={!!errors.name}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                <p className="text-xs text-gray-500">
                  Use uppercase letters and underscores only (e.g., CUSTOM_ROLE)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role and its intended use..."
                  rows={4}
                  {...register('description')}
                  error={!!errors.description}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Permissions Summary */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium text-sm mb-2">Permissions Summary</h4>
                <div className="text-sm text-gray-600">
                  <p>Selected: {watchedPermissions.length} permissions</p>
                  {watchedPermissions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {watchedPermissions.slice(0, 3).map(permId => (
                        <Badge key={permId} variant="secondary" className="text-xs">
                          Permission {permId.split('-')[1]}
                        </Badge>
                      ))}
                      {watchedPermissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{watchedPermissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {errors.permissions && (
                  <p className="text-sm text-red-600 mt-2">{errors.permissions.message}</p>
                )}
              </div>
            </div>

            {/* Right Column - Permissions Matrix */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Role Permissions *</Label>
                <p className="text-sm text-gray-500 mb-4">
                  Select the permissions this role should have. You can select entire categories or
                  individual permissions.
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                <PermissionsMatrix
                  selectedPermissions={watchedPermissions}
                  onPermissionChange={handlePermissionChange}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isLoading} className="min-w-[120px]">
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Role' : 'Create Role'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
