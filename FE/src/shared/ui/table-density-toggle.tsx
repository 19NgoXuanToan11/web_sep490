import * as React from 'react'
import { Button } from './button'
import { cn } from '@/shared/lib/utils'
import { AlignJustify, MoreHorizontal } from 'lucide-react'
import { userPreferences } from '@/shared/lib/localData/storage'

export interface TableDensityToggleProps {
  value: 'compact' | 'comfortable'
  onChange: (density: 'compact' | 'comfortable') => void
  className?: string
}

export function TableDensityToggle({ value, onChange, className }: TableDensityToggleProps) {
  const handleToggle = () => {
    const newDensity = value === 'compact' ? 'comfortable' : 'compact'
    onChange(newDensity)
    // Persist to localStorage
    userPreferences.set({ tableDensity: newDensity })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className={cn('gap-2', className)}
      title={`Chuyển sang mật độ ${value === 'compact' ? 'thoải mái' : 'gọn'}`}
    >
      {value === 'compact' ? (
        <MoreHorizontal className="h-4 w-4" />
      ) : (
        <AlignJustify className="h-4 w-4" />
      )}
      <span className="capitalize">{value === 'compact' ? 'Gọn' : 'Thoải mái'}</span>
    </Button>
  )
}

// Hook to use table density with persistence
export function useTableDensity() {
  const [density, setDensity] = React.useState<'compact' | 'comfortable'>(() => {
    return userPreferences.get().tableDensity
  })

  const updateDensity = (newDensity: 'compact' | 'comfortable') => {
    setDensity(newDensity)
    userPreferences.set({ tableDensity: newDensity })
  }

  return {
    density,
    setDensity: updateDensity,
    isCompact: density === 'compact',
    isComfortable: density === 'comfortable',
  }
}
