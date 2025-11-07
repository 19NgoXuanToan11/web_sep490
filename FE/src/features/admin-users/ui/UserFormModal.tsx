import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Save, UserPlus, Edit } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
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
  user?: User | null
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

  const watchedRole = watch('role')

  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          role: user.roles[0] || 'STAFF',
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
        if (!user.id) {
          throw new Error('User ID is missing')
        }

        await updateUser(user.id, data)
        toast({
          title: 'Cập nhật người dùng thành công',
          description: `${data.name} đã được cập nhật.`,
        })
      } else {
        await createUser(data)
        toast({
          title: 'Tạo người dùng thành công',
          description: `${data.name} đã được thêm vào hệ thống.`,
        })
      }
      handleClose()
    } catch (error) {
          }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <Edit className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {isEditing ? 'Chỉnh sửa người dùng' : 'Tạo người dùng mới'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {}
          {loadingStates[loadingKey]?.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {loadingStates[loadingKey]?.error}
            </motion.div>
          )}

          {}
          <div className="space-y-2">
            <Label htmlFor="name">Họ và tên *</Label>
            <Input id="name" placeholder="Nhập họ và tên" {...register('name')} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          {}
          <div className="space-y-2">
            <Label htmlFor="email">Địa chỉ email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="nguoidung@nongtrai.com"
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          {}
          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái *</Label>
            <Select
              onValueChange={value =>
                setValue('status', value as 'Active' | 'Inactive', { shouldValidate: true })
              }
              defaultValue="Active"
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
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

          {}
          <div className="space-y-2">
            <Label htmlFor="role">Vai trò người dùng *</Label>
            <Select
              onValueChange={value =>
                setValue('role', value as 'CUSTOMER' | 'MANAGER' | 'STAFF', {
                  shouldValidate: true,
                })
              }
              defaultValue={watchedRole}
              value={watchedRole}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span>{role.label}</span>
                        {role.value === 'MANAGER' && (
                          <Badge variant="destructive" className="text-xs">
                            Quyền cao
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
          </div>

          {}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Hủy
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
                  {isEditing ? 'Cập nhật người dùng' : 'Tạo người dùng'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
