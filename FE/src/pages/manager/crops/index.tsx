import { useState, useEffect } from 'react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Textarea } from '@/shared/ui/textarea'
import { Plus, Edit, Trash2, Search, RefreshCw, Sprout, Calendar, AlertCircle } from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import { cropService, type Crop, type CropRequest, type CropUpdate } from '@/shared/api/cropService'

export default function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCrops, setTotalCrops] = useState(0)
  const pageSize = 10

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null)

  const [formData, setFormData] = useState<CropRequest>({
    cropName: '',
    description: '',
    quantity: 0,
    plantingDate: '',
    harvestDate: '',
  })

  const { toast } = useToast()

  const loadCrops = async () => {
    try {
      setLoading(true)
      const response = await cropService.getAllCrops(currentPage, pageSize)
      setCrops(response.items)
      setTotalCrops(response.totalItemCount)
      setTotalPages(Math.ceil(response.totalItemCount / pageSize))
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách cây trồng',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const searchCrops = async () => {
    try {
      setLoading(true)
      const response = await cropService.searchCrop(
        searchTerm || undefined,
        statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
        currentPage,
        pageSize
      )

      if (response.data && response.data.items) {
        setCrops(response.data.items)
        setTotalCrops(response.data.totalItemCount)
        setTotalPages(Math.ceil(response.data.totalItemCount / pageSize))
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tìm kiếm cây trồng',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCrop = async () => {
    try {
      if (!formData.cropName || !formData.description) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
          variant: 'destructive',
        })
        return
      }

      await cropService.createCrop(formData)
      toast({
        title: 'Thành công',
        description: 'Đã tạo cây trồng mới',
      })

      setCreateDialogOpen(false)
      resetForm()
      loadCrops()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo cây trồng mới',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateCrop = async () => {
    if (!editingCrop) return

    try {
      const updateData: CropUpdate = {
        cropName: formData.cropName,
        description: formData.description,
        quantity: formData.quantity,
        plantingDate: formData.plantingDate,
      }

      await cropService.updateCrop(editingCrop.cropId, updateData)
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin cây trồng',
      })

      setEditDialogOpen(false)
      setEditingCrop(null)
      resetForm()
      loadCrops()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật cây trồng',
        variant: 'destructive',
      })
    }
  }

  const handleChangeStatus = async (cropId: number) => {
    try {
      await cropService.changeStatus(cropId)
      toast({
        title: 'Thành công',
        description: 'Đã thay đổi trạng thái cây trồng',
      })
      loadCrops()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể thay đổi trạng thái cây trồng',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      cropName: '',
      description: '',
      quantity: 0,
      plantingDate: '',
      harvestDate: '',
    })
  }

  const handleEditClick = (crop: Crop) => {
    setEditingCrop(crop)
    setFormData({
      cropName: crop.cropName,
      description: crop.description,
      quantity: crop.quantity,
      plantingDate: crop.plantingDate,
      harvestDate: crop.harvestDate,
    })
    setEditDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  useEffect(() => {
    loadCrops()
  }, [currentPage])

  return (
    <ManagerLayout>
      <div className="p-6">
        <div className="space-y-8">
          {}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Cây Trồng</h1>
            <p className="text-gray-600 mt-2">
              Quản lý thông tin cây trồng, lên kế hoạch gieo trồng và theo dõi chu kỳ phát triển.
            </p>
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng Cây Trồng</CardTitle>
                <Sprout className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCrops}</div>
                <p className="text-xs text-muted-foreground">Đang quản lý trong hệ thống</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đang Hoạt Động</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {crops.filter(c => c.status.toLowerCase() === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">Cây trồng đang phát triển</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tạm Dừng</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {crops.filter(c => c.status.toLowerCase() === 'inactive').length}
                </div>
                <p className="text-xs text-muted-foreground">Cây trồng tạm dừng</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng Số Lượng</CardTitle>
                <Sprout className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {crops.reduce((sum, crop) => sum + (crop.quantity || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Tổng số cây trong trang trại</p>
              </CardContent>
            </Card>
          </div>

          {}
          <Card>
            <CardHeader>
              <CardTitle>Danh Sách Cây Trồng</CardTitle>
              <CardDescription>Quản lý thông tin chi tiết của từng loại cây trồng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Tìm kiếm theo tên</Label>
                  <Input
                    id="search"
                    placeholder="Nhập tên cây trồng..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Label>Trạng thái</Label>
                  <Select
                    value={statusFilter || undefined}
                    onValueChange={value => setStatusFilter(value || '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                      <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 items-end">
                  <Button onClick={searchCrops} variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Tìm kiếm
                  </Button>
                  <Button onClick={loadCrops} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm mới
                  </Button>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm cây trồng
                  </Button>
                </div>
              </div>

              {}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên cây trồng</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Ngày gieo trồng</TableHead>
                      <TableHead>Ngày thu hoạch</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    ) : crops.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Không có cây trồng nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      crops.map(crop => (
                        <TableRow key={crop.cropId}>
                          <TableCell className="font-medium">{crop.cropName}</TableCell>
                          <TableCell className="max-w-xs truncate">{crop.description}</TableCell>
                          <TableCell>{crop.quantity}</TableCell>
                          <TableCell>{formatDate(crop.plantingDate)}</TableCell>
                          <TableCell>{formatDate(crop.harvestDate)}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(crop.status)}>
                              {crop.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(crop)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleChangeStatus(crop.cropId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>
                  <span className="text-sm text-gray-600">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm Cây Trồng Mới</DialogTitle>
            <DialogDescription>Điền thông tin để tạo cây trồng mới</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cropName">Tên cây trồng *</Label>
              <Input
                id="cropName"
                value={formData.cropName}
                onChange={e => setFormData({ ...formData, cropName: e.target.value })}
                placeholder="Nhập tên cây trồng"
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập mô tả cây trồng"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="quantity">Số lượng</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={e =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                }
                placeholder="Nhập số lượng"
              />
            </div>
            <div>
              <Label htmlFor="plantingDate">Ngày gieo trồng</Label>
              <Input
                id="plantingDate"
                type="date"
                value={formData.plantingDate}
                onChange={e => setFormData({ ...formData, plantingDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="harvestDate">Ngày thu hoạch dự kiến</Label>
              <Input
                id="harvestDate"
                type="date"
                value={formData.harvestDate}
                onChange={e => setFormData({ ...formData, harvestDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateCrop}>Tạo cây trồng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Cây Trồng</DialogTitle>
            <DialogDescription>Cập nhật thông tin cây trồng</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCropName">Tên cây trồng *</Label>
              <Input
                id="editCropName"
                value={formData.cropName}
                onChange={e => setFormData({ ...formData, cropName: e.target.value })}
                placeholder="Nhập tên cây trồng"
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Mô tả *</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập mô tả cây trồng"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="editQuantity">Số lượng</Label>
              <Input
                id="editQuantity"
                type="number"
                value={formData.quantity}
                onChange={e =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                }
                placeholder="Nhập số lượng"
              />
            </div>
            <div>
              <Label htmlFor="editPlantingDate">Ngày gieo trồng</Label>
              <Input
                id="editPlantingDate"
                type="date"
                value={formData.plantingDate}
                onChange={e => setFormData({ ...formData, plantingDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateCrop}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  )
}
