import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Thermometer,
  Droplets,
  CloudRain,
  Sprout,
  Sun,
  AlertCircle,
} from 'lucide-react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Switch } from '@/shared/ui/switch'
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
  const [manualControl, setManualControl] = useState(false)
  const [pumpControl, setPumpControl] = useState(false)
  const [servoAngle, setServoAngle] = useState([90])
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
      setIsOnline(true)
      setRetryCount(0)
    } catch (error) {
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

  // Đảm bảo máy bơm luôn bật khi ở chế độ tự động
  useEffect(() => {
    if (!manualControl && !pumpControl) {
      setPumpControl(true)
      handlePumpControl(true, { showSuccessToast: false })
    }
  }, [manualControl])


  const handlePumpControl = async (
    newState: boolean,
    options?: {
      showSuccessToast?: boolean
    }
  ) => {
    const showSuccessToast = options?.showSuccessToast ?? true

    try {
      const result = await blynkService.controlPump(newState)
      if (result.success) {
        setPumpControl(newState)
        if (showSuccessToast) {
          toast({
            title: newState ? 'Máy bơm đã bật' : 'Máy bơm đã tắt',
            description: result.message || `Trạng thái máy bơm: ${newState ? 'Hoạt động' : 'Tắt'}`,
          })
        }
      } else {
        toast({
          title: 'Lỗi điều khiển',
          description: result.message || 'Không thể điều khiển máy bơm',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Lỗi kết nối',
        description: 'Không thể gửi lệnh điều khiển',
        variant: 'destructive',
      })
    }
  }

  const handleManualControl = async (newState: boolean) => {
    try {
      const result = await blynkService.controlManualMode(newState)
      if (result.success) {
        setManualControl(newState)

        // Khi tắt chế độ thủ công, tự động bật máy bơm
        if (!newState) {
          setPumpControl(true) // Cập nhật state ngay lập tức
          await handlePumpControl(true)
        }

        toast({
          title: newState ? 'Chế độ thủ công đã bật' : 'Chế độ tự động đã bật',
          description:
            result.message ||
            `Hệ thống đã chuyển sang chế độ ${newState ? 'thủ công' : 'tự động'}`,
        })
      } else {
        toast({
          title: 'Lỗi điều khiển',
          description: result.message || 'Không thể thay đổi chế độ điều khiển',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Lỗi kết nối',
        description: 'Không thể gửi lệnh điều khiển',
        variant: 'destructive',
      })
    }
  }

  const handleServoControl = async (angle: number[]) => {
    try {
      const result = await blynkService.controlServo(angle[0])
      if (result.success) {
        setServoAngle(angle)
        toast({
          title: 'Mái che đã điều chỉnh',
          description: result.message || `Góc mái che: ${angle[0]}°`,
        })
      } else {
        toast({
          title: 'Lỗi điều khiển',
          description: result.message || 'Không thể điều chỉnh mái che',
          variant: 'destructive',
        })
      }
    } catch (error) {
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
        { }
        <div className="mb-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển IoT thời gian thực</h1>
            </div>
            <p className="text-gray-600">
              Giám sát cảm biến thời gian thực và điều khiển thiết bị IoT
            </p>
          </div>

          { }
          <div className="flex items-center gap-2">
            {timeFilters.map(filter => (
              <Button
                key={filter}
                variant={timeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter(filter)}
                className={`${timeFilter === filter
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        { }
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

        { }
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          { }
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold">Điều Khiển Tay</h3>
                <Switch
                  checked={manualControl}
                  onCheckedChange={handleManualControl}
                  disabled={!isOnline || isLoading}
                />
              </div>
              <p className="text-gray-600 text-sm">
                {manualControl ? 'Chế độ thủ công đang bật' : 'Chế độ tự động đang hoạt động'}
              </p>
            </CardContent>
          </Card>

          { }
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold">Điều Khiển Máy Bơm</h3>
                <Switch
                  checked={!manualControl ? true : pumpControl}
                  onCheckedChange={handlePumpControl}
                  disabled={!isOnline || isLoading || !manualControl}
                />
              </div>
              <p className="text-gray-600 text-sm">
                {(!manualControl || pumpControl) ? 'Máy bơm đang hoạt động' : 'Máy bơm đang tắt'}
              </p>
              {!manualControl && (
                <p className="text-gray-500 text-xs mt-2 italic">
                  Ở chế độ tự động, máy bơm luôn được bật
                </p>
              )}
            </CardContent>
          </Card>

          { }
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-900 font-semibold">Mái che</h3>
                  <span className="text-blue-600 text-xl font-bold">{servoAngle[0]}°</span>
                </div>
                <div
                  className={`${!isOnline || isLoading || !manualControl ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Slider
                    value={servoAngle}
                    onValueChange={manualControl && isOnline && !isLoading ? handleServoControl : () => { }}
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
              {!manualControl && (
                <p className="text-gray-500 text-xs mt-2 italic">
                  Vui lòng bật chế độ thủ công để điều chỉnh mái che
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        { }
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
