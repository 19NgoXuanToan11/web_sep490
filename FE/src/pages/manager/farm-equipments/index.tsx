import React, { useEffect, useState, useCallback } from 'react'
import { MoreHorizontal, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { farmEquipmentService } from '@/shared/api/farmEquipmentService'
import type { FarmEquipment } from '@/shared/api/farmEquipmentService'
import { Badge } from '@/shared/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { iotDeviceService } from '@/shared/api/iotDeviceService'
import { farmService } from '@/shared/api/farmService'
import { showErrorToast, toastManager } from '@/shared/lib/toast-manager'
import { ManagementPageHeader, StaffFilterBar, StaffDataTable, type StaffDataTableColumn } from '@/shared/ui'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog'

const ActionMenu: React.FC<{
    item: FarmEquipment
    onViewDetails: (item: FarmEquipment) => void
    onEdit: (item: FarmEquipment) => void
}> = React.memo(({ item, onViewDetails, onEdit }) => {
    const [open, setOpen] = useState(false)

    const handleViewDetails = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        setTimeout(() => {
            onViewDetails(item)
        }, 0)
    }, [item, onViewDetails])

    const handleEdit = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        setTimeout(() => {
            onEdit(item)
        }, 0)
    }, [item, onEdit])

    return (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" sideOffset={5} onCloseAutoFocus={(e) => e.preventDefault()}>
                <DropdownMenuItem onClick={handleViewDetails} className="cursor-pointer focus:bg-gray-100" onSelect={(e) => e.preventDefault()}>
                    Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit} className="cursor-pointer focus:bg-gray-100" onSelect={(e) => e.preventDefault()}>
                    Chỉnh sửa
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
})

ActionMenu.displayName = 'ActionMenu'

export interface FarmEquipmentRequest {
    deviceId: number
    FarmId: number
    Note?: string | null
}

