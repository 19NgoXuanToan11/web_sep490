import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Search, RefreshCw, MoreHorizontal } from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import { categoryService } from '@/shared/api/categoryService'
import { ManagementPageHeader, StaffFilterBar, StaffDataTable, type StaffDataTableColumn } from '@/shared/ui'

interface Category {
  categoryId: number
  categoryName: string
  products?: any[]
}

interface CategoryActionMenuProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

const CategoryActionMenu: React.FC<CategoryActionMenuProps> = React.memo(({ category, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false)

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
    setTimeout(() => {
      onEdit(category)
    }, 0)
  }, [category, onEdit])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false) 
    setTimeout(() => {
      onDelete(category)
    }, 0)
  }, [category, onDelete])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
        sideOffset={5}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuItem
          onClick={handleEdit}
          className="cursor-pointer focus:bg-gray-100"
          onSelect={(e) => e.preventDefault()}
        >
          Chỉnh sửa 
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="cursor-pointer focus:bg-gray-100 text-red-600 focus:text-red-600"
          onSelect={(e) => e.preventDefault()}
        >
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

CategoryActionMenu.displayName = 'CategoryActionMenu'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const { toast } = useToast()

  const filteredCategories = categories.filter(category =>
    category.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = useMemo(() => {
    const total = categories.length

    const withProducts = categories.filter(c => Array.isArray(c.products) && c.products.length > 0).length

    return {
      total,
      withProducts,
      empty: Math.max(0, total - withProducts),
    }
  }, [categories])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await categoryService.getAllCategories()
      setCategories(data)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh mục',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!categoryName.trim()) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Tên danh mục là bắt buộc',
        variant: 'destructive',
      })
      return
    }

    try {
      await categoryService.createCategory(categoryName.trim())
      toast({
        title: 'Thành công',
        description: 'Đã tạo danh mục thành công',
        variant: 'success',
      })
      setIsCreateDialogOpen(false)
      setCategoryName('')
      loadCategories()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo danh mục',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = async () => {
    if (!selectedCategory || !categoryName.trim()) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Tên danh mục là bắt buộc',
        variant: 'destructive',
      })
      return
    }

    try {
      await categoryService.updateCategory(selectedCategory.categoryId, categoryName.trim())
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật danh mục thành công',
        variant: 'success',
      })
      setIsEditDialogOpen(false)
      setCategoryName('')
      setSelectedCategory(null)
      loadCategories()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật danh mục',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return

    try {
      await categoryService.deleteCategory(selectedCategory.categoryId)
      toast({
        title: 'Thành công',
        description: 'Đã xóa danh mục thành công',
        variant: 'success',
      })
      setIsDeleteDialogOpen(false)
      setSelectedCategory(null)
      loadCategories()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa danh mục. Có thể đang được sử dụng bởi sản phẩm.',
        variant: 'destructive',
      })
    }
  }

  const openEditDialog = useCallback((category: Category) => {
    setSelectedCategory(category)
    setCategoryName(category.categoryName)
    setIsEditDialogOpen(true)
  }, [])

  const openDeleteDialog = useCallback((category: Category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }, [])

  useEffect(() => {
    loadCategories()
  }, [])

  return (
    <ManagerLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          { }
          <ManagementPageHeader
            title="Quản lý danh mục"
            description="Quản lý danh mục sản phẩm để tổ chức kho"
            actions={
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={loadCategories}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  Làm mới
                </Button>
              </div>
            }
          />

          { }
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng danh mục</p>
                    <p className="text-2xl font-semibold mt-1">{stats.total}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Số lượng danh mục đang được quản lý trong hệ thống
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Có sản phẩm</p>
                    <p className="text-2xl font-semibold mt-1 text-green-600">{stats.withProducts}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Danh mục đã được gán ít nhất một sản phẩm
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Chưa có sản phẩm</p>
                    <p className="text-2xl font-semibold mt-1 text-gray-700">{stats.empty}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Phù hợp để xem xét bổ sung hoặc gộp danh mục
                </p>
              </CardContent>
            </Card>
          </div>

          { }
          <StaffFilterBar>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm danh mục..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                Tạo
              </Button>
            </div>
          </StaffFilterBar>

          { }
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                  <span className="ml-2 text-gray-600">Đang tải danh mục...</span>
                </div>
              ) : (
                <StaffDataTable<Category>
                  className="px-4 sm:px-6 pb-6"
                  data={filteredCategories}
                  getRowKey={(category) => category.categoryId}
                  currentPage={1}
                  pageSize={filteredCategories.length || 10}
                  totalPages={1}
                  emptyTitle="Không tìm thấy danh mục"
                  emptyDescription={
                    searchTerm
                      ? 'Không có danh mục phù hợp với tìm kiếm.'
                      : 'Hãy tạo danh mục đầu tiên.'
                  }
                  columns={[
                    {
                      id: 'name',
                      header: 'Danh mục',
                      render: (category) => (
                        <div className="font-medium">{category.categoryName}</div>
                      ),
                    },
                    {
                      id: 'actions',
                      header: '',
                      render: (category) => (
                        <CategoryActionMenu
                          category={category}
                          onEdit={openEditDialog}
                          onDelete={openDeleteDialog}
                        />
                      ),
                    },
                  ] satisfies StaffDataTableColumn<Category>[]}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      { }
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo danh mục mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Tên danh mục</Label>
              <Input
                id="category-name"
                placeholder="Nhập tên danh mục"
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setCategoryName('')
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleCreate}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { }
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa danh mục</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Tên danh mục</Label>
              <Input
                id="edit-category-name"
                placeholder="Nhập tên danh mục"
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEdit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setCategoryName('')
                setSelectedCategory(null)
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleEdit}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { }
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa danh mục</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa "{selectedCategory?.categoryName}"? Hành động này không thể hoàn
              tác và có thể ảnh hưởng tới sản phẩm đang dùng danh mục này.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedCategory(null)
              }}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa danh mục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  )
}
