import { useState, useEffect } from 'react'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Plus, Edit, Trash2, Search, RefreshCw, Package } from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import { categoryService } from '@/shared/api/categoryService'

interface Category {
  categoryId: number
  categoryName: string
  products?: any[]
}

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

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setCategoryName(category.categoryName)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  return (
    <ManagerLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          { }
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý danh mục</h1>
              <p className="text-gray-600">Quản lý danh mục sản phẩm để tổ chức kho</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadCategories}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Tải lại
              </Button>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                Thêm danh mục
              </Button>
            </div>
          </div>

          { }
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="md:col-span-3">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm danh mục..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          { }
          <Card>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Đang tải danh mục...</span>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không tìm thấy danh mục
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm
                      ? 'Không có danh mục phù hợp với tìm kiếm.'
                      : 'Hãy tạo danh mục đầu tiên.'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm danh mục
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">STT</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category, index) => (
                      <TableRow key={category.categoryId}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="font-medium">{category.categoryName}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(category)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(category)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
            <DialogDescription>Thêm danh mục để tổ chức sản phẩm.</DialogDescription>
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
            <Button onClick={handleCreate}>Tạo danh mục</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { }
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa danh mục</DialogTitle>
            <DialogDescription>Cập nhật tên danh mục.</DialogDescription>
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
