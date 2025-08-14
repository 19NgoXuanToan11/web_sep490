import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, UserPlus, Edit } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Checkbox } from '@/shared/ui/checkbox'
import { useToast } from '@/shared/ui/use-toast'
import { useAdminUsersStore } from '../store/adminUsersStore'
import {
  userFormSchema,
  availableRoles,
  statusOptions,
  defaultUserFormValues,
} from '../model/schemas'
import type { UserFormData } from '../model/schemas'
import type { User } from '@/shared/lib/localData'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  user?: User | null // For editing - null for creating
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, user }) => {
  const { createUser, updateUser, loadingStates } = useAdminUsersStore()
  const { toast } = useToast()

  const isEditing = Boolean(user)
  const loadingKey = isEditing ? `update-user-${user?.id}` : 'create-user'
  const isLoading = loadingStates[loadingKey]?.isLoading

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: defaultUserFormValues,
    mode: 'onChange',
  })

  const watchedRoles = watch('roles', [])

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          roles: user.roles,
          status: user.status,
        })
      } else {
        reset(defaultUserFormValues)
      }
    }
  }, [isOpen, user, reset])

  const handleClose = () => {
    reset(defaultUserFormValues)
    onClose()
  }

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing && user) {
        await updateUser(user.id, data)
        toast({
          title: 'User updated successfully',
          description: `${data.name} has been updated.`,
        })
      } else {
        await createUser(data)
        toast({
          title: 'User created successfully',
          description: `${data.name} has been added to the system.`,
        })
      }
      handleClose()
    } catch (error) {
      // Error handling is done in the store with loading states
      // The error will be displayed via the loading state error
    }
  }

  const handleRoleToggle = (roleValue: string) => {
    const currentRoles = watchedRoles
    const newRoles = currentRoles.includes(roleValue)
      ? currentRoles.filter(r => r !== roleValue)
      : [...currentRoles, roleValue]

    setValue('roles', newRoles, { shouldValidate: true })
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <Edit className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {isEditing ? 'Edit User' : 'Create New User'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Display */}
          {loadingStates[loadingKey]?.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {loadingStates[loadingKey]?.error}
            </motion.div>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              {...register('name')}
              error={!!errors.name}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@farm.com"
              {...register('email')}
              error={!!errors.email}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          {/* Status Field */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              onValueChange={value =>
                setValue('status', value as 'Active' | 'Inactive', { shouldValidate: true })
              }
              defaultValue="Active"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && <p className="text-sm text-red-600">{errors.status.message}</p>}
          </div>

          {/* Roles Field */}
          <div className="space-y-3">
            <Label>User Roles * (Select at least one)</Label>
            <div className="space-y-3">
              {availableRoles.map(role => (
                <div
                  key={role.value}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    id={role.value}
                    checked={watchedRoles.includes(role.value)}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={role.value} className="cursor-pointer font-medium">
                      {role.label}
                      {role.value === 'ADMIN' && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          High Access
                        </Badge>
                      )}
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {errors.roles && <p className="text-sm text-red-600">{errors.roles.message}</p>}

            {/* Selected Roles Summary */}
            {watchedRoles.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">Selected Roles:</p>
                <div className="flex flex-wrap gap-2">
                  {watchedRoles.map(roleValue => {
                    const role = availableRoles.find(r => r.value === roleValue)
                    return (
                      <Badge
                        key={roleValue}
                        variant={roleValue === 'ADMIN' ? 'destructive' : 'default'}
                      >
                        {role?.label || roleValue}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isLoading} className="min-w-[100px]">
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update User' : 'Create User'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
