import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
    lightState: false,
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

  const [soilLowThreshold, setSoilLowThreshold] = useState<number>(0)
  const [soilHighThreshold, setSoilHighThreshold] = useState<number>(0)
  const [ldrLowThreshold, setLdrLowThreshold] = useState<number>(0)
  const [ldrHighThreshold, setLdrHighThreshold] = useState<number>(0)
  const [lightOnThreshold, setLightOnThreshold] = useState<number>(0)
  const [lightOffThreshold, setLightOffThreshold] = useState<number>(0)
  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState<string | null>(null)
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false)
  const [isLoadingThresholds, setIsLoadingThresholds] = useState(false)

  const [soilValidationError, setSoilValidationError] = useState<string | null>(null)
  const [ldrValidationError, setLdrValidationError] = useState<string | null>(null)
  const [lightValidationError, setLightValidationError] = useState<string | null>(null)

  const REFRESH_INTERVAL = 5000

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

  const validateLightThresholds = (onThreshold: number, offThreshold: number): string | null => {
    if (offThreshold <= onThreshold) {
      return 'Ngưỡng tắt đèn phải lớn hơn ngưỡng bật đèn'
    }
    return null
  }

  const fetchSensorData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await blynkService.getBlynkData()
      setSensorData(data)
      setPumpControl(data.pumpState)
      setLightControl(data.lightState ?? false)
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
      fetchSensorData()
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchSensorData])

  useEffect(() => {
    if (isThresholdModalOpen) {
      const fetchThresholds = async () => {
        setIsLoadingThresholds(true)
        try {
          const rawData = await blynkService.getRawBlynkData()

          if (rawData.v8 !== undefined && rawData.v8 !== null && rawData.v8 !== '') {
            const v8 = parseInt(rawData.v8)
            if (!isNaN(v8)) setSoilLowThreshold(v8)
          }
          if (rawData.v9 !== undefined && rawData.v9 !== null && rawData.v9 !== '') {
            const v9 = parseInt(rawData.v9)
            if (!isNaN(v9)) setSoilHighThreshold(v9)
          }
          if (rawData.v10 !== undefined && rawData.v10 !== null && rawData.v10 !== '') {
            const v10 = parseInt(rawData.v10)
            if (!isNaN(v10)) setLdrLowThreshold(v10)
          }
          if (rawData.v11 !== undefined && rawData.v11 !== null && rawData.v11 !== '') {
            const v11 = parseInt(rawData.v11)
            if (!isNaN(v11)) setLdrHighThreshold(v11)
          }
          if (rawData.v13 !== undefined && rawData.v13 !== null && rawData.v13 !== '') {
            const v13 = parseInt(rawData.v13)
            if (!isNaN(v13)) setLightOnThreshold(v13)
          }
          if (rawData.v14 !== undefined && rawData.v14 !== null && rawData.v14 !== '') {
            const v14 = parseInt(rawData.v14)
            if (!isNaN(v14)) setLightOffThreshold(v14)
          }
        } catch (error) {
          toast({
            title: 'Lỗi tải dữ liệu',
            description: 'Không thể tải giá trị ngưỡng từ máy chủ',
            variant: 'destructive',
          })
        } finally {
          setIsLoadingThresholds(false)
        }
      }

      fetchThresholds()
    } else {
      setSoilValidationError(null)
      setLdrValidationError(null)
      setLightValidationError(null)
    }
  }, [isThresholdModalOpen, toast])

  useEffect(() => {
    if (isThresholdModalOpen && !isLoadingThresholds) {
      const soilError = validateSoilThresholds(soilLowThreshold, soilHighThreshold)
      const ldrError = validateLdrThresholds(ldrLowThreshold, ldrHighThreshold)
      const lightError = validateLightThresholds(lightOnThreshold, lightOffThreshold)
      setSoilValidationError(soilError)
      setLdrValidationError(ldrError)
      setLightValidationError(lightError)
    }
  }, [isThresholdModalOpen, soilLowThreshold, soilHighThreshold, ldrLowThreshold, ldrHighThreshold, lightOnThreshold, lightOffThreshold, isLoadingThresholds])

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

        if (!newState) {
          setPumpControl(true)
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
        const isOpen = angle[0] >= 90
        toast({
          title: 'Mái che đã điều chỉnh',
          description: result.message || `Mái che: ${isOpen ? 'Mở' : 'Đóng'}`,
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
      const result = await blynkService.controlLight(newState)
      if (result.success) {
        setLightControl(newState)
        toast({
          title: newState ? 'Đèn đã bật' : 'Đèn đã tắt',
          description: result.message || `Trạng thái đèn: ${newState ? 'Hoạt động' : 'Tắt'}`,
        })
      } else {
        toast({
          title: 'Lỗi điều khiển',
          description: result.message || 'Không thể điều khiển đèn',
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

  const handleThresholdUpdate = async (
    type: 'soil-low' | 'soil-high' | 'ldr-low' | 'ldr-high' | 'light-on' | 'light-off',
    value: number
  ) => {
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

    if (type === 'light-on' || type === 'light-off') {
      const onThreshold = type === 'light-on' ? value : lightOnThreshold
      const offThreshold = type === 'light-off' ? value : lightOffThreshold
      validationError = validateLightThresholds(onThreshold, offThreshold)
      setLightValidationError(validationError)

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
        case 'light-on':
          result = await blynkService.setLightOnThreshold(value)
          if (result.success) {
            setLightOnThreshold(value)
            setLightValidationError(null)
          }
          break
        case 'light-off':
          result = await blynkService.setLightOffThreshold(value)
          if (result.success) {
            setLightOffThreshold(value)
            setLightValidationError(null)
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
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Cấu hình Ngưỡng
                </DialogTitle>
              </div>
            </DialogHeader>
            {isLoadingThresholds && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-green-600 mr-2" />
                <span className="text-sm text-gray-600">Đang tải giá trị ngưỡng...</span>
              </div>
            )}
            <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4 ${isLoadingThresholds ? 'opacity-50 pointer-events-none' : ''}`}>
              { }
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
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
                            const error = validateSoilThresholds(val, soilHighThreshold)
                            setSoilValidationError(error)
                          }
                        }}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'soil-low' || isLoadingThresholds}
                        className={`flex-1 ${soilValidationError ? 'border-red-500' : ''}`}
                        placeholder={isLoadingThresholds ? 'Đang tải...' : '0-100'}
                      />
                      <span className="flex items-center text-sm text-gray-500">%</span>
                      <Button
                        onClick={() => handleThresholdUpdate('soil-low', soilLowThreshold)}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'soil-low' || !!soilValidationError || isLoadingThresholds}
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
                            const error = validateSoilThresholds(soilLowThreshold, val)
                            setSoilValidationError(error)
                          }
                        }}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'soil-high' || isLoadingThresholds}
                        className={`flex-1 ${soilValidationError ? 'border-red-500' : ''}`}
                        placeholder={isLoadingThresholds ? 'Đang tải...' : '0-100'}
                      />
                      <span className="flex items-center text-sm text-gray-500">%</span>
                      <Button
                        onClick={() => handleThresholdUpdate('soil-high', soilHighThreshold)}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'soil-high' || !!soilValidationError || isLoadingThresholds}
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
                            const error = validateLdrThresholds(val, ldrHighThreshold)
                            setLdrValidationError(error)
                          }
                        }}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'ldr-low' || isLoadingThresholds}
                        className={`flex-1 ${ldrValidationError ? 'border-red-500' : ''}`}
                        placeholder={isLoadingThresholds ? 'Đang tải...' : '0-1023'}
                      />
                      <span className="flex items-center text-sm text-gray-500">lux</span>
                      <Button
                        onClick={() => handleThresholdUpdate('ldr-low', ldrLowThreshold)}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'ldr-low' || !!ldrValidationError || isLoadingThresholds}
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
                            const error = validateLdrThresholds(ldrLowThreshold, val)
                            setLdrValidationError(error)
                          }
                        }}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'ldr-high' || isLoadingThresholds}
                        className={`flex-1 ${ldrValidationError ? 'border-red-500' : ''}`}
                        placeholder={isLoadingThresholds ? 'Đang tải...' : '0-1023'}
                      />
                      <span className="flex items-center text-sm text-gray-500">lux</span>
                      <Button
                        onClick={() => handleThresholdUpdate('ldr-high', ldrHighThreshold)}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'ldr-high' || !!ldrValidationError || isLoadingThresholds}
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

              { }
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Đèn LED</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngưỡng bật đèn
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="1023"
                        value={lightOnThreshold}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          if (val >= 0 && val <= 1023) {
                            setLightOnThreshold(val)
                            const error = validateLightThresholds(val, lightOffThreshold)
                            setLightValidationError(error)
                          }
                        }}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'light-on' || isLoadingThresholds}
                        className={`flex-1 ${lightValidationError ? 'border-red-500' : ''}`}
                        placeholder={isLoadingThresholds ? 'Đang tải...' : '0-1023'}
                      />
                      <span className="flex items-center text-sm text-gray-500">lux</span>
                      <Button
                        onClick={() => handleThresholdUpdate('light-on', lightOnThreshold)}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'light-on' || !!lightValidationError || isLoadingThresholds}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdatingThreshold === 'light-on' ? 'Đang cập nhật...' : 'Cập nhật'}
                      </Button>
                    </div>
                    {lightValidationError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {lightValidationError}
                      </p>
                    )}
                    {!lightValidationError && (
                      <p className="text-xs text-gray-500 mt-1">
                        Đèn sẽ tự động bật khi ánh sáng ≤ {lightOnThreshold} lux
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngưỡng tắt đèn
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="1023"
                        value={lightOffThreshold}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          if (val >= 0 && val <= 1023) {
                            setLightOffThreshold(val)
                            const error = validateLightThresholds(lightOnThreshold, val)
                            setLightValidationError(error)
                          }
                        }}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'light-off' || isLoadingThresholds}
                        className={`flex-1 ${lightValidationError ? 'border-red-500' : ''}`}
                        placeholder={isLoadingThresholds ? 'Đang tải...' : '0-1023'}
                      />
                      <span className="flex items-center text-sm text-gray-500">lux</span>
                      <Button
                        onClick={() => handleThresholdUpdate('light-off', lightOffThreshold)}
                        disabled={!isOnline || isLoading || isUpdatingThreshold === 'light-off' || !!lightValidationError || isLoadingThresholds}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdatingThreshold === 'light-off' ? 'Đang cập nhật...' : 'Cập nhật'}
                      </Button>
                    </div>
                    {lightValidationError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {lightValidationError}
                      </p>
                    )}
                    {!lightValidationError && (
                      <p className="text-xs text-gray-500 mt-1">
                        Đèn sẽ tự động tắt khi ánh sáng ≥ {lightOffThreshold} lux
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
