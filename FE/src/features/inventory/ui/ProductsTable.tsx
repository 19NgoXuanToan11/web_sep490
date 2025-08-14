import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { TableDensityToggle } from '@/shared/ui/table-density-toggle'
import { useToast } from '@/shared/ui/use-toast'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useInventoryStore } from '../store/inventoryStore'
import type { Product } from '@/shared/lib/localData'
import { formatDate } from '@/shared/lib/localData/storage'
import { ProductDrawer } from './ProductDrawer'
import { BulkActionsBar } from './BulkActionsBar'

interface ProductsTableProps {
  className?: string
}

export function ProductsTable({ className }: ProductsTableProps) {
  const {
    searchState,
    categoryFilter,
    tableDensity,
    selectedProductIds,
    paginationState,
    getPaginatedProducts,
    getCategories,
    getTotalCount,
    setSearch,
    setSort,
    setCategoryFilter,
    setTableDensity,
    toggleProductSelection,
    selectAllProducts,
    clearSelection,
    setPagination,
    deleteProduct,
    loadingStates,
  } = useInventoryStore()

  const { toast } = useToast()
  const [showProductDrawer, setShowProductDrawer] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)

  const products = getPaginatedProducts()
  const categories = getCategories()
  const isCompact = tableDensity === 'compact'
  const hasSelection = selectedProductIds.length > 0

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id)
      toast({
        title: 'Product Deleted',
        description: `${product.name} has been deleted.`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowProductDrawer(true)
  }

  const handleCloseDrawer = () => {
    setShowProductDrawer(false)
    setEditingProduct(null)
  }

  const handleSort = (column: string) => {
    const newOrder =
      searchState.sortBy === column && searchState.sortOrder === 'asc' ? 'desc' : 'asc'
    setSort(column, newOrder)
  }

  const totalCount = getTotalCount()
  const totalPages = Math.ceil(totalCount / paginationState.pageSize)
  const startItem = (paginationState.page - 1) * paginationState.pageSize + 1
  const endItem = Math.min(paginationState.page * paginationState.pageSize, totalCount)

  return (
    <div className={className}>
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchState.query}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={categoryFilter || '__all__'} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <TableDensityToggle value={tableDensity} onChange={setTableDensity} />
          <Button onClick={() => setShowProductDrawer(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {hasSelection && (
        <BulkActionsBar
          selectedCount={selectedProductIds.length}
          onClearSelection={clearSelection}
          className="mb-4"
        />
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={products.length > 0 && selectedProductIds.length === products.length}
                  onChange={() =>
                    selectedProductIds.length === products.length
                      ? clearSelection()
                      : selectAllProducts()
                  }
                  className="rounded"
                />
              </TableHead>
              <TableHead className="w-16"></TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Name
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>SKU</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-2">
                  Category
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('updatedAt')}
              >
                <div className="flex items-center gap-2">
                  Updated
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => {
              const isSelected = selectedProductIds.includes(product.id)
              const isDeleting = loadingStates[`delete-product-${product.id}`]?.isLoading

              return (
                <TableRow
                  key={product.id}
                  className={`${isCompact ? 'h-12' : 'h-16'} ${isSelected ? 'bg-muted/50' : ''}`}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProductSelection(product.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">IMG</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.sku}</Badge>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(product.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        disabled={isDeleting}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startItem}-{endItem} of {totalCount} products
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(paginationState.page - 1)}
              disabled={paginationState.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {paginationState.page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(paginationState.page + 1)}
              disabled={paginationState.page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Product Drawer */}
      <ProductDrawer
        open={showProductDrawer}
        onOpenChange={setShowProductDrawer}
        editingProduct={editingProduct}
        onClose={handleCloseDrawer}
      />
    </div>
  )
}
