import React from 'react'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Badge } from '@/shared/ui/badge'
import { Search, Filter, X, RotateCcw } from 'lucide-react'
import { useProductStore } from '../store/productStore'

interface ProductFiltersProps {
  className?: string
}

export function ProductFilters({ className }: ProductFiltersProps) {
  const { filters, categories, setFilters, clearFilters, fetchCategories } = useProductStore()

  const [localSearch, setLocalSearch] = React.useState(filters.search || '')

  React.useEffect(() => {
    fetchCategories().catch(() => { })
  }, [fetchCategories])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: localSearch })
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, setFilters])

  const handleStatusChange = (status: string) => {
    setFilters({
      status: status === 'all' ? undefined : (status as 'Active' | 'Inactive'),
    })
  }

  const handleCategoryChange = (categoryId: string) => {
    setFilters({
      categoryId: categoryId === 'all' ? undefined : parseInt(categoryId),
    })
  }

  const handleSortChange = (sortBy: string) => {
    const [field, order] = sortBy.split('-')
    setFilters({
      sortBy: field as any,
      sortOrder: order as 'asc' | 'desc',
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status) count++
    if (filters.categoryId) count++
    if (filters.minPrice || filters.maxPrice) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className={`space-y-4 ${className}`}>
      { }
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          { }
          <div className="relative flex-1 min-w-0 lg:flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          { }
          <div className="flex flex-wrap lg:flex-nowrap gap-3 items-center w-full lg:flex-1 lg:justify-end">
            { }
            <div className="min-w-[140px] lg:min-w-[150px]">
              <Select
                value={filters.categoryId?.toString() || 'all'}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="h-10 text-sm w-full">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả </SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                      {category.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            { }
            <div className="min-w-[120px] lg:min-w-[130px]">
              <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-10 text-sm w-full">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="Active">Hoạt động</SelectItem>
                  <SelectItem value="Inactive">Vô hiệu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            { }
            <div className="min-w-[140px] lg:min-w-[150px]">
              <Select
                value={`${filters.sortBy || 'updatedAt'}-${filters.sortOrder || 'desc'}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="h-10 text-sm w-full">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="productName-asc">Tên A-Z</SelectItem>
                  <SelectItem value="productName-desc">Tên Z-A</SelectItem>
                  <SelectItem value="price-asc">Giá thấp → cao</SelectItem>
                  <SelectItem value="price-desc">Giá cao → thấp</SelectItem>
                  <SelectItem value="quantity-asc">Tồn kho ít</SelectItem>
                  <SelectItem value="quantity-desc">Tồn kho nhiều</SelectItem>
                  <SelectItem value="updatedAt-desc">Mới nhất</SelectItem>
                  <SelectItem value="updatedAt-asc">Cũ nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>

            { }
            <div className="flex items-center gap-2 min-w-fit flex-1 lg:flex-initial lg:justify-end">
              <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:inline">Giá:</span>
              <Input
                type="number"
                placeholder="Từ"
                value={filters.minPrice || ''}
                onChange={e =>
                  setFilters({ minPrice: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="w-24 lg:w-28 h-10 text-sm"
              />
              <span className="text-gray-400">-</span>
              <Input
                type="number"
                placeholder="Đến"
                value={filters.maxPrice || ''}
                onChange={e =>
                  setFilters({ maxPrice: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="w-24 lg:w-28 h-10 text-sm"
              />
            </div>

            { }
            <div className="flex items-center gap-2 ml-auto lg:ml-0 flex-shrink-0">
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Filter className="h-3 w-3" />
                  {activeFiltersCount}
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
                className="flex items-center gap-1 h-10 px-3 text-sm"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Xóa bộ lọc</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      { }
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Search className="h-3 w-3" />"{filters.search}"
              <button
                onClick={() => {
                  setLocalSearch('')
                  setFilters({ search: undefined })
                }}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.status && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              Trạng thái: {filters.status === 'Active' ? 'Hoạt động' : 'Vô hiệu'}
              <button
                onClick={() => setFilters({ status: undefined })}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.categoryId && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              {categories.find(c => c.categoryId === filters.categoryId)?.categoryName}
              <button
                onClick={() => setFilters({ categoryId: undefined })}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(filters.minPrice || filters.maxPrice) && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              Giá: {filters.minPrice || 0} - {filters.maxPrice || '∞'} VND
              <button
                onClick={() => setFilters({ minPrice: undefined, maxPrice: undefined })}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
