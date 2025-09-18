import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useToast } from '@/shared/ui/use-toast'
import { z } from 'zod'
import type { User } from '@/shared/lib/localData'
import { accountApi } from '@/shared/api/auth'

const passwordUpdateSchema = z
  .object({
    oldPassword: z.string().min(6, 'Mật khẩu cũ phải có ít nhất 6 ký tự'),
    newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type PasswordUpdateData = z.infer<typeof passwordUpdateSchema>

interface PasswordUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

export const PasswordUpdateModal: React.FC<PasswordUpdateModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<PasswordUpdateData>({
    resolver: zodResolver(passwordUpdateSchema),
    mode: 'onChange',
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: PasswordUpdateData) => {
    if (!user) return

    setIsLoading(true)
    try {
      await accountApi.updatePassword(Number(user.id), {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })

      toast({
        title: 'Cập nhật mật khẩu thành công',
        description: `Mật khẩu cho ${user.email} đã được cập nhật.`,
      })
      handleClose()
    } catch (error) {
      toast({
        title: 'Lỗi cập nhật mật khẩu',
        description:
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật mật khẩu.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Cập nhật mật khẩu
          </DialogTitle>
        </DialogHeader>

        {user && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Cập nhật mật khẩu cho: <strong>{user.email}</strong>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Old Password */}
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Mật khẩu cũ *</Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOldPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu cũ"
                {...register('oldPassword')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.oldPassword && (
              <p className="text-sm text-red-600">{errors.oldPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới"
                {...register('newPassword')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu mới"
                {...register('confirmPassword')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Form Actions */}
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
                'Cập nhật'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
