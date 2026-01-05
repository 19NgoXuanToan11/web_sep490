import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Loader2 } from 'lucide-react'

interface AssignStaffDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    assignStaffId: number
    onAssignStaffIdChange: (id: number) => void
    staffs: { id: number; name: string }[]
    actionLoading: { [key: string]: boolean }
    selectedScheduleId?: number
    onSubmit: () => void
}

export function AssignStaffDialog({
    open,
    onOpenChange,
    assignStaffId,
    onAssignStaffIdChange,
    staffs,
    actionLoading,
    selectedScheduleId,
    onSubmit,
}: AssignStaffDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Phân công nhân viên</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Nhân viên</Label>
                        <Select
                            value={assignStaffId ? String(assignStaffId) : ''}
                            onValueChange={v => onAssignStaffIdChange(Number(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn nhân viên" />
                            </SelectTrigger>
                            <SelectContent>
                                {staffs.map(s => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={!assignStaffId || actionLoading[`assign-${selectedScheduleId}`]}
                    >
                        {actionLoading[`assign-${selectedScheduleId}`] && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Phân công
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
