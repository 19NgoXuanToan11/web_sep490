import * as React from 'react'
import { cn } from '@/shared/lib/utils'

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const currentValue = value[0] || min

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value)
      onValueChange([newValue])
    }

    const progressPercentage = ((currentValue - min) / (max - min)) * 100

    return (
      <div className={cn('relative flex w-full items-center', className)}>
        <div className="relative w-full h-2 bg-gray-200 rounded-lg">
          <div
            className="absolute h-full bg-blue-600 rounded-lg"
            style={{ width: `${progressPercentage}%` }}
          />
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            onChange={handleChange}
            className="absolute w-full h-2 opacity-0 cursor-pointer"
            {...props}
          />
          <div
            className="absolute w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-md -mt-1.5 transition-all"
            style={{ left: `calc(${progressPercentage}% - 10px)` }}
          />
        </div>
      </div>
    )
  }
)
Slider.displayName = 'Slider'

export { Slider }
