import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useToast } from '@/shared/ui/use-toast'
import { profileApi, accountApi } from '@/shared/api/auth'

const ProfilePage: React.FC = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPass, setChangingPass] = useState(false)

  const [profile, setProfile] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    gender: '',
    email: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
  })

  useEffect(() => {
    ;(async () => {
      try {
        const p = await profileApi.getProfile()
        setProfile({
          fullName: p.fullName || '',
          phoneNumber: p.phoneNumber || '',
          address: p.address || '',
          gender: p.gender || '',
          email: p.email,
        })
      } catch (e: any) {
        toast({
          title: 'Lỗi tải hồ sơ',
          description: e?.message || 'Vui lòng thử lại',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [toast])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await profileApi.updateProfile({
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        gender: profile.gender,
      })
      toast({ title: 'Cập nhật hồ sơ thành công' })
    } catch (e: any) {
      toast({
        title: 'Cập nhật thất bại',
        description: e?.message || 'Vui lòng thử lại',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordForm.newPassword) return
    setChangingPass(true)
    try {
      await accountApi.updatePassword({
        email: profile.email,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ oldPassword: '', newPassword: '' })
      toast({ title: 'Đổi mật khẩu thành công' })
    } catch (e: any) {
      toast({
        title: 'Đổi mật khẩu thất bại',
        description: e?.message || 'Vui lòng thử lại',
        variant: 'destructive',
      })
    } finally {
      setChangingPass(false)
    }
  }

  if (loading) return null

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSave} className="space-y-4">
              <div>
                <Label>Họ và tên</Label>
                <Input
                  value={profile.fullName}
                  onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  value={profile.phoneNumber}
                  onChange={e => setProfile({ ...profile, phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Địa chỉ</Label>
                <Input
                  value={profile.address}
                  onChange={e => setProfile({ ...profile, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Giới tính</Label>
                <Input
                  value={profile.gender}
                  onChange={e => setProfile({ ...profile, gender: e.target.value })}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đổi mật khẩu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onChangePassword} className="space-y-4">
              <div>
                <Label>Mật khẩu hiện tại</Label>
                <Input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                />
              </div>
              <div>
                <Label>Mật khẩu mới</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={changingPass}>
                  {changingPass ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage
