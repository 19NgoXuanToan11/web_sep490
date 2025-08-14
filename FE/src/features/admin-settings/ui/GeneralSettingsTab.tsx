import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Settings, Palette, Upload, Save, AlertTriangle, Check, Image } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { useToast } from '@/shared/ui/use-toast'
import { useAdminSettingsStore } from '../store/adminSettingsStore'
import {
  generalSettingsSchema,
  primaryColorOptions,
  defaultGeneralSettings,
} from '../model/schemas'
import type { GeneralSettingsFormData } from '../model/schemas'

export const GeneralSettingsTab: React.FC = () => {
  const { settings, loadingStates, updateGeneralSettings, setHasUnsavedChanges } =
    useAdminSettingsStore()
  const { toast } = useToast()

  const isLoading = loadingStates['update-general-settings']?.isLoading
  const error = loadingStates['update-general-settings']?.error

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: defaultGeneralSettings,
    mode: 'onChange',
  })

  const watchedColor = watch('primaryColor', settings.general.primaryColor)

  // Reset form when settings change
  useEffect(() => {
    reset(settings.general)
  }, [settings.general, reset])

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty)
  }, [isDirty, setHasUnsavedChanges])

  const onSubmit = async (data: GeneralSettingsFormData) => {
    try {
      await updateGeneralSettings(data)
      toast({
        title: 'Settings updated',
        description: 'General settings have been saved successfully.',
        duration: 3000,
      })
    } catch (error) {
      // Error is handled by the store's loading state
    }
  }

  const handleColorSelect = (color: string) => {
    setValue('primaryColor', color, { shouldDirty: true, shouldValidate: true })
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real app, this would upload to a server
      // For now, we'll create a local URL
      const logoUrl = URL.createObjectURL(file)
      setValue('logoUrl', logoUrl, { shouldDirty: true, shouldValidate: true })

      toast({
        title: 'Logo uploaded',
        description: 'Logo preview updated. Save settings to apply changes.',
      })
    }
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
            <Settings className="h-6 w-6 text-green-600" />
            General Settings
          </h2>
          <p className="text-gray-600 mt-1">Configure basic system information and branding</p>
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

        {/* System Name */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Information</CardTitle>
            <CardDescription>Basic information about your farm management system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">System Name *</Label>
              <Input
                id="systemName"
                placeholder="IFMS - Integrated Farm Management System"
                {...register('systemName')}
                error={!!errors.systemName}
                className="max-w-md"
              />
              {errors.systemName && (
                <p className="text-sm text-red-600">{errors.systemName.message}</p>
              )}
              <p className="text-xs text-gray-500">
                This name will appear in the header and login pages
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Branding & Appearance
            </CardTitle>
            <CardDescription>Customize the visual appearance of your system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Color Selection */}
            <div className="space-y-3">
              <Label>Primary Color</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {primaryColorOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleColorSelect(option.value)}
                    className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                      watchedColor === option.value
                        ? 'border-gray-400 bg-gray-50 ring-2 ring-offset-1 ring-green-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${option.class} mb-2 relative`}>
                      {watchedColor === option.value && (
                        <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                      )}
                    </div>
                    <span className="text-xs text-center font-medium">{option.name}</span>
                  </button>
                ))}
              </div>
              {errors.primaryColor && (
                <p className="text-sm text-red-600">{errors.primaryColor.message}</p>
              )}
            </div>

            {/* Logo Upload */}
            <div className="space-y-3">
              <Label>System Logo</Label>
              <div className="flex items-start gap-4">
                {/* Logo Preview */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {watch('logoUrl') ? (
                      <img
                        src={watch('logoUrl') || ''}
                        alt="Logo preview"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <Image className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-2">
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload a PNG, JPG, or SVG file. Recommended size: 200x200px
                  </p>
                  {watch('logoUrl') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('logoUrl', '', { shouldDirty: true })}
                    >
                      Remove Logo
                    </Button>
                  )}
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
            onClick={() => reset(settings.general)}
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
