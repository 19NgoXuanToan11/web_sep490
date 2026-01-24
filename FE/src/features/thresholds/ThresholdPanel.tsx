import React, { useCallback, useEffect, useState } from 'react'
import { blynkService } from '@/shared/api/blynkService'
import { withBackendToast } from '@/shared/lib/backend-toast'
import { showErrorToast, toastManager } from '@/shared/lib/toast-manager'

export const ThresholdPanel: React.FC = () => {
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
            showErrorToast(error)
        }
    }, [])

    useEffect(() => {
        void loadCurrentValues()
    }, [loadCurrentValues])

    const handleUpdate = async (type: string) => {
        try {
            let apiCall: () => Promise<{ success: boolean; message: string }>
            switch (type) {
                case 'soil-low':
                    if (soilLow === '') throw new Error('Giá trị không hợp lệ')
                    apiCall = () => blynkService.setSoilLowThreshold(Number(soilLow))
                    break
                case 'soil-high':
                    if (soilHigh === '') throw new Error('Giá trị không hợp lệ')
                    apiCall = () => blynkService.setSoilHighThreshold(Number(soilHigh))
                    break
                case 'ldr-low':
                    if (ldrLow === '') throw new Error('Giá trị không hợp lệ')
                    apiCall = () => blynkService.setLdrLowThreshold(Number(ldrLow))
                    break
                case 'ldr-high':
                    if (ldrHigh === '') throw new Error('Giá trị không hợp lệ')
                    apiCall = () => blynkService.setLdrHighThreshold(Number(ldrHigh))
                    break
                case 'light-on':
                    if (lightOn === '') throw new Error('Giá trị không hợp lệ')
                    apiCall = () => blynkService.setLightOnThreshold(Number(lightOn))
                    break
                case 'light-off':
                    if (lightOff === '') throw new Error('Giá trị không hợp lệ')
                    apiCall = () => blynkService.setLightOffThreshold(Number(lightOff))
                    break
                default:
                    throw new Error('Loại không xác định')
            }

            await withBackendToast(
                apiCall,
                {
                    onSuccess: (result) => {
                        if (result.message?.trim()) {
                            toastManager.success(result.message)
                        }
                    },
                }
            )
        } catch (error) {
        }
    }

    return (
        <div className="mt-2">
            <div className="mt-6 grid gap-6 md:grid-cols-1">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Ngưỡng độ ẩm thấp</label>
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
                    <label className="text-sm font-medium">Ngưỡng độ ẩm cao</label>
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
                    <label className="text-sm font-medium">Ngưỡng ánh sáng thấp</label>
                    <div className="flex items-center gap-3">
                        <input
                            value={ldrLow === '' ? '' : String(ldrLow)}
                            onChange={e => setLdrLow(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-28 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            placeholder="vd. 100"
                        />
                        <button type="button" onClick={() => void handleUpdate('ldr-low')} className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm">Cập nhật</button>
                    </div>
                    <p className="text-xs text-muted-foreground">Hệ thống xem ánh sáng ≤ giá trị là điều kiện thiếu sáng.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Ngưỡng ánh sáng cao</label>
                    <div className="flex items-center gap-3">
                        <input
                            value={ldrHigh === '' ? '' : String(ldrHigh)}
                            onChange={e => setLdrHigh(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-28 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            placeholder="vd. 300"
                        />
                        <button type="button" onClick={() => void handleUpdate('ldr-high')} className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm">Cập nhật</button>
                    </div>
                    <p className="text-xs text-muted-foreground">Hệ thống xem ánh sáng ≥ giá trị là điều kiện đủ sáng.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Ngưỡng bật đèn</label>
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
                    <label className="text-sm font-medium">Ngưỡng tắt đèn</label>
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
        </div>
    )
}

export default ThresholdPanel


