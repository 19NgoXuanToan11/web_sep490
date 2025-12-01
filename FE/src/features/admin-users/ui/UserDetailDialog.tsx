import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog'
import { Badge } from '@/shared/ui/badge'
import type { User } from '@/shared/lib/localData'
import { availableRoles, statusOptions, genderOptions } from '../model/schemas'
import { Mail, Phone, MapPin } from 'lucide-react'

interface UserDetailDialogProps {
    user: User | null
    isOpen: boolean
    onClose: () => void
}

const formatDateValue = (value?: string | null) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date)
}

const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div className="flex flex-col gap-1 rounded-lg border border-gray-100 p-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value || '—'}</span>
    </div>
)

const getInitials = (text?: string) => {
    if (!text) return 'U'
    const [first = '', second = ''] = text.split(' ')
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase()
}

export const UserDetailDialog: React.FC<UserDetailDialogProps> = ({ user, isOpen, onClose }) => {
    const roleLabel = user
        ? availableRoles.find(role => role.value === user.roles[0])?.label || user.roles[0]
        : ''

    const statusLabel = user
        ? statusOptions.find(status => status.value === user.status)?.label || user.status
        : ''

    const statusVariant = user
        ? statusOptions.find(status => status.value === user.status)?.variant || 'default'
        : 'default'

    const profile = user?.profile
    const genderLabel = profile?.gender
        ? genderOptions.find(gender => gender.value === profile.gender)?.label || profile.gender
        : null

    const createdDate = profile?.createdAt || user?.createdAt
    const updatedDate = profile?.updatedAt || user?.updatedAt

    return (
        <Dialog open={isOpen} onOpenChange={opened => !opened && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Xem chi tiết người dùng</DialogTitle>
                    <DialogDescription>Thông tin hồ sơ và hoạt động gần đây</DialogDescription>
                </DialogHeader>

                {user && (
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            {profile?.images ? (
                                <img
                                    src={profile.images}
                                    alt={profile.fullname || user.name}
                                    className="h-16 w-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white">
                                    {getInitials(profile?.fullname || user.name)}
                                </div>
                            )}

                            <div className="flex flex-1 flex-col gap-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xl font-semibold text-gray-900">
                                            {profile?.fullname || user.name}
                                        </p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                        <Badge>{roleLabel}</Badge>
                                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <InfoRow
                                label="Email"
                                value={
                                    <span className="inline-flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        {user.email}
                                    </span>
                                }
                            />
                            <InfoRow
                                label="Số điện thoại"
                                value={
                                    profile?.phone ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            {profile.phone}
                                        </span>
                                    ) : (
                                        '—'
                                    )
                                }
                            />
                            <InfoRow label="Giới tính" value={genderLabel || '—'} />
                            <InfoRow
                                label="Địa chỉ"
                                value={
                                    profile?.address ? (
                                        <span className="inline-flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            {profile.address}
                                        </span>
                                    ) : (
                                        '—'
                                    )
                                }
                            />
                        </div>

                        <div className="rounded-xl border bg-gray-50 p-4">
                            <p className="mb-3 text-sm font-semibold text-gray-700">Hoạt động hệ thống</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoRow label="Ngày tạo" value={formatDateValue(createdDate)} />
                                <InfoRow label="Cập nhật gần nhất" value={formatDateValue(updatedDate)} />
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

