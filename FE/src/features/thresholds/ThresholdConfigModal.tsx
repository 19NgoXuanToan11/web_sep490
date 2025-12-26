import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import ThresholdPanel from './ThresholdPanel'

export const ThresholdConfigModal: React.FC = () => {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const handler = () => {
            setOpen(true)
        }
        window.addEventListener('openThresholdConfig', handler as EventListener)
        return () => window.removeEventListener('openThresholdConfig', handler as EventListener)
    }, [])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg p-6">
                <DialogHeader className="text-left">
                    <DialogTitle className="text-xl font-semibold">Cấu hình Ngưỡng</DialogTitle>
                </DialogHeader>

                <ThresholdPanel />
            </DialogContent>
        </Dialog>
    )
}

export default ThresholdConfigModal