export default function ManagerFarmEquipmentsPage() {
    const [items, setItems] = useState<FarmEquipment[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [createOpen, setCreateOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [selected, setSelected] = useState<FarmEquipment | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [statistics, setStatistics] = useState({ total: 0, active: 0, inactive: 0 })

    const loadAll = async () => {
        setLoading(true)
        try {
            const data = await farmEquipmentService.getAll()
            setItems(data)
            computeStats(data)
        } catch (err) {
            showErrorToast(err)
        } finally {
            setLoading(false)
        }
    }

    const computeStats = (list: FarmEquipment[]) => {
        const total = list.length
        const active = list.filter(i => String(i.status).toUpperCase() === 'ACTIVE').length
        setStatistics({ total, active, inactive: Math.max(0, total - active) })
    }

    const getStatusBadge = (status: number | string | undefined) => {
        if (status === undefined) {
            return <Badge variant="outline">Không xác định</Badge>
        }
        const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : String(status)
        if (normalizedStatus === 'ACTIVE' || normalizedStatus === '1') {
            return <Badge variant="success">Hoạt động</Badge>
        }
        if (normalizedStatus === 'DEACTIVATED' || normalizedStatus === '0') {
            return <Badge variant="destructive">Vô hiệu hóa</Badge>
        }
        return <Badge variant="outline">Không xác định</Badge>
    }

    useEffect(() => {
        loadAll()
    }, [])

    const [statusFilter, setStatusFilter] = useState<string>('all')

    const isActiveStatus = (status: number | string | undefined): boolean => {
        if (status === undefined) return false
        const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : String(status)
        return normalizedStatus === 'ACTIVE' || normalizedStatus === '1'
    }

    useEffect(() => {
        const loadDevices = async () => {
            try {
                await iotDeviceService.getAllDevices(1, 1000)
            } catch (err) {
            }
        }
        loadDevices()
    }, [])

    const filteredItems = items.filter(item => {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
            (item.deviceName || '').toLowerCase().includes(q) ||
            (item.farmName || '').toLowerCase().includes(q)

        const matchesStatus =
            statusFilter === 'all' ? true : (statusFilter === '1' ? isActiveStatus(item.status) : !isActiveStatus(item.status))

        return matchesSearch && matchesStatus
    })

    const handleCreate = async (payload: { deviceId: number; FarmId: number; Note?: string | null }) => {
        try {
            await farmEquipmentService.createFarmEquipment(payload)
            setCreateOpen(false)
            toastManager.success('Tạo thiết bị nông trại thành công')
            loadAll()
        } catch (err) {
            showErrorToast(err)
        }
    }

    const handleUpdate = async (id: number, payload: { deviceId: number; FarmId: number; Note?: string | null }) => {
        try {
            await farmEquipmentService.updateFarmEquipment(id, payload)
            setEditOpen(false)
            setSelected(null)
            toastManager.success('Cập nhật thành công')
            loadAll()
        } catch (err) {
            showErrorToast(err)
        }
    }



    const columns: StaffDataTableColumn<FarmEquipment>[] = [
        {
            id: 'deviceName',
            header: 'Thiết bị',
            render: (item) => <div className="font-medium">{item.deviceName ?? '-'}</div>,
        },
        {
            id: 'farmName',
            header: 'Nông trại',
            render: (item) => item.farmName ?? '-',
        },
        {
            id: 'status',
            header: 'Trạng thái',
            render: (item) => getStatusBadge(item.status),
        },
        {
            id: 'actions',
            header: '',
            render: (item) => <ActionMenu item={item} onViewDetails={(it) => { setSelected(it); setDetailOpen(true) }} onEdit={(it) => { setSelected(it); setEditOpen(true) }} />,
        },
    ]

    return (
        <ManagerLayout>
            <div className="p-6 space-y-8">
                <ManagementPageHeader
                    title="Thiết bị nông trại"
                    description="Quản lý toàn bộ thiết bị nông trại"
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={loadAll} disabled={loading} className="flex items-center gap-2">
                                Làm mới
                            </Button>
                        </div>
                    }
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-gray-500">Tổng thiết bị</p>
                            <p className="text-2xl font-semibold mt-1">{statistics.total}</p>
                            <p className="text-xs text-gray-500 mt-2">Tổng số thiết bị nông trại trong hệ thống</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-gray-500">Đang hoạt động</p>
                            <p className="text-2xl font-semibold mt-1 text-green-600">{statistics.active}</p>
                            <p className="text-xs text-gray-500 mt-2">Thiết bị đang ở trạng thái ACTIVE</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-gray-500">Vô hiệu hóa</p>
                            <p className="text-2xl font-semibold mt-1 text-red-600">{statistics.inactive}</p>
                            <p className="text-xs text-gray-500 mt-2">Thiết bị đã bị vô hiệu hóa</p>
                        </CardContent>
                    </Card>
                </div>

                <StaffFilterBar>
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm thiết bị..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="1">Hoạt động</SelectItem>
                                <SelectItem value="0">Vô hiệu hóa</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={() => setCreateOpen(true)}>Tạo</Button>
                    </div>
                </StaffFilterBar>

                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                            </div>
                        ) : (
                            <StaffDataTable<FarmEquipment>
                                className="px-4 sm:px-6 pb-6"
                                data={filteredItems}
                                getRowKey={(item, idx) => String(item.farmEquipmentId ?? idx)}
                                currentPage={1}
                                pageSize={items.length || 10}
                                totalPages={1}
                                columns={columns}
                            />
                        )}
                    </CardContent>
                </Card>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tạo Thiết bị nông trại</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                            <CreateForm onCreate={handleCreate} onCancel={() => setCreateOpen(false)} />
                        </DialogDescription>
                    </DialogContent>
                </Dialog>

                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa thiết bị nông trại</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                            <EditForm initial={selected} onUpdate={handleUpdate} onCancel={() => { setEditOpen(false); setSelected(null) }} />
                        </DialogDescription>
                    </DialogContent>
                </Dialog>
                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Chi tiết thiết bị</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                            {selected ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Thiết bị</p>
                                            <p className="text-base font-medium">{selected.deviceName ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Nông trại</p>
                                            <p className="text-base font-medium">{selected.farmName ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Ngày gán</p>
                                            <p className="text-base font-medium">{selected.assignDate ? new Date(selected.assignDate).toLocaleDateString('vi-VN') : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Ghi chú</p>
                                            <p className="text-base font-medium">{selected.note ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Trạng thái</p>
                                            <div className="mt-1">{getStatusBadge(selected.status)}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>Không có dữ liệu</div>
                            )}
                        </DialogDescription>
                        <div className="mt-4 flex justify-end">
                            <Button variant="ghost" onClick={() => { setDetailOpen(false); setSelected(null) }}>Đóng</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </ManagerLayout>
    )
}

function CreateForm({ onCreate, onCancel }: { onCreate: (p: { deviceId: number; FarmId: number; Note?: string | null }) => void; onCancel: () => void }) {
    const [deviceId, setDeviceId] = useState<number | ''>('')
    const [farmId, setFarmId] = useState<number | ''>('')
    const [note, setNote] = useState<string>('')
    const [devices, setDevices] = useState<any[]>([])
    const [farms, setFarms] = useState<any[]>([])

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const resp = await iotDeviceService.getAllDevices(1, 1000)
                const list = resp.items || []
                if (mounted) setDevices(list)
            } catch (err) { }
            try {
                const farmsList = await farmService.getAllFarms()
                if (mounted) setFarms(farmsList)
            } catch (err) { }
        }
        load()
        return () => { mounted = false }
    }, [])

    const submit = () => {
        if (!deviceId || !farmId) return
        onCreate({ deviceId: Number(deviceId), FarmId: Number(farmId), Note: note || undefined })
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm text-gray-700">Thiết bị</label>
                <Select value={String(deviceId)} onValueChange={(v) => setDeviceId(v ? Number(v) : '')}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn thiết bị" />
                    </SelectTrigger>
                    <SelectContent>
                        {devices.map(d => (
                            <SelectItem key={String(d.devicesId ?? d.ioTdevicesId)} value={String(d.devicesId ?? d.ioTdevicesId)}>
                                {d.deviceName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="block text-sm text-gray-700">Nông trại</label>
                <Select value={String(farmId)} onValueChange={(v) => setFarmId(v ? Number(v) : '')}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn nông trại" />
                    </SelectTrigger>
                    <SelectContent>
                        {farms.map(f => (
                            <SelectItem key={String(f.farmId)} value={String(f.farmId)}>
                                {f.farmName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="block text-sm text-gray-700">Ghi chú</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>Hủy</Button>
                <Button onClick={submit}>Tạo</Button>
            </div>
        </div>
    )
}

function EditForm({ initial, onUpdate, onCancel }: { initial: FarmEquipment | null; onUpdate: (id: number, p: { deviceId: number; FarmId: number; Note?: string | null }) => void; onCancel: () => void }) {
    const [deviceId, setDeviceId] = useState<number | ''>('')
    const [farmId, setFarmId] = useState<number | ''>('')
    const [note, setNote] = useState<string>('')
    const [devices, setDevices] = useState<any[]>([])
    const [farms, setFarms] = useState<any[]>([])

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const resp = await iotDeviceService.getAllDevices(1, 1000)
                const list = resp.items || []
                if (mounted) setDevices(list)
            } catch (err) { }
            try {
                const farmsList = await farmService.getAllFarms()
                if (mounted) setFarms(farmsList)
            } catch (err) { }
        }
        load()
        return () => { mounted = false }
    }, [])

    useEffect(() => {
        if (!initial) return
        setNote(initial.note || '')
    }, [initial])

    useEffect(() => {
        if (!initial) return
        if (devices.length > 0) {
            const found = devices.find(d => (d.deviceName || '').toString() === (initial.deviceName || '').toString())
            if (found) setDeviceId(found.devicesId ?? found.ioTdevicesId ?? '')
        }
        if (farms.length > 0) {
            const foundF = farms.find(f => (f.farmName || '').toString() === (initial.farmName || '').toString())
            if (foundF) setFarmId(foundF.farmId ?? '')
        }
    }, [initial, devices, farms])

    const submit = () => {
        if (!initial || !initial.farmEquipmentId) return
        if (!deviceId || !farmId) return
        onUpdate(Number(initial.farmEquipmentId), { deviceId: Number(deviceId), FarmId: Number(farmId), Note: note || undefined })
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm text-gray-700">Thiết bị</label>
                <Select value={String(deviceId)} onValueChange={(v) => setDeviceId(v ? Number(v) : '')}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn thiết bị" />
                    </SelectTrigger>
                    <SelectContent>
                        {devices.map(d => (
                            <SelectItem key={String(d.devicesId ?? d.ioTdevicesId)} value={String(d.devicesId ?? d.ioTdevicesId)}>
                                {d.deviceName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="block text-sm text-gray-700">Nông trại</label>
                <Select value={String(farmId)} onValueChange={(v) => setFarmId(v ? Number(v) : '')}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn nông trại" />
                    </SelectTrigger>
                    <SelectContent>
                        {farms.map(f => (
                            <SelectItem key={String(f.farmId)} value={String(f.farmId)}>
                                {f.farmName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="block text-sm text-gray-700">Ghi chú</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>Hủy</Button>
                <Button onClick={submit}>Cập nhật</Button>
            </div>
        </div>
    )
}


