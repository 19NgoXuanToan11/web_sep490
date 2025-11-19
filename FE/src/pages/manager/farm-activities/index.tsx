import { useState, useEffect, useCallback } from 'react'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent } from '@/shared/ui/card'
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
import { Checkbox } from '@/shared/ui/checkbox'
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/shared/ui/use-toast'
import {
  farmActivityService,
  type FarmActivity,
  type FarmActivityRequest,
  type FarmActivityUpdate,
} from '@/shared/api/farmActivityService'

export default function FarmActivitiesPage() {
  const [activities, setActivities] = useState<FarmActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')
  const [useActiveFilter, setUseActiveFilter] = useState(false)

  // Pagination state
  const [pageIndex, setPageIndex] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<FarmActivity | null>(null)

  const [formData, setFormData] = useState<FarmActivityRequest>({
    startDate: '',
    endDate: '',
  })
  const [formActivityType, setFormActivityType] = useState<string>('')
  const [formStatus, setFormStatus] = useState<string>('ACTIVE')

  const { toast } = useToast()

  const activityTypes = [
    { value: 'SOWING', label: 'Gieo trồng' },
    { value: 'WATERING', label: 'Tưới nước' },
    { value: 'FERTILIZING', label: 'Bón phân' },
    { value: 'HARVESTING', label: 'Thu hoạch' },
    { value: 'PRUNING', label: 'Tỉa cành' },
    { value: 'PEST_CONTROL', label: 'Phòng trừ sâu bệnh' },
    { value: 'SOIL_PREPARATION', label: 'Chuẩn bị đất' },
    { value: 'MAINTENANCE', label: 'Bảo trì' },
  ]

  const statusOptions = [
    { value: 'ACTIVE', label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
    { value: 'COMPLETED', label: 'Hoàn thành', color: 'bg-blue-100 text-blue-800' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
    { value: 'PENDING', label: 'Chờ thực hiện', color: 'bg-yellow-100 text-yellow-800' },
  ]

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true)
      let response

      if (useActiveFilter) {
        // Use get-active endpoint when filtering for active activities
        response = await farmActivityService.getActiveFarmActivities(0, pageIndex, pageSize)
      } else {
        // Use get-all with filters
        const params: any = {
          pageIndex,
          pageSize,
        }
        if (activityTypeFilter !== 'all') {
          params.type = activityTypeFilter
        }
        if (statusFilter !== 'all') {
          params.status = statusFilter
        }
        response = await farmActivityService.getAllFarmActivities(params)
      }

      setActivities(response.items || [])
      setTotalItems(response.totalItemCount || 0)
      setTotalPages(response.totalPagesCount || 1)
    } catch (error: any) {
      setActivities([])
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể tải danh sách hoạt động nông trại',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, statusFilter, activityTypeFilter, useActiveFilter, toast])

  // Client-side filtering for search term only (since pagination is server-side)
  const filteredActivities = (Array.isArray(activities) ? activities : []).filter(activity => {
    if (!activity || typeof activity !== 'object') return false
    const matchesSearch =
      !searchTerm ||
      (activity.activityType &&
        activity.activityType.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  const handleCreateActivity = async () => {
    try {
      if (!formActivityType || !formData.startDate || !formData.endDate) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
          variant: 'destructive',
        })
        return
      }

      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        toast({
          title: 'Lỗi',
          description: 'Ngày bắt đầu không thể sau ngày kết thúc',
          variant: 'destructive',
        })
        return
      }

      await farmActivityService.createFarmActivity(formData, formActivityType)
      toast({
        title: 'Thành công',
        description: 'Đã tạo hoạt động nông trại mới',
      })

      setCreateDialogOpen(false)
      resetForm()
      loadActivities()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể tạo hoạt động nông trại mới',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateActivity = async () => {
    if (!editingActivity) return

    try {
      if (!formActivityType || !formData.startDate || !formData.endDate) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
          variant: 'destructive',
        })
        return
      }

      const updateData: FarmActivityUpdate = {
        startDate: formData.startDate,
        endDate: formData.endDate,
      }

      await farmActivityService.updateFarmActivity(
        editingActivity.farmActivitiesId,
        updateData,
        formActivityType,
        formStatus
      )
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin hoạt động nông trại',
      })

      setEditDialogOpen(false)
      setEditingActivity(null)
      resetForm()
      loadActivities()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể cập nhật hoạt động nông trại',
        variant: 'destructive',
      })
    }
  }

  const handleChangeStatus = async (activityId: number) => {
    try {
      await farmActivityService.changeStatus(activityId)
      toast({
        title: 'Thành công',
        description: 'Đã thay đổi trạng thái hoạt động nông trại',
      })
      loadActivities()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể thay đổi trạng thái hoạt động nông trại',
        variant: 'destructive',
      })
    }
  }

  const handleCompleteActivity = async (activityId: number) => {
    try {
      await farmActivityService.completeFarmActivity(activityId)
      toast({
        title: 'Thành công',
        description: 'Đã đánh dấu hoạt động là hoàn thành',
      })
      loadActivities()
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể đánh dấu hoạt động là hoàn thành',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hoạt động này không?')) return

    try {
      await farmActivityService.deleteFarmActivity(activityId)
      toast({
        title: 'Thành công',
        description: 'Đã xóa hoạt động nông trại',
      })
      loadActivities()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description:
          'Không thể xóa hoạt động nông trại. Chức năng này sẽ có sau khi backend bổ sung API.',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      startDate: '',
      endDate: '',
    })
    setFormActivityType('')
    setFormStatus('ACTIVE')
  }

  const handleEditClick = async (activity: FarmActivity) => {
    try {
      setLoading(true)
      // Fetch full details using get-by-id
      const fullActivity = await farmActivityService.getFarmActivityById(activity.farmActivitiesId)
      setEditingActivity(fullActivity)
      setFormData({
        startDate: fullActivity.startDate.split('T')[0],
        endDate: fullActivity.endDate.split('T')[0],
      })
      setFormActivityType(fullActivity.activityType)
      setFormStatus(fullActivity.status)
      setEditDialogOpen(true)
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể tải thông tin chi tiết hoạt động',
        variant: 'destructive',
      })
      // Fallback to using the activity from the list
      setEditingActivity(activity)
      setFormData({
        startDate: activity.startDate.split('T')[0],
        endDate: activity.endDate.split('T')[0],
      })
      setFormActivityType(activity.activityType)
      setFormStatus(activity.status)
      setEditDialogOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getActivityTypeLabel = (type: string) => {
    const activityType = activityTypes.find(at => at.value === type)
    return activityType ? activityType.label : type
  }

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status)
    if (!statusOption) return <Badge variant="outline">{status}</Badge>

    return <Badge className={statusOption.color}>{statusOption.label}</Badge>
  }

  useEffect(() => {
    setPageIndex(1) // Reset to first page when filters change
  }, [statusFilter, activityTypeFilter, useActiveFilter])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPageIndex(newPage)
    }
  }

  return (
    <ManagerLayout>
      <div className="p-6">
        <div className="space-y-8">
          { }
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Hoạt Động Nông Trại</h1>
            <p className="text-gray-600 mt-2">
              Quản lý các hoạt động nông nghiệp, lập kế hoạch và theo dõi tiến độ thực hiện.
            </p>
          </div>

          { }
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    id="search"
                    placeholder="Nhập loại hoạt động..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả loại</SelectItem>
                      {activityTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="activeFilter"
                    checked={useActiveFilter && statusFilter === 'ACTIVE'}
                    onCheckedChange={checked => {
                      setUseActiveFilter(checked as boolean)
                      if (checked) {
                        setStatusFilter('ACTIVE')
                      }
                    }}
                  />
                  <Label htmlFor="activeFilter" className="text-sm cursor-pointer">
                    Chỉ hiển thị hoạt động đang hoạt động
                  </Label>
                </div>
                <div className="flex gap-2 items-end">
                  <Button onClick={loadActivities} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm mới
                  </Button>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm hoạt động
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          { }
          <div className="border rounded-lg bg-white mt-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Loại hoạt động</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Ngày kết thúc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Không có hoạt động nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map(activity => (
                    <TableRow key={activity.farmActivitiesId}>
                      <TableCell className="font-medium">
                        #{activity.farmActivitiesId}
                      </TableCell>
                      <TableCell>{getActivityTypeLabel(activity.activityType)}</TableCell>
                      <TableCell>{formatDate(activity.startDate)}</TableCell>
                      <TableCell>{formatDate(activity.endDate)}</TableCell>
                      <TableCell>{getStatusBadge(activity.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(activity)}
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {activity.status !== 'COMPLETED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCompleteActivity(activity.farmActivitiesId)}
                              title="Hoàn thành"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangeStatus(activity.farmActivitiesId)}
                            title="Thay đổi trạng thái"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteActivity(activity.farmActivitiesId)}
                            title="Xóa"
                            className="text-red-600 hover:text-red-700"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-sm text-gray-600">
                Hiển thị {((pageIndex - 1) * pageSize) + 1} - {Math.min(pageIndex * pageSize, totalItems)} trong tổng số {totalItems} hoạt động
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pageIndex - 1)}
                  disabled={pageIndex === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pageIndex <= 3) {
                      pageNum = i + 1
                    } else if (pageIndex >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = pageIndex - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageIndex === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pageIndex + 1)}
                  disabled={pageIndex === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Số lượng mỗi trang:</Label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={value => {
                    setPageSize(Number(value))
                    setPageIndex(1)
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      { }
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm Hoạt Động Nông Trại Mới</DialogTitle>
            <DialogDescription>Điền thông tin để tạo hoạt động nông trại mới</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="activityType">Loại hoạt động *</Label>
              <Select value={formActivityType} onValueChange={setFormActivityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại hoạt động" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Ngày bắt đầu *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Ngày kết thúc *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateActivity}>Tạo hoạt động</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { }
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Hoạt Động Nông Trại</DialogTitle>
            <DialogDescription>Cập nhật thông tin hoạt động nông trại</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editActivityType">Loại hoạt động *</Label>
              <Select value={formActivityType} onValueChange={setFormActivityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại hoạt động" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editStartDate">Ngày bắt đầu *</Label>
              <Input
                id="editStartDate"
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editEndDate">Ngày kết thúc *</Label>
              <Input
                id="editEndDate"
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editStatus">Trạng thái</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateActivity}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  )
}
