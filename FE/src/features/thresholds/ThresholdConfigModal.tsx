import React, { useEffect, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { blynkService } from '@/shared/api/blynkService'
import { useToast } from '@/shared/ui/use-toast'

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

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ngưỡng soil thấp (bật bơm khi ≤ %)</label>
                        <div className="flex items-center gap-3">
                            <input
                                value={soilLow === '' ? '' : String(soilLow)}
                                onChange={e => setSoilLow(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-28 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                placeholder="vd. 10"
                            />
                            <button type="button" onClick={() => void handleUpdate('soil-low')} className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm">Cập nhật</button>
                        </div>
                        <p className="text-xs text-muted-foreground">Máy bơm sẽ bật khi độ ẩm ≤ giá trị</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ngưỡng soil cao (tắt bơm khi ≥ %)</label>
                        <div className="flex items-center gap-3">
                            <input
                                value={soilHigh === '' ? '' : String(soilHigh)}
                                onChange={e => setSoilHigh(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-28 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                placeholder="vd. 85"
                            />
                            <button type="button" onClick={() => void handleUpdate('soil-high')} className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm">Cập nhật</button>
                        </div>
                        <p className="text-xs text-muted-foreground">Máy bơm sẽ tắt khi độ ẩm ≥ giá trị</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ngưỡng ánh sáng thấp (LDR ≤)</label>
                        <div className="flex items-center gap-3">
                            <input
                                value={ldrLow === '' ? '' : String(ldrLow)}
                                onChange={e => setLdrLow(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-28 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                placeholder="vd. 100"
                            />
                            <button type="button" onClick={() => void handleUpdate('ldr-low')} className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm">Cập nhật</button>
                        </div>
                        <p className="text-xs text-muted-foreground">Hệ thống xem ánh sáng ≤ giá trị là điều kiện thiếu sáng (đơn vị: lux / cảm biến LDR).</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ngưỡng ánh sáng cao (LDR ≥)</label>
                        <div className="flex items-center gap-3">
                            <input
                                value={ldrHigh === '' ? '' : String(ldrHigh)}
                                onChange={e => setLdrHigh(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-28 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                placeholder="vd. 300"
                            />
                            <button type="button" onClick={() => void handleUpdate('ldr-high')} className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm">Cập nhật</button>
                        </div>
                        <p className="text-xs text-muted-foreground">Hệ thống xem ánh sáng ≥ giá trị là điều kiện đủ sáng (đơn vị: lux / cảm biến LDR).</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ngưỡng bật đèn (LDR ≤)</label>
                        <div className="flex items-center gap-3">
                            <input
                                value={lightOn === '' ? '' : String(lightOn)}
                                onChange={e => setLightOn(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-32 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                placeholder="vd. 200"
                            />
                            <button type="button" onClick={() => void handleUpdate('light-on')} className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm">Cập nhật</button>
                        </div>
                        <p className="text-xs text-muted-foreground">Đèn LED sẽ tự động bật khi ánh sáng đo được ≤ giá trị này.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ngưỡng tắt đèn (LDR ≥)</label>
                        <div className="flex items-center gap-3">
                            <input
                                value={lightOff === '' ? '' : String(lightOff)}
                                onChange={e => setLightOff(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-32 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                placeholder="vd. 400"
                            />
                            <button type="button" onClick={() => void handleUpdate('light-off')} className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm">Cập nhật</button>
                        </div>
                        <p className="text-xs text-muted-foreground">Đèn LED sẽ tự động tắt khi ánh sáng đo được ≥ giá trị này.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ThresholdConfigModal


