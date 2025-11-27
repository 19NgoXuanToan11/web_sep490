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
import { Input } from '@/shared/ui/input'
import { blynkService, type SensorData } from '@/shared/api/blynkService'
import Gauge from '@/components/iot-dashboard/Gauge'
import { useToast } from '@/shared/ui/use-toast'
import { Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog'

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
  const [lightControl, setLightControl] = useState(false)
  const [servoAngle, setServoAngle] = useState([90])
  const [retryCount, setRetryCount] = useState(0)

  // Threshold configuration state
  const [soilLowThreshold, setSoilLowThreshold] = useState<number>(30)
  const [soilHighThreshold, setSoilHighThreshold] = useState<number>(70)
  const [ldrLowThreshold, setLdrLowThreshold] = useState<number>(200)
  const [ldrHighThreshold, setLdrHighThreshold] = useState<number>(800)
  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState<string | null>(null)
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false)

  // Validation errors state
  const [soilValidationError, setSoilValidationError] = useState<string | null>(null)
  const [ldrValidationError, setLdrValidationError] = useState<string | null>(null)

  const REFRESH_INTERVAL = 5000

  // Validation functions
  const validateSoilThresholds = (low: number, high: number): string | null => {
    if (high <= low) {
      return 'Ngưỡng cao phải lớn hơn ngưỡng thấp'
    }
    return null
  }

  const validateLdrThresholds = (low: number, high: number): string | null => {
    if (high <= low) {
      return 'Ngưỡng cao phải lớn hơn ngưỡng thấp'
    }
    return null
  }

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

  // Validate thresholds when modal opens
  useEffect(() => {
    if (isThresholdModalOpen) {
      const soilError = validateSoilThresholds(soilLowThreshold, soilHighThreshold)
      const ldrError = validateLdrThresholds(ldrLowThreshold, ldrHighThreshold)
      setSoilValidationError(soilError)
      setLdrValidationError(ldrError)
    } else {
      // Clear validation errors when modal closes
      setSoilValidationError(null)
      setLdrValidationError(null)
    }
  }, [isThresholdModalOpen, soilLowThreshold, soilHighThreshold, ldrLowThreshold, ldrHighThreshold])

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

  const handleLightControl = async (newState: boolean) => {
    try {
      // Placeholder for future backend API integration
      // const result = await blynkService.controlLight(newState)
      // if (result.success) {
      setLightControl(newState)
      toast({
        title: newState ? 'Đèn đã bật' : 'Đèn đã tắt',
        description: `Trạng thái đèn: ${newState ? 'Hoạt động' : 'Tắt'}`,
      })
      // } else {
      //   toast({
      //     title: 'Lỗi điều khiển',
      //     description: result.message || 'Không thể điều khiển đèn',
      //     variant: 'destructive',
      //   })
      // }
    } catch (error) {
      toast({
        title: 'Lỗi kết nối',
        description: 'Không thể gửi lệnh điều khiển',
        variant: 'destructive',
      })
    }
  }

  const handleThresholdUpdate = async (
    type: 'soil-low' | 'soil-high' | 'ldr-low' | 'ldr-high',
    value: number
  ) => {
    // Validate before making API call
    let validationError: string | null = null

    if (type === 'soil-low' || type === 'soil-high') {
      const low = type === 'soil-low' ? value : soilLowThreshold
      const high = type === 'soil-high' ? value : soilHighThreshold
      validationError = validateSoilThresholds(low, high)
      setSoilValidationError(validationError)

      if (validationError) {
        toast({
          title: 'Lỗi xác thực',
          description: validationError,
          variant: 'destructive',
        })
        return
      }
    }

    if (type === 'ldr-low' || type === 'ldr-high') {
      const low = type === 'ldr-low' ? value : ldrLowThreshold
      const high = type === 'ldr-high' ? value : ldrHighThreshold
      validationError = validateLdrThresholds(low, high)
      setLdrValidationError(validationError)

      if (validationError) {
        toast({
          title: 'Lỗi xác thực',
          description: validationError,
          variant: 'destructive',
        })
        return
      }
    }

    setIsUpdatingThreshold(type)
    try {
      let result
      switch (type) {
        case 'soil-low':
          result = await blynkService.setSoilLowThreshold(value)
          if (result.success) {
            setSoilLowThreshold(value)
            setSoilValidationError(null)
          }
          break
        case 'soil-high':
          result = await blynkService.setSoilHighThreshold(value)
          if (result.success) {
            setSoilHighThreshold(value)
            setSoilValidationError(null)
          }
          break
        case 'ldr-low':
          result = await blynkService.setLdrLowThreshold(value)
          if (result.success) {
            setLdrLowThreshold(value)
            setLdrValidationError(null)
          }
          break
        case 'ldr-high':
          result = await blynkService.setLdrHighThreshold(value)
          if (result.success) {
            setLdrHighThreshold(value)
            setLdrValidationError(null)
          }
          break
      }

      if (result.success) {
        toast({
          title: 'Cập nhật thành công',
          description: result.message,
        })
      } else {
        toast({
          title: 'Lỗi cập nhật',
          description: result.message || 'Không thể cập nhật ngưỡng',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Lỗi kết nối',
        description: 'Không thể gửi lệnh cập nhật ngưỡng',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingThreshold(null)
    }
  }

  return (
    <ManagerLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        { }
        <div className="mb-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển IoT thời gian thực</h1>
              <Button
                onClick={() => setIsThresholdModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Cấu hình ngưỡng thiết bị
              </Button>
            </div>
            <p className="text-gray-600">
              Giám sát cảm biến thời gian thực và điều khiển thiết bị IoT
            </p>
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold">Điều Khiển Đèn</h3>
                <Switch
                  checked={lightControl}
                  onCheckedChange={handleLightControl}
                  disabled={!isOnline || isLoading}
                />
              </div>
              <p className="text-gray-600 text-sm">
                {lightControl ? 'Đèn đang hoạt động' : 'Đèn đang tắt'}
              </p>
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

        { }
        <Dialog open={isThresholdModalOpen} onOpenChange={setIsThresholdModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Cấu hình Ngưỡng
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Thiết lập ngưỡng cho Độ ẩm đất và Ánh sáng để điều khiển tự động
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 md:grid-cols-2 mt-4">
              { }
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sprout className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Độ ẩm đất</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngưỡng thấp (Bật bơm khi ≤)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={soilLowThreshold}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          if (val >= 0 && val <= 100) {
                            setSoilLowThreshold(val)
                            // Validate in real-time
                            const error = validateSoilThresholds(val, soilHighThreshold)
                            setSoilValidationError(error)
                          }
                        }}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'soil-low'}
                        className={`flex-1 ${soilValidationError ? 'border-red-500' : ''}`}
                        placeholder="0-100"
                      />
                      <span className="flex items-center text-sm text-gray-500">%</span>
                      <Button
                        onClick={() => handleThresholdUpdate('soil-low', soilLowThreshold)}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'soil-low' || !!soilValidationError}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdatingThreshold === 'soil-low' ? 'Đang cập nhật...' : 'Cập nhật'}
                      </Button>
                    </div>
                    {soilValidationError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {soilValidationError}
                      </p>
                    )}
                    {!soilValidationError && (
                      <p className="text-xs text-gray-500 mt-1">
                        Máy bơm sẽ tự động bật khi độ ẩm đất ≤ {soilLowThreshold}%
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngưỡng cao (Tắt bơm khi ≥)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={soilHighThreshold}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          if (val >= 0 && val <= 100) {
                            setSoilHighThreshold(val)
                            // Validate in real-time
                            const error = validateSoilThresholds(soilLowThreshold, val)
                            setSoilValidationError(error)
                          }
                        }}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'soil-high'}
                        className={`flex-1 ${soilValidationError ? 'border-red-500' : ''}`}
                        placeholder="0-100"
                      />
                      <span className="flex items-center text-sm text-gray-500">%</span>
                      <Button
                        onClick={() => handleThresholdUpdate('soil-high', soilHighThreshold)}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'soil-high' || !!soilValidationError}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdatingThreshold === 'soil-high' ? 'Đang cập nhật...' : 'Cập nhật'}
                      </Button>
                    </div>
                    {soilValidationError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {soilValidationError}
                      </p>
                    )}
                    {!soilValidationError && (
                      <p className="text-xs text-gray-500 mt-1">
                        Máy bơm sẽ tự động tắt khi độ ẩm đất ≥ {soilHighThreshold}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

              { }
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Ánh sáng</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngưỡng thấp
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="1023"
                        value={ldrLowThreshold}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          if (val >= 0 && val <= 1023) {
                            setLdrLowThreshold(val)
                            // Validate in real-time
                            const error = validateLdrThresholds(val, ldrHighThreshold)
                            setLdrValidationError(error)
                          }
                        }}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'ldr-low'}
                        className={`flex-1 ${ldrValidationError ? 'border-red-500' : ''}`}
                        placeholder="0-1023"
                      />
                      <span className="flex items-center text-sm text-gray-500">lux</span>
                      <Button
                        onClick={() => handleThresholdUpdate('ldr-low', ldrLowThreshold)}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'ldr-low' || !!ldrValidationError}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdatingThreshold === 'ldr-low' ? 'Đang cập nhật...' : 'Cập nhật'}
                      </Button>
                    </div>
                    {ldrValidationError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {ldrValidationError}
                      </p>
                    )}
                    {!ldrValidationError && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ngưỡng ánh sáng thấp: {ldrLowThreshold} lux
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngưỡng cao
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="1023"
                        value={ldrHighThreshold}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          if (val >= 0 && val <= 1023) {
                            setLdrHighThreshold(val)
                            // Validate in real-time
                            const error = validateLdrThresholds(ldrLowThreshold, val)
                            setLdrValidationError(error)
                          }
                        }}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'ldr-high'}
                        className={`flex-1 ${ldrValidationError ? 'border-red-500' : ''}`}
                        placeholder="0-1023"
                      />
                      <span className="flex items-center text-sm text-gray-500">lux</span>
                      <Button
                        onClick={() => handleThresholdUpdate('ldr-high', ldrHighThreshold)}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'ldr-high' || !!ldrValidationError}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdatingThreshold === 'ldr-high' ? 'Đang cập nhật...' : 'Cập nhật'}
                      </Button>
                    </div>
                    {ldrValidationError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {ldrValidationError}
                      </p>
                    )}
                    {!ldrValidationError && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ngưỡng ánh sáng cao: {ldrHighThreshold} lux
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ManagerLayout>
  )
}

export default RealTimeIoTDashboard
