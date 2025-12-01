import React, { useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid3X3, Loader2 } from 'lucide-react'
import { DeviceCard } from './DeviceCard'
import { Skeleton } from '@/shared/ui/skeleton'
import { useStaffOperationsStore } from '../store/staffOperationsStore'

interface DeviceGridViewProps {
  onDeviceAction?: (deviceId: string, action: string) => void
  onDeviceSelect?: (deviceId: string) => void
}

export const DeviceGridView: React.FC<DeviceGridViewProps> = ({ onDeviceAction, onDeviceSelect }) => {
  const { selectedDeviceIds, loadingStates, getPaginatedDevices, toggleDeviceSelection } =
    useStaffOperationsStore()

  const devices = getPaginatedDevices()
  const isLoading = loadingStates['refresh-all-devices']?.isLoading
  const selectedSet = useMemo(() => new Set(selectedDeviceIds), [selectedDeviceIds])
  const loadingEntries = useMemo(() => Object.entries(loadingStates), [loadingStates])

  const handleDeviceAction = useCallback(
    (deviceId: string, action: string) => {
      onDeviceAction?.(deviceId, action)
    },
    [onDeviceAction],
  )

  const handleDeviceSelect = useCallback(
    (deviceId: string) => {
      toggleDeviceSelection(deviceId)
      onDeviceSelect?.(deviceId)
    },
    [onDeviceSelect, toggleDeviceSelection],
  )

  const getDeviceLoadingState = useCallback(
    (deviceId: string) => loadingEntries.some(([key, state]) => key.includes(deviceId) && state?.isLoading),
    [loadingEntries],
  )

  if (isLoading && devices.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>

            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (devices.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <Grid3X3 className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy thiết bị</h3>
        <p className="text-gray-500 max-w-md">
          Không có thiết bị nào phù hợp với bộ lọc hiện tại. Hãy thử điều chỉnh tiêu chí tìm kiếm
          hoặc bộ lọc.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {isLoading && devices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center p-2 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
          <span className="text-sm text-blue-700 font-medium">
            Đang làm mới trạng thái thiết bị...
          </span>
        </motion.div>
      )}

      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {devices.map(device => (
            <motion.div
              key={device.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <DeviceCard
                device={device}
                isSelected={selectedSet.has(device.id)}
                onSelect={handleDeviceSelect}
                onAction={handleDeviceAction}
                isLoading={getDeviceLoadingState(device.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {selectedDeviceIds.length > 0 && (
        <div className="flex items-center justify-end text-sm text-gray-600 pt-4 border-t">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-green-600 font-medium"
          >
            {selectedDeviceIds.length} đã chọn
          </motion.span>
        </div>
      )}
    </div>
  )
}
