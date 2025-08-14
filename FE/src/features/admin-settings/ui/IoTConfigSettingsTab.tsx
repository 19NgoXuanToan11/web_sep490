import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  Wifi,
  Thermometer,
  Droplets,
  Beaker,
  Save,
  AlertTriangle,
  Clock,
  Settings,
  Zap,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useToast } from '@/shared/ui/use-toast'
import { useAdminSettingsStore } from '../store/adminSettingsStore'
import {
  iotConfigSettingsSchema,
  pollingIntervalPresets,
  defaultIoTConfigSettings,
} from '../model/schemas'
import type { IoTConfigSettingsFormData } from '../model/schemas'

export const IoTConfigSettingsTab: React.FC = () => {
  const { settings, loadingStates, updateIoTConfigSettings, setHasUnsavedChanges } =
    useAdminSettingsStore()
  const { toast } = useToast()

  const isLoading = loadingStates['update-iot-config-settings']?.isLoading
  const error = loadingStates['update-iot-config-settings']?.error

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<IoTConfigSettingsFormData>({
    resolver: zodResolver(iotConfigSettingsSchema),
    defaultValues: defaultIoTConfigSettings,
    mode: 'onChange',
  })

  const watchedInterval = watch('defaultPollingInterval')
  const watchedThresholds = watch('sensorThresholds')

  // Reset form when settings change
  useEffect(() => {
    reset(settings.iotConfig)
  }, [settings.iotConfig, reset])

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty)
  }, [isDirty, setHasUnsavedChanges])

  const onSubmit = async (data: IoTConfigSettingsFormData) => {
    try {
      await updateIoTConfigSettings(data)
      toast({
        title: 'IoT Configuration updated',
        description: 'IoT settings have been saved successfully.',
        duration: 3000,
      })
    } catch (error) {
      // Error is handled by the store's loading state
    }
  }

  const getIntervalDescription = (interval: number) => {
    if (interval < 10) return 'High frequency - More data, higher resource usage'
    if (interval < 30) return 'Balanced - Good balance of data and efficiency'
    if (interval < 60) return 'Standard - Lower resource usage, less frequent updates'
    return 'Low frequency - Minimal resource usage, infrequent updates'
  }

  const handlePresetSelect = (interval: string) => {
    setValue('defaultPollingInterval', parseInt(interval), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wifi className="h-6 w-6 text-green-600" />
            IoT Configuration
          </h2>
          <p className="text-gray-600 mt-1">Configure IoT device settings and sensor thresholds</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2"
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Polling Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Data Polling Configuration
            </CardTitle>
            <CardDescription>Configure how often IoT devices report sensor data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Custom Interval */}
              <div className="space-y-3">
                <Label htmlFor="defaultPollingInterval">Default Polling Interval (minutes)</Label>
                <div className="flex gap-2">
                  <Input
                    id="defaultPollingInterval"
                    type="number"
                    min="1"
                    max="1440"
                    {...register('defaultPollingInterval', { valueAsNumber: true })}
                    error={!!errors.defaultPollingInterval}
                    className="max-w-32"
                  />
                  <span className="flex items-center text-sm text-gray-500 px-3">minutes</span>
                </div>
                {errors.defaultPollingInterval && (
                  <p className="text-sm text-red-600">{errors.defaultPollingInterval.message}</p>
                )}
                <p className="text-xs text-gray-500">{getIntervalDescription(watchedInterval)}</p>
              </div>

              {/* Preset Options */}
              <div className="space-y-3">
                <Label>Quick Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {pollingIntervalPresets.map(preset => (
                    <Button
                      key={preset.value}
                      type="button"
                      variant={watchedInterval === preset.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePresetSelect(preset.value.toString())}
                      className="justify-start text-left h-auto py-2"
                    >
                      <div>
                        <div className="font-medium">{preset.label}</div>
                        <div className="text-xs opacity-75">{preset.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Polling Impact Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-blue-800 mb-1">Performance Impact</h5>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>
                      • <strong>Lower intervals (1-10 min):</strong> More real-time data, higher
                      bandwidth and battery usage
                    </p>
                    <p>
                      • <strong>Higher intervals (30+ min):</strong> Less frequent updates, better
                      battery life and efficiency
                    </p>
                    <p>
                      • <strong>Current setting ({watchedInterval} min):</strong>{' '}
                      {getIntervalDescription(watchedInterval)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sensor Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Sensor Thresholds
            </CardTitle>
            <CardDescription>
              Set default alarm thresholds for environmental sensors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Temperature Thresholds */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-red-500" />
                <h4 className="font-medium">Temperature (°C)</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tempMin">Minimum Threshold</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tempMin"
                      type="number"
                      step="0.1"
                      {...register('sensorThresholds.temperature.min', { valueAsNumber: true })}
                      error={!!errors.sensorThresholds?.temperature?.min}
                      className="max-w-32"
                    />
                    <span className="flex items-center text-sm text-gray-500 px-3">°C</span>
                  </div>
                  {errors.sensorThresholds?.temperature?.min && (
                    <p className="text-sm text-red-600">
                      {errors.sensorThresholds.temperature.min.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tempMax">Maximum Threshold</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tempMax"
                      type="number"
                      step="0.1"
                      {...register('sensorThresholds.temperature.max', { valueAsNumber: true })}
                      error={!!errors.sensorThresholds?.temperature?.max}
                      className="max-w-32"
                    />
                    <span className="flex items-center text-sm text-gray-500 px-3">°C</span>
                  </div>
                  {errors.sensorThresholds?.temperature?.max && (
                    <p className="text-sm text-red-600">
                      {errors.sensorThresholds.temperature.max.message}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Current range: {watchedThresholds.temperature.min}°C to{' '}
                {watchedThresholds.temperature.max}°C
              </p>
            </div>

            {/* Moisture Thresholds */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">Soil Moisture (%)</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="moistureMin">Minimum Threshold</Label>
                  <div className="flex gap-2">
                    <Input
                      id="moistureMin"
                      type="number"
                      min="0"
                      max="100"
                      {...register('sensorThresholds.moisture.min', { valueAsNumber: true })}
                      error={!!errors.sensorThresholds?.moisture?.min}
                      className="max-w-32"
                    />
                    <span className="flex items-center text-sm text-gray-500 px-3">%</span>
                  </div>
                  {errors.sensorThresholds?.moisture?.min && (
                    <p className="text-sm text-red-600">
                      {errors.sensorThresholds.moisture.min.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moistureMax">Maximum Threshold</Label>
                  <div className="flex gap-2">
                    <Input
                      id="moistureMax"
                      type="number"
                      min="0"
                      max="100"
                      {...register('sensorThresholds.moisture.max', { valueAsNumber: true })}
                      error={!!errors.sensorThresholds?.moisture?.max}
                      className="max-w-32"
                    />
                    <span className="flex items-center text-sm text-gray-500 px-3">%</span>
                  </div>
                  {errors.sensorThresholds?.moisture?.max && (
                    <p className="text-sm text-red-600">
                      {errors.sensorThresholds.moisture.max.message}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Current range: {watchedThresholds.moisture.min}% to {watchedThresholds.moisture.max}
                %
              </p>
            </div>

            {/* pH Thresholds */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Beaker className="h-5 w-5 text-purple-500" />
                <h4 className="font-medium">pH Level</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phMin">Minimum Threshold</Label>
                  <div className="flex gap-2">
                    <Input
                      id="phMin"
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      {...register('sensorThresholds.ph.min', { valueAsNumber: true })}
                      error={!!errors.sensorThresholds?.ph?.min}
                      className="max-w-32"
                    />
                    <span className="flex items-center text-sm text-gray-500 px-3">pH</span>
                  </div>
                  {errors.sensorThresholds?.ph?.min && (
                    <p className="text-sm text-red-600">{errors.sensorThresholds.ph.min.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phMax">Maximum Threshold</Label>
                  <div className="flex gap-2">
                    <Input
                      id="phMax"
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      {...register('sensorThresholds.ph.max', { valueAsNumber: true })}
                      error={!!errors.sensorThresholds?.ph?.max}
                      className="max-w-32"
                    />
                    <span className="flex items-center text-sm text-gray-500 px-3">pH</span>
                  </div>
                  {errors.sensorThresholds?.ph?.max && (
                    <p className="text-sm text-red-600">{errors.sensorThresholds.ph.max.message}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Current range: {watchedThresholds.ph.min} to {watchedThresholds.ph.max} pH
              </p>
            </div>

            {/* Threshold Info */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-yellow-800 mb-1">Threshold Guidelines</h5>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p>
                      • <strong>Temperature:</strong> Typical range 10-35°C for most crops
                    </p>
                    <p>
                      • <strong>Moisture:</strong> 20-80% depending on crop type and growth stage
                    </p>
                    <p>
                      • <strong>pH:</strong> Most crops prefer 6.0-7.5 pH range
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset(settings.iotConfig)}
            disabled={isLoading || !isDirty}
          >
            Reset Changes
          </Button>
          <Button
            type="submit"
            disabled={!isValid || !isDirty || isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
