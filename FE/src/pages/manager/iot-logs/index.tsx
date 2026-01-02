import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { blynkService, type BlynkLogEntry } from '@/shared/api/blynkService'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { RefreshCw, Download, Search } from 'lucide-react'
import { StaffFilterBar, StaffDataTable, type StaffDataTableColumn, ManagementPageHeader } from '@/shared/ui'
import { showErrorToast } from '@/shared/lib/toast-manager'

const formatSensorValue = (value: number) => {
    if (Number.isNaN(value)) return '--'
    if (Math.abs(value) >= 1000) {
        return `${value.toFixed(0)}`
    }
    return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)
}

const translateSensorName = (sensorName: string): string => {
    const sensorNameMap: Record<string, string> = {
        'Soil Moisture Sensor': 'Cảm biến độ ẩm đất',
        'Light Sensor': 'Cảm biến ánh sáng',
        'Temperature Sensor': 'Cảm biến nhiệt độ',
        'Humidity Sensor': 'Cảm biến độ ẩm',
    }
    return sensorNameMap[sensorName] || sensorName
}

const ManagerIoTLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<BlynkLogEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [sensorFilter, setSensorFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    const PAGE_SIZE = 25

    const syncLatestBlynkData = useCallback(async () => {
        try {
            await blynkService.getBlynkData()
        } catch (error) {
            console.error('Không thể đồng bộ dữ liệu Blynk nền', error)
        }
    }, [])

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true)
            await syncLatestBlynkData()
            const data = await blynkService.getLogs()
            setLogs(data)
        } catch (error) {
            showErrorToast(error)
        } finally {
            setLoading(false)
        }
    }, [syncLatestBlynkData])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    useEffect(() => {
        const interval = setInterval(() => {
            syncLatestBlynkData()
        }, 60_000)

        return () => clearInterval(interval)
    }, [syncLatestBlynkData])

    const sensors = useMemo(() => {
        const unique = new Set(logs.map(log => log.sensorName))
        return Array.from(unique)
    }, [logs])

    const filteredLogs = useMemo(() => {
        return logs
            .filter(log => (sensorFilter === 'all' ? true : log.sensorName === sensorFilter))
            .filter(log => {
                if (!searchQuery) return true
                const text = `${log.sensorName} ${log.variableId} ${log.devicesId}`
                return text.toLowerCase().includes(searchQuery.toLowerCase())
            })
            .sort(
                (a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
    }, [logs, sensorFilter, searchQuery])

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
    }, [filteredLogs.length])

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE
        const endIndex = startIndex + PAGE_SIZE
        return filteredLogs.slice(startIndex, endIndex)
    }, [filteredLogs, currentPage])

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1)
        }
    }, [totalPages, currentPage])

    useEffect(() => {
        setCurrentPage(1)
    }, [sensorFilter, searchQuery])

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

    const handleRefresh = useCallback(async () => {
        await fetchLogs()
    }, [fetchLogs])

    const handleExportToCSV = async () => {
        try {
            const blob = await blynkService.exportLogs()

            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)

            link.setAttribute('href', url)
            link.setAttribute('download', `IFMS_iot_logs.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            showErrorToast(error)
        }
    }

    return (
        <ManagerLayout>
            <div className="p-6 space-y-8">
                <ManagementPageHeader
                    title="Nhật ký hệ thống IoT"
                    description="Theo dõi lịch sử đo đạc và đồng bộ trạng thái."
                    actions={
                        <Button onClick={handleRefresh} variant="outline">
                            Làm mới
                        </Button>
                    }
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                Tổng số bản ghi
                            </CardTitle>
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
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-semibold text-gray-900">
                                {loading ? 'Đang tải dữ liệu...' : 'Sẵn sàng'}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Hệ thống sẵn sàng xử lý dữ liệu
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {aggregateBySensor.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Tổng hợp giá trị gần nhất</CardTitle>
                                {filteredLogs.length > 0 && (
                                    <Button variant="outline" onClick={handleExportToCSV} className="gap-2">
                                        <Download className="h-4 w-4" />
                                        Xuất CSV
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {aggregateBySensor.map(sensor => (
                                <div
                                    key={sensor.sensorName}
                                    className="border rounded-lg p-4 flex flex-col gap-2 bg-gray-50"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900">{translateSensorName(sensor.sensorName)}</h3>
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

                <StaffFilterBar>
                    <div className="w-full sm:w-64">
                        <Select value={sensorFilter} onValueChange={setSensorFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn cảm biến" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {sensors.map(sensor => (
                                    <SelectItem key={sensor} value={sensor}>
                                        {translateSensorName(sensor)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm theo tên cảm biến, mã thiết bị..."
                                value={searchQuery}
                                onChange={event => setSearchQuery(event.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </StaffFilterBar>

                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                                <span className="ml-2 text-gray-600">Đang tải dữ liệu nhật ký...</span>
                            </div>
                        ) : (
                            <StaffDataTable<BlynkLogEntry>
                                className="px-4 sm:px-6 pb-6"
                                data={paginatedLogs}
                                getRowKey={(log, index) => `${log.iotLogId || log.variableId}-${log.timestamp}-${index}`}
                                currentPage={currentPage}
                                pageSize={PAGE_SIZE}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                emptyTitle="Không có bản ghi"
                                emptyDescription="Không có bản ghi phù hợp với bộ lọc hiện tại"
                                columns={[
                                    {
                                        id: 'sensor',
                                        header: 'Cảm biến',
                                        render: (log) => (
                                            <div className="font-semibold">{translateSensorName(log.sensorName)}</div>
                                        ),
                                    },
                                    {
                                        id: 'value',
                                        header: 'Giá trị',
                                        render: (log) => (
                                            <Badge variant="secondary" className="text-base">
                                                {formatSensorValue(Number(log.value))}
                                            </Badge>
                                        ),
                                    },
                                    {
                                        id: 'timestamp',
                                        header: 'Thời gian',
                                        render: (log) =>
                                            new Date(log.timestamp).toLocaleString('vi-VN', {
                                                hour12: false,
                                            }),
                                    },
                                ] satisfies StaffDataTableColumn<BlynkLogEntry>[]}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </ManagerLayout>
    )
}

export default ManagerIoTLogsPage

