import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Thermometer,
  Droplets,
  CloudRain,
  Sprout,
  Sun,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Switch } from '@/shared/ui/switch'
import { Badge } from '@/shared/ui/badge'
import { Slider } from '@/shared/ui/slider'
import { blynkService, type SensorData } from '@/shared/api/blynkService'
import Gauge from '@/components/iot-dashboard/Gauge'
import { useToast } from '@/shared/ui/use-toast'

const RealTimeIoTDashboard: React.FC = () => {
  const { toast } = useToast()
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidity: 0,
    rainLevel: 0,
    soilMoisture: 0,
    light: 0,
    servoAngle: 90,
    pumpState: false,
    dataQuality: 'good',
    lastUpdated: new Date(),
    connectionStrength: 100,
  })

  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [manualControl, setManualControl] = useState(false)
  const [pumpControl, setPumpControl] = useState(false)
  const [servoAngle, setServoAngle] = useState([90])
  const [dataQuality, setDataQuality] = useState<'good' | 'poor' | 'error'>('good')
  const [connectionStrength, setConnectionStrength] = useState(100)
  const [timeFilter, setTimeFilter] = useState('Trực tiếp')
  const [retryCount, setRetryCount] = useState(0)

  const REFRESH_INTERVAL = 5000

  const fetchSensorData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await blynkService.getBlynkData()
      setSensorData(data)
      setPumpControl(data.pumpState)
      setServoAngle([data.servoAngle])
      setDataQuality(data.dataQuality)
      setConnectionStrength(data.connectionStrength)
      setLastUpdated(data.lastUpdated)
      setIsOnline(true)
      setRetryCount(0)
    } catch (error) {
      console.error('Failed to fetch sensor data:', error)
      setIsOnline(false)
      setRetryCount(prev => prev + 1)

      if (retryCount < 3) {

        toast({
          title: 'Mất kết nối',
          description: 'Đang thử kết nối lại với thiết bị IoT...',
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast, retryCount])

  useEffect(() => {
    fetchSensorData()

    const interval = setInterval(() => {
      if (!manualControl) {
        fetchSensorData()
      }
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchSensorData, manualControl])

  const handleManualRefresh = () => {
    fetchSensorData()
    toast({
      title: 'Đã làm mới',
      description: 'Dữ liệu cảm biến đã được cập nhật',
    })
  }

  const handlePumpControl = async (newState: boolean) => {
    try {
      const success = await blynkService.sendControlCommand('v7', newState ? '1' : '0')
      if (success) {
        setPumpControl(newState)
        toast({
          title: newState ? 'Máy bơm đã bật' : 'Máy bơm đã tắt',
          description: `Trạng thái máy bơm: ${newState ? 'Hoạt động' : 'Tắt'}`,
        })
      } else {
        toast({
          title: 'Lỗi điều khiển',
          description: 'Không thể điều khiển máy bơm',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to control pump:', error)
      toast({
        title: 'Lỗi kết nối',
        description: 'Không thể gửi lệnh điều khiển',
        variant: 'destructive',
      })
    }
  }

  const handleServoControl = async (angle: number[]) => {
    try {
      const success = await blynkService.sendControlCommand('v6', angle[0].toString())
      if (success) {
        setServoAngle(angle)
        toast({
          title: 'Servo đã điều chỉnh',
          description: `Góc servo: ${angle[0]}°`,
        })
      } else {
        toast({
          title: 'Lỗi điều khiển',
          description: 'Không thể điều chỉnh servo',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to control servo:', error)
      toast({
        title: 'Lỗi kết nối',
        description: 'Không thể gửi lệnh điều khiển',
        variant: 'destructive',
      })
    }
  }

  const timeFilters = ['Trực tiếp', '1 giờ', '6 giờ', '1 ngày', '1 tuần', '1 tháng']

  return (
    <ManagerLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bảng điều khiển IoT thời gian thực</h1>
            <p className="text-gray-600 mb-6">
              Giám sát cảm biến thời gian thực và điều khiển thiết bị IoT
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-600" />
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Trực tuyến
                      </Badge>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-600" />
                      <Badge className="bg-red-100 text-red-800 border-red-200">Ngoại tuyến</Badge>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500">Tổ chức của tôi - 8289XO</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          dataQuality === 'good'
                            ? 'bg-green-500'
                            : dataQuality === 'poor'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                      <span className="text-xs text-gray-600">
                        Chất lượng:{' '}
                        {dataQuality === 'good'
                          ? 'Tốt'
                          : dataQuality === 'poor'
                            ? 'Trung bình'
                            : 'Lỗi'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs text-gray-600">Tín hiệu: {connectionStrength}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleManualRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </div>
            </div>
          </div>

          {}
          <div className="flex items-center gap-2">
            {timeFilters.map(filter => (
              <Button
                key={filter}
                variant={timeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter(filter)}
                className={`${
                  timeFilter === filter
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
          <Gauge
            value={sensorData.temperature}
            max={50}
            unit="°C"
            label="Nhiệt độ"
            icon={<Thermometer />}
            isLoading={isLoading}
            dataQuality={sensorData.dataQuality}
            lastUpdated={sensorData.lastUpdated}
            trend={
              sensorData.temperature > 25 ? 'up' : sensorData.temperature < 20 ? 'down' : 'stable'
            }
          />

          <Gauge
            value={sensorData.humidity}
            max={100}
            unit="%"
            label="Độ ẩm"
            icon={<Droplets />}
            isLoading={isLoading}
            dataQuality={sensorData.dataQuality}
            lastUpdated={sensorData.lastUpdated}
            trend={sensorData.humidity > 70 ? 'up' : sensorData.humidity < 40 ? 'down' : 'stable'}
          />

          <Gauge
            value={sensorData.rainLevel}
            max={100}
            unit="%"
            label="Lượng mưa"
            icon={<CloudRain />}
            isLoading={isLoading}
            dataQuality={sensorData.dataQuality}
            lastUpdated={sensorData.lastUpdated}
            trend={sensorData.rainLevel > 50 ? 'up' : sensorData.rainLevel < 10 ? 'down' : 'stable'}
          />

          <Gauge
            value={sensorData.soilMoisture}
            max={100}
            unit="%"
            label="Độ ẩm đất"
            icon={<Sprout />}
            isLoading={isLoading}
            dataQuality={sensorData.dataQuality}
            lastUpdated={sensorData.lastUpdated}
            trend={
              sensorData.soilMoisture > 60 ? 'up' : sensorData.soilMoisture < 30 ? 'down' : 'stable'
            }
          />

          <Gauge
            value={sensorData.light}
            max={1100}
            unit="lux"
            label="Ánh sáng"
            icon={<Sun />}
            isLoading={isLoading}
            dataQuality={sensorData.dataQuality}
            lastUpdated={sensorData.lastUpdated}
            trend={sensorData.light > 800 ? 'up' : sensorData.light < 200 ? 'down' : 'stable'}
          />
        </div>

        {}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold">Điều Khiển Tay</h3>
                <Switch checked={manualControl} onCheckedChange={setManualControl} />
              </div>
              <p className="text-gray-600 text-sm">
                {manualControl ? 'Chế độ thủ công đang bật' : 'Chế độ tự động đang hoạt động'}
              </p>
            </CardContent>
          </Card>

          {}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold">Điều Khiển Máy Bơm</h3>
                <Switch
                  checked={pumpControl}
                  onCheckedChange={handlePumpControl}
                  disabled={!isOnline || isLoading}
                />
              </div>
              <p className="text-gray-600 text-sm">
                {pumpControl ? 'Máy bơm đang hoạt động' : 'Máy bơm đang tắt'}
              </p>
            </CardContent>
          </Card>

          {}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-900 font-semibold">Servo</h3>
                  <span className="text-blue-600 text-xl font-bold">{servoAngle[0]}°</span>
                </div>
                <div
                  className={`${!isOnline || isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Slider
                    value={servoAngle}
                    onValueChange={handleServoControl}
                    max={180}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0°</span>
                <span>180°</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isOnline ? (
                    <Wifi className="h-5 w-5 text-green-600" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">Kết nối</h4>
                    <p className="text-sm text-gray-600">
                      {isOnline ? 'Trực tuyến' : `Ngoại tuyến (Lần thử: ${retryCount})`}
                    </p>
                  </div>
                </div>
                <Badge
                  className={isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                >
                  {connectionStrength}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full ${
                      dataQuality === 'good'
                        ? 'bg-green-500'
                        : dataQuality === 'poor'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">Chất lượng dữ liệu</h4>
                    <p className="text-sm text-gray-600">
                      {dataQuality === 'good'
                        ? 'Tốt'
                        : dataQuality === 'poor'
                          ? 'Trung bình'
                          : 'Lỗi'}
                    </p>
                  </div>
                </div>
                <Badge
                  className={`${
                    dataQuality === 'good'
                      ? 'bg-green-100 text-green-800'
                      : dataQuality === 'poor'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {dataQuality === 'good' ? '✓' : dataQuality === 'poor' ? '!' : '✗'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Cập nhật cuối</h4>
                    <p className="text-sm text-gray-600">
                      {lastUpdated ? lastUpdated.toLocaleTimeString('vi-VN') : 'Chưa có'}
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {lastUpdated
                    ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000) + 's'
                    : '--'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div className="text-red-800">
                    <p className="font-medium">Mất kết nối với thiết bị IoT</p>
                    <p className="text-sm text-red-600">
                      Hệ thống đang tự động thử kết nối lại mỗi {REFRESH_INTERVAL / 1000} giây
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </ManagerLayout>
  )
}

export default RealTimeIoTDashboard
