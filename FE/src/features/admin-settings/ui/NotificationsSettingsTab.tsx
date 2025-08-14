import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Bell, Mail, Smartphone, Save, AlertTriangle, Clock, Settings } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { useToast } from '@/shared/ui/use-toast'
import { useAdminSettingsStore } from '../store/adminSettingsStore'
import {
  notificationsSettingsSchema,
  alertFrequencyOptions,
  defaultNotificationsSettings,
} from '../model/schemas'
import type { NotificationsSettingsFormData } from '../model/schemas'

export const NotificationsSettingsTab: React.FC = () => {
  const { settings, loadingStates, updateNotificationsSettings, setHasUnsavedChanges } =
    useAdminSettingsStore()
  const { toast } = useToast()

  const isLoading = loadingStates['update-notifications-settings']?.isLoading
  const error = loadingStates['update-notifications-settings']?.error

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<NotificationsSettingsFormData>({
    resolver: zodResolver(notificationsSettingsSchema),
    defaultValues: defaultNotificationsSettings,
    mode: 'onChange',
  })

  const watchedEmailEnabled = watch('emailEnabled')
  const watchedSmsEnabled = watch('smsEnabled')
  const watchedAlertFrequency = watch('alertFrequency')

  // Reset form when settings change
  useEffect(() => {
    reset(settings.notifications)
  }, [settings.notifications, reset])

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty)
  }, [isDirty, setHasUnsavedChanges])

  const onSubmit = async (data: NotificationsSettingsFormData) => {
    try {
      await updateNotificationsSettings(data)
      toast({
        title: 'Notifications updated',
        description: 'Notification settings have been saved successfully.',
        duration: 3000,
      })
    } catch (error) {
      // Error is handled by the store's loading state
    }
  }

  const getFrequencyDescription = (frequency: string) => {
    const option = alertFrequencyOptions.find(opt => opt.value === frequency)
    return option?.description || ''
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
            <Bell className="h-6 w-6 text-green-600" />
            Notification Settings
          </h2>
          <p className="text-gray-600 mt-1">
            Configure how and when the system sends notifications
          </p>
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

        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notification Channels</CardTitle>
            <CardDescription>Enable or disable notification delivery methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-600 mt-1">Receive alerts and updates via email</p>
                  <p className="text-xs text-gray-500 mt-1">
                    System alerts, maintenance reminders, and reports
                  </p>
                </div>
              </div>
              <Switch
                checked={watchedEmailEnabled}
                onCheckedChange={checked =>
                  setValue('emailEnabled', checked, { shouldDirty: true })
                }
              />
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">SMS Notifications</h4>
                  <p className="text-sm text-gray-600 mt-1">Receive critical alerts via SMS</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Emergency alerts and critical system failures only
                  </p>
                </div>
              </div>
              <Switch
                checked={watchedSmsEnabled}
                onCheckedChange={checked => setValue('smsEnabled', checked, { shouldDirty: true })}
              />
            </div>

            {/* Notification Status */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Current Status</h4>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${watchedEmailEnabled ? 'bg-green-500' : 'bg-gray-400'}`}
                  />
                  <span className={watchedEmailEnabled ? 'text-green-700' : 'text-gray-500'}>
                    Email {watchedEmailEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${watchedSmsEnabled ? 'bg-green-500' : 'bg-gray-400'}`}
                  />
                  <span className={watchedSmsEnabled ? 'text-green-700' : 'text-gray-500'}>
                    SMS {watchedSmsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Alert Frequency
            </CardTitle>
            <CardDescription>Configure how often you receive non-critical alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alertFrequency">Notification Frequency</Label>
              <Select
                value={watchedAlertFrequency}
                onValueChange={value =>
                  setValue('alertFrequency', value as any, { shouldDirty: true })
                }
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {alertFrequencyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-gray-500">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.alertFrequency && (
                <p className="text-sm text-red-600">{errors.alertFrequency.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {getFrequencyDescription(watchedAlertFrequency)}
              </p>
            </div>

            {/* Frequency Preview */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-2">What you'll receive:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• System maintenance notifications</li>
                <li>• Low inventory alerts</li>
                <li>• Device status updates</li>
                <li>• Weekly/Monthly reports (based on frequency)</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                Critical alerts (system failures, security issues) are always sent immediately
                regardless of frequency settings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced Options
            </CardTitle>
            <CardDescription>Additional notification preferences and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <h5 className="font-medium text-sm mb-2">Notification Types</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>Critical Alerts (Always immediate)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span>Warning Alerts (Based on frequency)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Information Updates (Based on frequency)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Success Notifications (Based on frequency)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h5 className="font-medium text-yellow-800 mb-1">Note</h5>
                <p className="text-sm text-yellow-700">
                  Email and SMS settings may require additional configuration by your system
                  administrator. Contact support if notifications are not being delivered as
                  expected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset(settings.notifications)}
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
