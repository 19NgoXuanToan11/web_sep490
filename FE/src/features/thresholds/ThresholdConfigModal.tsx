import React, { useEffect, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { blynkService } from '@/shared/api/blynkService'
import { useToast } from '@/shared/ui/use-toast'
import ThresholdPanel from './ThresholdPanel'

export const ThresholdConfigModal: React.FC = () => {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)

    const [soilLow, setSoilLow] = useState<number | ''>('')
    const [soilHigh, setSoilHigh] = useState<number | ''>('')
    const [ldrLow, setLdrLow] = useState<number | ''>('')
    const [ldrHigh, setLdrHigh] = useState<number | ''>('')
    const [lightOn, setLightOn] = useState<number | ''>('')
    const [lightOff, setLightOff] = useState<number | ''>('')

    const loadCurrentValues = useCallback(async () => {
        try {
            const raw = await blynkService.getRawBlynkData()
            setSoilHigh(raw.v9 ? parseInt(raw.v9, 10) || '' : '')
            setLdrLow(raw.v10 ? parseInt(raw.v10, 10) || '' : '')
            setLdrHigh(raw.v11 ? parseInt(raw.v11, 10) || '' : '')
            setLightOn(raw.v13 ? parseInt(raw.v13, 10) || '' : '')
            setLightOff(raw.v14 ? parseInt(raw.v14, 10) || '' : '')
        } catch (error: any) {
            toast({ title: 'Không tải được giá trị hiện tại', description: error?.message || String(error) })
        }
    }, [toast])

    useEffect(() => {
        const handler = () => {
            setOpen(true)
            void loadCurrentValues()
        }
        window.addEventListener('openThresholdConfig', handler as EventListener)
        return () => window.removeEventListener('openThresholdConfig', handler as EventListener)
    }, [loadCurrentValues])

    const handleUpdate = async (type: string) => {
        try {
            let result
            switch (type) {
                case 'soil-low':
                    if (soilLow === '') throw new Error('Giá trị không hợp lệ')
                    result = await blynkService.setSoilLowThreshold(Number(soilLow))
                    break
                case 'soil-high':
                    if (soilHigh === '') throw new Error('Giá trị không hợp lệ')
                    result = await blynkService.setSoilHighThreshold(Number(soilHigh))
                    break
                case 'ldr-low':
                    if (ldrLow === '') throw new Error('Giá trị không hợp lệ')
                    result = await blynkService.setLdrLowThreshold(Number(ldrLow))
                    break
                case 'ldr-high':
                    if (ldrHigh === '') throw new Error('Giá trị không hợp lệ')
                    result = await blynkService.setLdrHighThreshold(Number(ldrHigh))
                    break
                case 'light-on':
                    if (lightOn === '') throw new Error('Giá trị không hợp lệ')
                    result = await blynkService.setLightOnThreshold(Number(lightOn))
                    break
                case 'light-off':
                    if (lightOff === '') throw new Error('Giá trị không hợp lệ')
                    result = await blynkService.setLightOffThreshold(Number(lightOff))
                    break
                default:
                    throw new Error('Loại không xác định')
            }

            if (result?.success) {
                toast({ title: 'Cập nhật thành công', description: result.message })
            } else {
                toast({ title: 'Lỗi cập nhật', description: result?.message || 'Không cập nhật được' })
            }
        } catch (err: any) {
            toast({ title: 'Lỗi', description: err?.message || String(err) })
        }
    }

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


