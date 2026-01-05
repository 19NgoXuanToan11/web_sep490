import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Loader2 } from 'lucide-react'

interface UpdateStageModalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customToday: string
  onCustomTodayChange: (date: string) => void
  scheduleStartDate?: string
  actionLoading: { [key: string]: boolean }
  selectedScheduleId?: number
  onSubmit: () => void
}

export function UpdateStageModalDialog({
  open,
  onOpenChange,
  customToday,
  onCustomTodayChange,
  scheduleStartDate,
  actionLoading,
  selectedScheduleId,
  onSubmit,
}: UpdateStageModalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Cập nhật giai đoạn theo ngày
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Input
              id="customToday"
              type="date"
              value={customToday}
              onChange={(e) => onCustomTodayChange(e.target.value)}
              min={scheduleStartDate ? new Date(scheduleStartDate).toISOString().split('T')[0] : undefined}
              className="mt-2"
            />
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              onCustomTodayChange('')
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!customToday || actionLoading[`update-today-${selectedScheduleId}`]}
            className="bg-green-600 hover:bg-green-700"
          >
            {actionLoading[`update-today-${selectedScheduleId}`] ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              'Cập nhật giai đoạn'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
