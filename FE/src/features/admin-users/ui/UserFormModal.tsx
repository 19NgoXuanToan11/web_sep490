import React, { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Upload, X, Loader2 } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useAdminUsersStore } from '../store/adminUsersStore'
import { showErrorToast } from '@/shared/lib/toast-manager'
import { withBackendToast } from '@/shared/lib/backend-toast'
import {
  userFormSchema,
  availableRoles,
  statusOptions,
  genderOptions,
  defaultUserFormValues,
} from '../model/schemas'
import type { UserFormData } from '../model/schemas'
import type { User } from '@/shared/lib/localData'
import { uploadImageToCloudinary, CloudinaryUploadError } from '@/shared/lib/cloudinary'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  user?: User | null
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, user }) => {
  const { createUser, updateUser, loadingStates } = useAdminUsersStore()

  const isEditing = Boolean(user)
  const loadingKey = isEditing ? `update-user-${user?.id}` : 'create-user'
  const isLoading = loadingStates[loadingKey]?.isLoading

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: defaultUserFormValues,
    mode: 'onChange',
  })

  const watchedRole = watch('role')
  const watchedGender = watch('gender')
  const watchedStatus = watch('status')
  const watchedImages = watch('images')

  useEffect(() => {
    if (isOpen) {
      if (user) {
        const profile = user.profile
        const userImageUrl = profile?.images || ''
        reset({
          name: profile?.fullname || user.name,
          email: user.email,
          role: user.roles[0] || 'STAFF',
          status: user.status,
          gender: profile?.gender || 'Male',
          phone: profile?.phone || '',
          address: profile?.address || '',
          images: userImageUrl,
        })
        setImagePreview(userImageUrl || null)
        trigger()
      } else {
        reset(defaultUserFormValues)
        setImagePreview(null)
        trigger()
      }
      setUploadProgress(0)
      setIsUploading(false)
    }
  }, [isOpen, user, reset])

  useEffect(() => {
    if (watchedImages && watchedImages.startsWith('http')) {
      setImagePreview(watchedImages)
    } else if (!watchedImages) {
      setImagePreview(null)
    }
  }, [watchedImages])

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    reset(defaultUserFormValues)
    setImagePreview(null)
    setUploadProgress(0)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result as string
      setImagePreview(result)
    }
    reader.readAsDataURL(file)

    setIsUploading(true)
    setUploadProgress(0)

    abortControllerRef.current = new AbortController()

    try {
      const cloudinaryUrl = await uploadImageToCloudinary({
        file,
        folder: 'sep490/users',
        onProgress: setUploadProgress,
        signal: abortControllerRef.current.signal,
      })

      setValue('images', cloudinaryUrl, { shouldValidate: true })
      setImagePreview(cloudinaryUrl)
    } catch (error) {
      if (error instanceof CloudinaryUploadError) {
        if (error.message.includes('aborted')) {
          return
        }
        showErrorToast(error)
      } else {
        showErrorToast(error)
      }
      setImagePreview(null)
      setValue('images', '', { shouldValidate: true })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      abortControllerRef.current = null
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setImagePreview(null)
    setValue('images', '', { shouldValidate: true })
    setUploadProgress(0)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing && user) {
        if (!user.id) {
          throw new Error('User ID is missing')
        }

        await withBackendToast(
          () => updateUser(user.id, data),
          {
            onSuccess: () => handleClose(),
          }
        )
      } else {
        await withBackendToast(
          () => createUser(data),
          {
            onSuccess: () => handleClose(),
          }
        )
      }
    } catch (error: unknown) {
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? 'Chỉnh sửa người dùng' : 'Tạo người dùng mới'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {loadingStates[loadingKey]?.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {loadingStates[loadingKey]?.error}
            </motion.div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Họ và tên *</Label>
            <Input id="name" placeholder="Nhập họ và tên" {...register('name')} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="gender">Giới tính *</Label>
            <Select
              onValueChange={value =>
                setValue('gender', value as 'Male' | 'Female' | 'Other', {
                  shouldValidate: true,
                })
              }
              defaultValue={watchedGender}
              value={watchedGender}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map(gender => (
                  <SelectItem key={gender.value} value={gender.value}>
                    {gender.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0123456789"
              {...register('phone')}
            />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ *</Label>
            <Input
              id="address"
              placeholder="Nhập địa chỉ"
              {...register('address')}
            />
            {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Hình ảnh</Label>
            <div className="space-y-3">
              {imagePreview && (
                <div className="relative inline-block">
                  <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                          <p className="text-xs">{uploadProgress}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {!isUploading && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="images"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading || isLoading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isLoading}
                  className="flex items-center gap-2"
                >
                  {isUploading ? (
                  <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải lên... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {imagePreview ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                    </>
                  )}
                </Button>
              </div>
              {errors.images && <p className="text-sm text-red-600">{errors.images.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái *</Label>
            <Select
              onValueChange={value =>
                setValue('status', value as 'Active' | 'Inactive', { shouldValidate: true })
              }
              value={watchedStatus}
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
                {availableRoles
                  .filter(role => {
                    if (isEditing && user) {
                      const currentUserRole = user.roles[0] || 'STAFF'
                      return role.value !== currentUserRole
                    }
                    return true
                  })
                  .map(role => (
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
                  {isEditing ? 'Cập nhật' : 'Tạo'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
