import React from 'react'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useToast } from '@/shared/ui/use-toast'
import { X, Tag, Settings, Loader2 } from 'lucide-react'
import { useInventoryStore } from '../store/inventoryStore'
import { cn } from '@/shared/lib/utils'

interface BulkActionsBarProps {
  selectedCount: number
  onClearSelection: () => void
  className?: string
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  className,
}: BulkActionsBarProps) {
  const {
    selectedProductIds,
    getCategories,
    bulkSetCategory,
    bulkUpdateThresholds,
    loadingStates,
  } = useInventoryStore()

  const { toast } = useToast()
  const [showCategoryDialog, setShowCategoryDialog] = React.useState(false)
  const [showThresholdsDialog, setShowThresholdsDialog] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState('')
  const [minThreshold, setMinThreshold] = React.useState(10)
  const [maxThreshold, setMaxThreshold] = React.useState(100)

  const categories = getCategories()
  const isCategoryLoading = loadingStates['bulk-set-category']?.isLoading
  const isThresholdsLoading = loadingStates['bulk-update-thresholds']?.isLoading

  const handleSetCategory = async () => {
    if (!selectedCategory) {
      toast({
        title: 'Cần chọn danh mục',
        description: 'Vui lòng chọn danh mục.',
        variant: 'destructive',
      })
      return
    }

    try {
      await bulkSetCategory(selectedProductIds, selectedCategory)
      toast({
        title: 'Đã cập nhật danh mục',
        description: `Đã cập nhật danh mục cho ${selectedCount} sản phẩm.`,
        variant: 'success',
      })
      setShowCategoryDialog(false)
      onClearSelection()
    } catch (error) {
      toast({
        title: 'Cập nhật thất bại',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateThresholds = async () => {
    if (maxThreshold <= minThreshold) {
      toast({
        title: 'Ngưỡng không hợp lệ',
        description: 'Ngưỡng tối đa phải lớn hơn ngưỡng tối thiểu.',
        variant: 'destructive',
      })
      return
    }

    try {
      await bulkUpdateThresholds(selectedProductIds, { minThreshold, maxThreshold })
      toast({
        title: 'Đã cập nhật ngưỡng',
        description: `Đã cập nhật ngưỡng cho ${selectedCount} sản phẩm.`,
        variant: 'success',
      })
      setShowThresholdsDialog(false)
      onClearSelection()
    } catch (error) {
      toast({
        title: 'Cập nhật thất bại',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{selectedCount} mặt hàng được chọn</span>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCategoryDialog(true)}>
            <Tag className="h-4 w-4 mr-2" />
            Đặt danh mục
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowThresholdsDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Cập nhật ngưỡng
          </Button>
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đặt danh mục cho {selectedCount} sản phẩm</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Chọn danh mục</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleSetCategory} disabled={isCategoryLoading || !selectedCategory}>
              {isCategoryLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cập nhật danh mục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Thresholds Dialog */}
      <Dialog open={showThresholdsDialog} onOpenChange={setShowThresholdsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật ngưỡng cho {selectedCount} sản phẩm</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngưỡng tối thiểu</Label>
                <Input
                  type="number"
                  min="0"
                  value={minThreshold}
                  onChange={e => setMinThreshold(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ngưỡng tối đa</Label>
                <Input
                  type="number"
                  min="1"
                  value={maxThreshold}
                  onChange={e => setMaxThreshold(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowThresholdsDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateThresholds} disabled={isThresholdsLoading}>
              {isThresholdsLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cập nhật ngưỡng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
