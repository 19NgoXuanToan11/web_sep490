import React, { useEffect, useState, useCallback } from 'react'
import {
    MessageSquare,
    Star,
    RefreshCw,
    Search,
    CheckCircle,
    XCircle,
    Loader2,
    Image as ImageIcon,
    MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { StaffDataTable, type StaffDataTableColumn } from '@/shared/ui/staff-data-table'
import { formatDate } from '@/shared/lib/date-utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { useToast } from '@/shared/ui/use-toast'
import { feedbackService, type Feedback } from '@/shared/api/feedbackService'
import { ManagementPageHeader } from '@/shared/ui/management-page-header'

const formatPrice = (price?: number) => {
    if (price == null) return '0'

    // Hiển thị theo dạng 10,000 (không phần thập phân)
    return price.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })
}

const StaffFeedbacksPage: React.FC = () => {
    const { toast } = useToast()
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
    const [loading, setLoading] = useState(true)
    const [totalItems, setTotalItems] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10

    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [ratingFilter, setRatingFilter] = useState<string>('all')
    const [isRefreshing, setIsRefreshing] = useState(false)

    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
    const [updatingStatus, setUpdatingStatus] = useState(false)

    const fetchFeedbacks = useCallback(async (page: number = 1) => {
        try {
            setLoading(true)
            const response = await feedbackService.getFeedbackList({
                pageIndex: page,
                pageSize,
            })

            setFeedbacks(response.items || [])
            setTotalItems(response.totalItemCount || 0)
            setCurrentPage(response.pageIndex || 1)
        } catch (error) {
            toast({
                title: 'Lỗi tải dữ liệu',
                description: 'Không thể tải danh sách đánh giá. Vui lòng thử lại.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }, [pageSize, toast])

    useEffect(() => {
        fetchFeedbacks(currentPage)
    }, [fetchFeedbacks, currentPage])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchFeedbacks(currentPage)
        setIsRefreshing(false)
        toast({
            title: 'Đã làm mới',
            description: 'Dữ liệu đã được cập nhật.',
        })
    }

    const filteredFeedbacks = feedbacks.filter(feedback => {
        if (statusFilter !== 'all' && feedback.status !== statusFilter) {
            return false
        }

        if (ratingFilter !== 'all') {
            const rating = parseInt(ratingFilter)
            if (feedback.rating !== rating) {
                return false
            }
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return (
                feedback.comment?.toLowerCase().includes(query) ||
                feedback.fullName?.toLowerCase().includes(query) ||
                feedback.email?.toLowerCase().includes(query) ||
                feedback.orderDetail?.productName?.toLowerCase().includes(query)
            )
        }

        return true
    })

    const handleViewDetail = (feedback: Feedback) => {
        setSelectedFeedback(feedback)
        setIsDetailOpen(true)
    }

    const handleUpdateStatus = async (feedbackId: number) => {
        try {
            setUpdatingStatus(true)
            await feedbackService.updateFeedbackStatus(feedbackId)

            toast({
                title: 'Thành công',
                description: 'Đã cập nhật trạng thái đánh giá.',
            })

            await fetchFeedbacks(currentPage)

            if (selectedFeedback && selectedFeedback.feedbackId === feedbackId) {
                const updatedFeedback = feedbacks.find(f => f.feedbackId === feedbackId)
                if (updatedFeedback) {
                    setSelectedFeedback({
                        ...updatedFeedback,
                        status: updatedFeedback.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE'
                    })
                }
            }
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể cập nhật trạng thái. Vui lòng thử lại.',
                variant: 'destructive',
            })
        } finally {
            setUpdatingStatus(false)
        }
    }

    const getRatingStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
            />
        ))
    }

    const getStatusBadge = (status: string) => {
        if (status === 'ACTIVE') {
            return (
                <Badge variant="default" className="whitespace-nowrap inline-flex items-center">
                    Hiển thị
                </Badge>
            )
        }
        return (
            <Badge variant="secondary" className="whitespace-nowrap inline-flex items-center">
                Ẩn
            </Badge>
        )
    }

    const stats = {
        total: feedbacks.length,
        active: feedbacks.filter(f => f.status === 'ACTIVE').length,
        inactive: feedbacks.filter(f => f.status === 'DEACTIVATED').length,
        avgRating: feedbacks.length > 0
            ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
            : '0.0',
    }

    const totalPages = Math.ceil(totalItems / pageSize)

    return (
        <StaffLayout>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ManagementPageHeader
                    className="mb-8"
                    title="Quản lý đánh giá"
                    description="Xem và quản lý đánh giá từ khách hàng về sản phẩm"
                    actions={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                    }
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Tổng đánh giá</p>
                                    <p className="text-2xl font-semibold mt-1">{stats.total}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Tất cả đánh giá mà khách hàng đã gửi
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Đang hiển thị</p>
                                    <p className="text-2xl font-semibold mt-1 text-green-600">
                                        {stats.active}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Đánh giá đang được hiển thị trên giao diện khách hàng
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Điểm trung bình</p>
                                    <p className="text-2xl font-semibold mt-1 text-yellow-500">
                                        {stats.avgRating}{' '}
                                        <span className="text-base align-middle">⭐</span>
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Mức độ hài lòng trung bình của khách hàng
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm theo tên, email, sản phẩm, nội dung..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="ACTIVE">Hiển thị</SelectItem>
                                    <SelectItem value="DEACTIVATED">Ẩn</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={ratingFilter} onValueChange={setRatingFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Đánh giá" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="5">⭐⭐⭐⭐⭐ 5 sao</SelectItem>
                                    <SelectItem value="4">⭐⭐⭐⭐ 4 sao</SelectItem>
                                    <SelectItem value="3">⭐⭐⭐ 3 sao</SelectItem>
                                    <SelectItem value="2">⭐⭐ 2 sao</SelectItem>
                                    <SelectItem value="1">⭐ 1 sao</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                            </div>
                        ) : filteredFeedbacks.length === 0 ? (
                            <div className="text-center py-12">
                                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">Không tìm thấy đánh giá nào</p>
                            </div>
                        ) : (
                            <div>
                                <StaffDataTable<Feedback>
                                    data={filteredFeedbacks}
                                    getRowKey={feedback => feedback.feedbackId}
                                    currentPage={currentPage}
                                    pageSize={pageSize}
                                    totalPages={totalPages}
                                    onPageChange={page => setCurrentPage(page)}
                                    emptyTitle="Không có đánh giá"
                                    emptyDescription="Không tìm thấy đánh giá nào phù hợp điều kiện lọc."
                                    columns={[
                                        {
                                            id: 'customer',
                                            header: 'Khách hàng',
                                            render: feedback => (
                                                <div>
                                                    <p className="font-medium text-gray-900">{feedback.fullName}</p>
                                                    <p className="text-sm text-gray-500">{feedback.email}</p>
                                                </div>
                                            ),
                                        },
                                        {
                                            id: 'product',
                                            header: 'Sản phẩm',
                                            render: feedback => (
                                                <p className="font-medium text-gray-900">
                                                    {feedback.orderDetail?.productName || 'N/A'}
                                                </p>
                                            ),
                                        },
                                        {
                                            id: 'rating',
                                            header: 'Đánh giá',
                                            cellClassName: 'w-32',
                                            render: feedback => (
                                                <div className="flex items-center space-x-1">
                                                    {getRatingStars(feedback.rating || 0)}
                                                </div>
                                            ),
                                        },
                                        {
                                            id: 'comment',
                                            header: 'Nội dung',
                                            render: feedback => (
                                                <p className="text-sm text-gray-900 max-w-xs truncate">
                                                    {feedback.comment || 'Không có nội dung'}
                                                </p>
                                            ),
                                        },
                                        {
                                            id: 'date',
                                            header: 'Ngày đánh giá',
                                            render: feedback => (
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(feedback.createdAt)}
                                                </p>
                                            ),
                                        },
                                        {
                                            id: 'status',
                                            header: 'Trạng thái',
                                            cellClassName: 'whitespace-nowrap',
                                            render: feedback => getStatusBadge(feedback.status),
                                        },
                                        {
                                            id: 'actions',
                                            header: '',
                                            cellClassName: 'text-right',
                                            render: feedback => (
                                                <DropdownMenu
                                                    modal={false}
                                                    onOpenChange={open => {
                                                        if (!open) {
                                                            setTimeout(() => {
                                                            }, 0)
                                                        }
                                                    }}
                                                >
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48" sideOffset={5}>
                                                        <DropdownMenuItem
                                                            onClick={e => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                setTimeout(() => {
                                                                    handleViewDetail(feedback)
                                                                }, 0)
                                                            }}
                                                            className="cursor-pointer focus:bg-gray-100"
                                                        >
                                                            Xem chi tiết
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ),
                                        },
                                    ] satisfies StaffDataTableColumn<Feedback>[]}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            Chi tiết đánh giá
                        </DialogTitle>
                        <DialogDescription>
                            Thông tin chi tiết về đánh giá từ khách hàng
                        </DialogDescription>
                    </DialogHeader>

                    {selectedFeedback && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Thông tin khách hàng</h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Họ tên:</span>
                                        <span className="text-sm font-medium">{selectedFeedback.fullName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Email:</span>
                                        <span className="text-sm font-medium">{selectedFeedback.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Ngày đánh giá:</span>
                                        <span className="text-sm font-medium">
                                            {formatDate(selectedFeedback.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Thông tin sản phẩm</h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                    {selectedFeedback.orderDetail?.images ? (
                                        <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                                            <img
                                                src={selectedFeedback.orderDetail.images}
                                                alt={selectedFeedback.orderDetail?.productName || 'Product'}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).parentElement!.innerHTML =
                                                        '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg></div>';
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                            <ImageIcon className="w-16 h-16" />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Tên sản phẩm:</span>
                                            <span className="text-sm font-medium">
                                                {selectedFeedback.orderDetail?.productName || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Đơn giá:</span>
                                            <span className="text-sm font-medium">
                                                {formatPrice(selectedFeedback.orderDetail?.unitPrice)} đ
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Đánh giá</h3>
                                <div className="flex items-center space-x-2">
                                    {getRatingStars(selectedFeedback.rating || 0)}
                                    <span className="text-lg font-bold text-gray-900">
                                        {selectedFeedback.rating}/5
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Nội dung đánh giá</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-700">
                                        {selectedFeedback.comment || 'Không có nội dung'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Trạng thái hiển thị</h3>
                                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center space-x-2">
                                        {getStatusBadge(selectedFeedback.status)}
                                        <span className="text-sm text-gray-600">
                                            {selectedFeedback.status === 'ACTIVE'
                                                ? 'Đánh giá đang được hiển thị công khai'
                                                : 'Đánh giá đang bị ẩn'}
                                        </span>
                                    </div>
                                    <Button
                                        onClick={() => handleUpdateStatus(selectedFeedback.feedbackId)}
                                        disabled={updatingStatus}
                                        size="sm"
                                        variant={selectedFeedback.status === 'ACTIVE' ? 'destructive' : 'default'}
                                    >
                                        {updatingStatus ? (
                                            <span className="inline-flex items-center">
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Đang xử lý...
                                            </span>
                                        ) : selectedFeedback.status === 'ACTIVE' ? (
                                            <span className="inline-flex items-center">
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Ẩn đánh giá
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center">
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Hiển thị đánh giá
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </StaffLayout>
    )
}

export default StaffFeedbacksPage

