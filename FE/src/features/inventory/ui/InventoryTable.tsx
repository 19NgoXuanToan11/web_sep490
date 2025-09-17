import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { useToast } from '@/shared/ui/use-toast'
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  X,
  ArrowUpDown,
  Filter,
  Package,
} from 'lucide-react'
import { useInventoryStore } from '../store/inventoryStore'
import type { InventoryItem, Product } from '@/shared/lib/localData'
import { formatDate } from '@/shared/lib/localData/storage'

interface InventoryTableProps {
  className?: string
}

export function InventoryTable({ className }: InventoryTableProps) {
  const {
    searchState,
    tableDensity,
    lowStockFilter,
    getPaginatedInventoryItems,
    getTotalCount,
    getLowStockItems,
    setSort,
    setLowStockFilter,
    updateInventoryThresholds,
    loadingStates,
  } = useInventoryStore()

  const { toast } = useToast()
  const [editingItem, setEditingItem] = React.useState<string | null>(null)
  const [editValues, setEditValues] = React.useState<{
    minThreshold: number
    maxThreshold: number
  }>({
    minThreshold: 0,
    maxThreshold: 0,
  })

  const inventoryItems = getPaginatedInventoryItems()
  const lowStockItems = getLowStockItems()
  const isCompact = tableDensity === 'compact'

  const handleEdit = (item: InventoryItem & { product: Product }) => {
    setEditingItem(item.id)
    setEditValues({
      minThreshold: item.minThreshold,
      maxThreshold: item.maxThreshold,
    })
  }

  const handleSave = async (item: InventoryItem & { product: Product }) => {
    if (editValues.maxThreshold <= editValues.minThreshold) {
      toast({
        title: 'Ngưỡng không hợp lệ',
        description: 'Ngưỡng tối đa phải lớn hơn ngưỡng tối thiểu.',
        variant: 'destructive',
      })
      return
    }

    try {
      await updateInventoryThresholds(item.id, editValues)
      toast({
        title: 'Đã cập nhật ngưỡng',
        description: `Đã cập nhật ngưỡng cho ${item.product.name}.`,
        variant: 'success',
      })
      setEditingItem(null)
    } catch (error) {
      toast({
        title: 'Cập nhật thất bại',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setEditValues({ minThreshold: 0, maxThreshold: 0 })
  }

  const handleSort = (column: string) => {
    const newOrder =
      searchState.sortBy === column && searchState.sortOrder === 'asc' ? 'desc' : 'asc'
    setSort(column, newOrder)
  }

  const getStockStatus = (item: InventoryItem & { product: Product }) => {
    if (item.stock < item.minThreshold) {
      return { status: 'low', label: 'Hàng sắp hết', variant: 'destructive' as const }
    }
    if (item.stock > item.maxThreshold) {
      return { status: 'high', label: 'Tồn kho cao', variant: 'warning' as const }
    }
    return { status: 'normal', label: 'Bình thường', variant: 'success' as const }
  }

  return (
    <div className={className}>
      {/* Filter Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant={lowStockFilter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLowStockFilter(!lowStockFilter)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Hàng sắp hết ({lowStockItems.length})
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">{inventoryItems.length} mặt hàng</div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Package className="h-4 w-4" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Sản phẩm
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>SKU</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-2">
                  Danh mục
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 text-center"
                onClick={() => handleSort('stock')}
              >
                <div className="flex items-center justify-center gap-2">
                  Tồn kho
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-center">Min</TableHead>
              <TableHead className="text-center">Max</TableHead>
              <TableHead>Chất lượng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('updatedAt')}
              >
                <div className="flex items-center gap-2">
                  Cập nhật
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryItems.map(item => {
              const stockStatus = getStockStatus(item)
              const isEditing = editingItem === item.id
              const isUpdating = loadingStates[`update-inventory-${item.id}`]?.isLoading

              return (
                <TableRow
                  key={item.id}
                  className={`${isCompact ? 'h-12' : 'h-16'} ${stockStatus.status === 'low' ? 'bg-destructive/5' : ''}`}
                >
                  <TableCell>
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.product.sku}</Badge>
                  </TableCell>
                  <TableCell>{item.product.category}</TableCell>
                  <TableCell className="text-center font-medium">{item.stock}</TableCell>
                  <TableCell className="text-center">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editValues.minThreshold}
                        onChange={e =>
                          setEditValues(prev => ({
                            ...prev,
                            minThreshold: Number(e.target.value),
                          }))
                        }
                        className="w-16 h-8 text-center"
                        min="0"
                      />
                    ) : (
                      item.minThreshold
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editValues.maxThreshold}
                        onChange={e =>
                          setEditValues(prev => ({
                            ...prev,
                            maxThreshold: Number(e.target.value),
                          }))
                        }
                        className="w-16 h-8 text-center"
                        min="1"
                      />
                    ) : (
                      item.maxThreshold
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.qualityFlags.slice(0, 2).map((flag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {flag}
                        </Badge>
                      ))}
                      {item.qualityFlags.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{item.qualityFlags.length - 2}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={stockStatus.variant} className="text-xs">
                      {stockStatus.status === 'low' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {stockStatus.status === 'normal' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {stockStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(item.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSave(item)}
                            disabled={isUpdating}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            disabled={isUpdating}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          disabled={isUpdating}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {inventoryItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {lowStockFilter ? 'Không tìm thấy hàng sắp hết' : 'Không tìm thấy mặt hàng tồn kho'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
