import React from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useAdminUsersStore } from '../store/adminUsersStore'
import { statusOptions, availableRoles } from '../model/schemas'

interface UserControlsPanelProps {
    onCreateUser?: () => void
}

export const UserControlsPanel: React.FC<UserControlsPanelProps> = ({ onCreateUser }) => {
    const {
        searchState,
        roleFilter,
        statusFilter,
        setSearch,
        setRoleFilter,
        setStatusFilter,
    } = useAdminUsersStore()

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm theo tên, email hoặc vai trò..."
                            value={searchState.query}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Select value={roleFilter || '__all__'} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Lọc theo vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Tất cả</SelectItem>
                            {availableRoles.map(role => (
                                <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter || '__all__'} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Tất cả</SelectItem>
                            {statusOptions.map(status => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {onCreateUser && (
                        <Button onClick={onCreateUser} className="whitespace-nowrap">
                            Tạo
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

