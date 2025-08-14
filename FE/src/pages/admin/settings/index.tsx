import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Bell,
  Wifi,
  Palette,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Badge } from '@/shared/ui/badge'
import { useToast } from '@/shared/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { AdminLayout } from '@/shared/layouts/AdminLayout'
import {
  useAdminSettingsStore,
  GeneralSettingsTab,
  NotificationsSettingsTab,
  IoTConfigSettingsTab,
} from '@/features/admin-settings'

const AdminSettingsPage: React.FC = () => {
  const {
    activeTab,
    hasUnsavedChanges,
    loadingStates,
    initializeData,
    saveAllSettings,
    resetSettings,
    setActiveTab,
  } = useAdminSettingsStore()

  const { toast } = useToast()

  // Modal states
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingTab, setPendingTab] = useState<string | null>(null)

  // Initialize data on mount
  useEffect(() => {
    initializeData()
  }, [initializeData])

  // Handle tab changes with unsaved changes check
  const handleTabChange = (newTab: string) => {
    if (hasUnsavedChanges) {
      setPendingTab(newTab)
      setShowUnsavedDialog(true)
    } else {
      setActiveTab(newTab as any)
    }
  }

  // Confirm tab change and lose unsaved changes
  const confirmTabChange = () => {
    if (pendingTab) {
      setActiveTab(pendingTab as any)
      resetSettings()
    }
    setShowUnsavedDialog(false)
    setPendingTab(null)
  }

  // Cancel tab change
  const cancelTabChange = () => {
    setShowUnsavedDialog(false)
    setPendingTab(null)
  }

  // Save all settings
  const handleSaveAll = async () => {
    try {
      await saveAllSettings()
      toast({
        title: 'Settings saved',
        description: 'All settings have been saved successfully.',
        duration: 3000,
      })
    } catch (error) {
      // Error is handled by the store
    }
  }

  // Reset all settings
  const handleResetAll = () => {
    resetSettings()
    toast({
      title: 'Settings reset',
      description: 'All settings have been reset to default values.',
    })
  }

  const isSaving = loadingStates['save-all-settings']?.isLoading

  // Tab configuration
  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: Palette,
      description: 'System name and branding',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Alert preferences',
    },
    {
      id: 'iot-config',
      label: 'IoT Config',
      icon: Wifi,
      description: 'Device settings',
    },
  ]

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
            <p className="text-gray-600">Configure system-wide settings and preferences</p>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700 font-medium">Unsaved changes</span>
              </motion.div>
            )}

            <Button
              variant="outline"
              onClick={handleResetAll}
              disabled={!hasUnsavedChanges || isSaving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset All
            </Button>

            <Button
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges || isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration
            </CardTitle>
            <CardDescription>Manage system settings across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3">
                {tabs.map(tab => {
                  const IconComponent = tab.icon
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {/* Tab Descriptions */}
              <div className="flex flex-wrap gap-2 mt-4 mb-6">
                {tabs.map(tab => (
                  <Badge
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {tab.description}
                  </Badge>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <TabsContent value="general" className="mt-6">
                  <GeneralSettingsTab />
                </TabsContent>

                <TabsContent value="notifications" className="mt-6">
                  <NotificationsSettingsTab />
                </TabsContent>

                <TabsContent value="iot-config" className="mt-6">
                  <IoTConfigSettingsTab />
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>

        {/* Unsaved Changes Dialog */}
        <Dialog open={showUnsavedDialog} onOpenChange={() => setShowUnsavedDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Unsaved Changes
              </DialogTitle>
              <DialogDescription>
                You have unsaved changes in the current tab. Do you want to discard them and switch
                tabs?
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelTabChange}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmTabChange}>
                Discard Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}

export default AdminSettingsPage
