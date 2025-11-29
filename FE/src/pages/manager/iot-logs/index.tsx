import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { blynkService, type BlynkLogEntry } from '@/shared/api/blynkService'
import { useToast } from '@/shared/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { RefreshCw, History, Database, Activity, Clock } from 'lucide-react'

type TimeFilter = '24h' | '7d' | '30d' | 'all'

const timeFilterOptions: { label: string; value: TimeFilter }[] = [
    { label: '24 giờ', value: '24h' },
    { label: '7 ngày', value: '7d' },
    { label: '30 ngày', value: '30d' },
    { label: 'Tất cả', value: 'all' },
]

const getDateThreshold = (filter: TimeFilter) => {
    const now = new Date()
    switch (filter) {
        case '24h':
            return new Date(now.getTime() - 24 * 60 * 60 * 1000)
        case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        default:
            return null
    }
}

const formatSensorValue = (value: number) => {
    if (Number.isNaN(value)) return '--'
    if (Math.abs(value) >= 1000) {
        return `${value.toFixed(0)}`
    }
    return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)
}

const ManagerIoTLogsPage: React.FC = () => {
    const { toast } = useToast()
    const [logs, setLogs] = useState<BlynkLogEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [sensorFilter, setSensorFilter] = useState<string>('all')
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h')
    const [searchQuery, setSearchQuery] = useState('')

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true)
            const data = await blynkService.getLogs()
            setLogs(data)
        } catch (error) {
            toast({
                title: 'Không thể tải nhật ký',
                description: 'Vui lòng thử lại sau hoặc kiểm tra kết nối.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const handleManualSync = async () => {
        try {
            setSyncing(true)
            const result = await blynkService.triggerLogsUpdate()
            toast({
                title: result.success ? 'Đồng bộ thành công' : 'Đồng bộ thất bại',
                description:
                    result.message ||
                    (result.success ? 'Dữ liệu đã được cập nhật.' : 'Không thể đồng bộ dữ liệu.'),
                variant: result.success ? 'default' : 'destructive',
            })

            if (result.success) {
                await fetchLogs()
            }
        } catch (error) {
            toast({
                title: 'Đồng bộ thất bại',
                description: 'Không thể gửi yêu cầu đồng bộ đến máy chủ.',
                variant: 'destructive',
            })
        } finally {
            setSyncing(false)
        }
    }

    const sensors = useMemo(() => {
        const unique = new Set(logs.map(log => log.sensorName))
        return Array.from(unique)
    }, [logs])

    const filteredLogs = useMemo(() => {
        const threshold = getDateThreshold(timeFilter)
        return logs
            .filter(log => (sensorFilter === 'all' ? true : log.sensorName === sensorFilter))
            .filter(log => {
                if (!threshold) return true
                return new Date(log.timestamp) >= threshold
            })
            .filter(log => {
                if (!searchQuery) return true
                const text = `${log.sensorName} ${log.variableId} ${log.devicesId}`
                return text.toLowerCase().includes(searchQuery.toLowerCase())
            })
            .sort(
                (a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
    }, [logs, sensorFilter, timeFilter, searchQuery])

    const latestTimestamp = useMemo(() => {
        if (logs.length === 0) return null
        const sorted = [...logs].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        return sorted[0]?.timestamp ?? null
    }, [logs])

    const aggregateBySensor = useMemo(() => {
        const map = new Map<
            string,
            { count: number; lastValue: number; lastTimestamp: string | null }
        >()

        filteredLogs.forEach(log => {
            const current = map.get(log.sensorName) || { count: 0, lastValue: 0, lastTimestamp: null }
            if (!current.lastTimestamp || new Date(log.timestamp) > new Date(current.lastTimestamp)) {
                current.lastValue = log.value
                current.lastTimestamp = log.timestamp
            }
            current.count += 1
            map.set(log.sensorName, current)
        })

        return Array.from(map.entries()).map(([sensorName, stats]) => ({
            sensorName,
            ...stats,
        }))
    }, [filteredLogs])

    return (
        <ManagerLayout>
            <div className="p-6 space-y-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Nhật ký hệ thống IoT</h1>
                        <p className="text-gray-600 mt-2">
                            Theo dõi lịch sử đo đạc và đồng bộ trạng thái từ nền tảng Blynk
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" onClick={fetchLogs} disabled={loading || syncing}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Làm mới
                        </Button>
                        <Button onClick={handleManualSync} disabled={syncing}>
                            <History className="h-4 w-4 mr-2" />
                            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                Tổng số bản ghi
                            </CardTitle>
                            <Database className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold">{filteredLogs.length}</div>
                            <p className="text-xs text-gray-500 mt-1">Sau khi áp dụng bộ lọc hiện tại</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                Cảm biến theo dõi
                            </CardTitle>
                            <Activity className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold">{sensors.length}</div>
                            <p className="text-xs text-gray-500 mt-1">Nguồn dữ liệu khác nhau</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                Lần đồng bộ gần nhất
                            </CardTitle>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-semibold text-gray-900">
                                {latestTimestamp ? new Date(latestTimestamp).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Ghi nhận mới nhất trong hệ thống</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                Trạng thái tác vụ
                            </CardTitle>
                            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin text-green-600' : 'text-gray-400'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-semibold text-gray-900">
                                {syncing ? 'Đang đồng bộ...' : loading ? 'Đang tải dữ liệu...' : 'Sẵn sàng'}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Nút đồng bộ có thể kích hoạt bất cứ lúc nào</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Bộ lọc & tìm kiếm</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-600">Cảm biến</label>
                            <Select value={sensorFilter} onValueChange={setSensorFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn cảm biến" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    {sensors.map(sensor => (
                                        <SelectItem key={sensor} value={sensor}>
                                            {sensor}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-600">Khoảng thời gian</label>
                            <Select value={timeFilter} onValueChange={value => setTimeFilter(value as TimeFilter)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn khoảng thời gian" />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeFilterOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm text-gray-600">Từ khóa</label>
                            <Input
                                placeholder="Tìm theo tên cảm biến, mã thiết bị..."
                                value={searchQuery}
                                onChange={event => setSearchQuery(event.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Nhật ký cảm biến</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cảm biến</TableHead>
                                    <TableHead>Thiết bị</TableHead>
                                    <TableHead>Giá trị</TableHead>
                                    <TableHead>Thời gian</TableHead>
                                    <TableHead>Virtual Pin</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-gray-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Đang tải dữ liệu nhật ký...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-gray-500">
                                            Không có bản ghi phù hợp với bộ lọc hiện tại.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map(log => (
                                        <TableRow key={`${log.variableId}-${log.timestamp}`}>
                                            <TableCell className="font-semibold">{log.sensorName}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>ID: {log.devicesId}</span>
                                                    <span className="text-xs text-gray-500">Thiết bị #{log.devicesId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-base">
                                                    {formatSensorValue(Number(log.value))}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(log.timestamp).toLocaleString('vi-VN', {
                                                    hour12: false,
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600 uppercase">{log.variableId}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {aggregateBySensor.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Tổng hợp giá trị gần nhất</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {aggregateBySensor.map(sensor => (
                                <div
                                    key={sensor.sensorName}
                                    className="border rounded-lg p-4 flex flex-col gap-2 bg-gray-50"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900">{sensor.sensorName}</h3>
                                        <Badge variant="outline">{sensor.count} bản ghi</Badge>
                                    </div>
                                    <div className="text-3xl font-bold text-green-700">
                                        {formatSensorValue(sensor.lastValue)}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Cập nhật lúc{' '}
                                        {sensor.lastTimestamp
                                            ? new Date(sensor.lastTimestamp).toLocaleString('vi-VN')
                                            : '--'}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </ManagerLayout>
    )
}

export default ManagerIoTLogsPage

