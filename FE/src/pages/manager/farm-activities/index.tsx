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
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  Activity,
  CheckCircle,
  AlertTriangle,
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

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<FarmActivity | null>(null)

  const [formData, setFormData] = useState<FarmActivityRequest>({
    activityType: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  })

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

  const loadActivities = async () => {
    try {
      setLoading(true)
      const response = await farmActivityService.getAllFarmActivities()

      const activitiesData = Array.isArray(response) ? response : []
      setActivities(activitiesData)
    } catch (error) {
            setActivities([])
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách hoạt động nông trại',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = (Array.isArray(activities) ? activities : []).filter(activity => {
    if (!activity || typeof activity !== 'object') return false
    const matchesSearch =
      activity.activityType &&
      activity.activityType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter
    const matchesActivityType =
      activityTypeFilter === 'all' || activity.activityType === activityTypeFilter
    return matchesSearch && matchesStatus && matchesActivityType
  })

  const handleCreateActivity = async () => {
    try {
      if (!formData.activityType || !formData.startDate || !formData.endDate) {
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

      await farmActivityService.createFarmActivity(formData)
      toast({
        title: 'Thành công',
        description: 'Đã tạo hoạt động nông trại mới',
      })

      setCreateDialogOpen(false)
      resetForm()
      loadActivities()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description:
          'Không thể tạo hoạt động nông trại mới. Chức năng này sẽ có sau khi backend bổ sung API.',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateActivity = async () => {
    if (!editingActivity) return

    try {
      const updateData: FarmActivityUpdate = {
        activityType: formData.activityType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
      }

      await farmActivityService.updateFarmActivity(editingActivity.farmActivitiesId, updateData)
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin hoạt động nông trại',
      })

      setEditDialogOpen(false)
      setEditingActivity(null)
      resetForm()
      loadActivities()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description:
          'Không thể cập nhật hoạt động nông trại. Chức năng này sẽ có sau khi backend bổ sung API.',
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
    } catch (error) {
      toast({
        title: 'Lỗi',
        description:
          'Không thể thay đổi trạng thái hoạt động nông trại. Chức năng này sẽ có sau khi backend bổ sung API.',
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
      activityType: '',
      startDate: '',
      endDate: '',
      status: 'ACTIVE',
    })
  }

  const handleEditClick = (activity: FarmActivity) => {
    setEditingActivity(activity)
    setFormData({
      activityType: activity.activityType,
      startDate: activity.startDate.split('T')[0],
      endDate: activity.endDate.split('T')[0],
      status: activity.status,
    })
    setEditDialogOpen(true)
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
    loadActivities()
  }, [])

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
            <CardHeader>
              <CardTitle>Danh Sách Hoạt Động Nông Trại</CardTitle>
              <CardDescription>
                Quản lý thông tin chi tiết của từng hoạt động nông nghiệp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Tìm kiếm theo loại hoạt động</Label>
                  <Input
                    id="search"
                    placeholder="Nhập loại hoạt động..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Label>Loại hoạt động</Label>
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
                  <Label>Trạng thái</Label>
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

              { }
              <div className="border rounded-lg">
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleChangeStatus(activity.farmActivitiesId)}
                                title="Thay đổi trạng thái"
                              >
                                <CheckCircle className="h-4 w-4" />
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
            </CardContent>
          </Card>
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
              <Select
                value={formData.activityType}
                onValueChange={value => setFormData({ ...formData, activityType: value })}
              >
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
              <Select
                value={formData.status}
                onValueChange={value => setFormData({ ...formData, status: value })}
              >
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
              <Select
                value={formData.activityType}
                onValueChange={value => setFormData({ ...formData, activityType: value })}
              >
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
              <Select
                value={formData.status}
                onValueChange={value => setFormData({ ...formData, status: value })}
              >
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
