import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Calendar,
  Activity,
  BarChart3,
} from 'lucide-react'
import { useReportsStore } from '@/features/reports/store/reportsStore'
import type { TimeRange } from '@/shared/lib/localData'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'

export default function ReportsPage() {
  const { timeRange, reportData, loadingStates, setTimeRange, loadReportData } = useReportsStore()

  React.useEffect(() => {
    loadReportData()
  }, [])

  const isLoading = loadingStates['load-reports']?.isLoading
  const error = loadingStates['load-reports']?.error

  const timeRangeOptions = {
    last7: '7 ngày qua',
    last30: '30 ngày qua',
    last90: '90 ngày qua',
  }

  if (error) {
    return (
      <ManagerLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-2 text-gray-900">Không thể tải báo cáo</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadReportData} className="bg-green-600 hover:bg-green-700">
              Thử lại
            </Button>
          </div>
        </div>
      </ManagerLayout>
    )
  }

  return (
    <ManagerLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bảng điều khiển báo cáo & phân tích
              </h1>
              <p className="text-gray-600 mt-2">
                Theo dõi hiệu suất, năng suất và các chỉ số kinh doanh.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={value => setTimeRange(value as TimeRange)}>
                <SelectTrigger className="w-48 bg-white border-gray-200 shadow-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {Object.entries(timeRangeOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <KPICard
                title="Hiệu suất tưới"
                value={isLoading ? null : `${reportData.kpis.efficiencyIndex}%`}
                icon={<Activity className="h-4 w-4" />}
                trend="+2.1%"
                isLoading={isLoading}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <KPICard
                title="Mẻ sản xuất"
                value={isLoading ? null : reportData.kpis.batches.toLocaleString()}
                icon={<Package className="h-4 w-4" />}
                trend="+8.3%"
                isLoading={isLoading}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <KPICard
                title="Doanh thu"
                value={isLoading ? null : `$${reportData.kpis.revenue.toLocaleString()}`}
                icon={<DollarSign className="h-4 w-4" />}
                trend="+12.5%"
                isLoading={isLoading}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <KPICard
                title="Đơn hàng"
                value={isLoading ? null : reportData.kpis.orders.toLocaleString()}
                icon={<ShoppingCart className="h-4 w-4" />}
                trend="+5.7%"
                isLoading={isLoading}
              />
            </div>
          </div>

          {}
          <div className="grid gap-6 lg:grid-cols-2">
            {}
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Xu hướng hiệu suất tưới
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.timeseries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={value =>
                          new Date(value).toLocaleDateString('vi-VN', {
                            month: 'short',
                            day: 'numeric',
                          })
                        }
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        labelFormatter={value => new Date(value).toLocaleDateString('vi-VN')}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Hiệu suất']}
                      />
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {}
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Sản xuất so với doanh số
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.productionVsSales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="production"
                        fill="hsl(var(--primary))"
                        name="Sản xuất"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="sales"
                        fill="hsl(var(--muted))"
                        name="Doanh số"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {}
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-gray-900">Thống kê tổng hợp</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Hiệu suất trung bình</p>
                    <p className="text-2xl font-semibold">
                      {(
                        reportData.timeseries.reduce((acc: number, item: any) => acc + item.efficiency, 0) /
                        reportData.timeseries.length
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tỉ lệ sản xuất/ doanh số</p>
                    <p className="text-2xl font-semibold">
                      {(
                        (reportData.productionVsSales.reduce(
                          (acc: number, item: any) => acc + item.production,
                          0
                        ) /
                          reportData.productionVsSales.reduce((acc: number, item: any) => acc + item.sales, 0)) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Doanh thu trên mỗi đơn</p>
                    <p className="text-2xl font-semibold">
                      ${(reportData.kpis.revenue / reportData.kpis.orders).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ManagerLayout>
  )
}

interface KPICardProps {
  title: string
  value: string | null
  icon: React.ReactNode
  trend?: string
  isLoading?: boolean
}

function KPICard({ title, value, icon, trend, isLoading }: KPICardProps) {
  return (
    <>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
          <div className="h-4 w-4 text-white flex items-center justify-center">{icon}</div>
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">
          {isLoading ? <Skeleton className="h-8 w-20" /> : value}
        </div>
        {trend && !isLoading && (
          <p className="text-xs text-green-600 flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend} so với kỳ trước
          </p>
        )}
      </div>
    </>
  )
}
