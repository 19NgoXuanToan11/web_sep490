import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'
import { useToast } from '@/shared/ui/use-toast'
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
  Download,
  Calendar,
  Activity,
  BarChart3,
} from 'lucide-react'
import { useReportsStore } from '@/features/reports/store/reportsStore'
import { userPreferences } from '@/shared/lib/localData/storage'
import type { TimeRange } from '@/shared/lib/localData'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'

export default function ReportsPage() {
  const { timeRange, reportData, loadingStates, setTimeRange, loadReportData, exportReportCSV } =
    useReportsStore()
  const { toast } = useToast()

  // Initialize data and restore time range
  React.useEffect(() => {
    const prefs = userPreferences.get()
    if (prefs.reportsTimeRange && prefs.reportsTimeRange !== timeRange) {
      setTimeRange(prefs.reportsTimeRange)
    } else {
      loadReportData()
    }
  }, [])

  const isLoading = loadingStates['load-reports']?.isLoading
  const error = loadingStates['load-reports']?.error

  const handleExport = () => {
    exportReportCSV()
    toast({
      title: 'Export Started',
      description: 'Your report data will download shortly.',
      variant: 'success',
    })
  }

  const timeRangeOptions = {
    last7: 'Last 7 days',
    last30: 'Last 30 days',
    last90: 'Last 90 days',
  }

  if (error) {
    return (
      <ManagerLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-2 text-gray-900">Failed to Load Reports</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadReportData} className="bg-green-600 hover:bg-green-700">
              Try Again
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Track performance, efficiency, and business metrics across your farm operations.
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

              <Button variant="outline" onClick={handleExport} className="bg-white border-gray-200 hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <KPICard
              title="Irrigation Efficiency"
              value={isLoading ? null : `${reportData.kpis.efficiencyIndex}%`}
              icon={<Activity className="h-4 w-4" />}
              trend="+2.1%"
              isLoading={isLoading}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <KPICard
              title="Production Batches"
              value={isLoading ? null : reportData.kpis.batches.toLocaleString()}
              icon={<Package className="h-4 w-4" />}
              trend="+8.3%"
              isLoading={isLoading}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <KPICard
              title="Revenue"
              value={isLoading ? null : `$${reportData.kpis.revenue.toLocaleString()}`}
              icon={<DollarSign className="h-4 w-4" />}
              trend="+12.5%"
              isLoading={isLoading}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <KPICard
              title="Orders"
              value={isLoading ? null : reportData.kpis.orders.toLocaleString()}
              icon={<ShoppingCart className="h-4 w-4" />}
              trend="+5.7%"
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Efficiency Trend */}
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Irrigation Efficiency Trend
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
                        new Date(value).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={value => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Efficiency']}
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

          {/* Production vs Sales */}
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Production vs Sales
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
                      name="Production"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="sales"
                      fill="hsl(var(--muted))"
                      name="Sales"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-gray-900">Summary Statistics</CardTitle>
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
                  <p className="text-sm text-muted-foreground">Average Efficiency</p>
                  <p className="text-2xl font-semibold">
                    {(
                      reportData.timeseries.reduce((acc, item) => acc + item.efficiency, 0) /
                      reportData.timeseries.length
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Production vs Sales Ratio</p>
                  <p className="text-2xl font-semibold">
                    {(
                      (reportData.productionVsSales.reduce(
                        (acc, item) => acc + item.production,
                        0
                      ) /
                        reportData.productionVsSales.reduce((acc, item) => acc + item.sales, 0)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue per Order</p>
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
          <div className="h-4 w-4 text-white flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">
          {isLoading ? <Skeleton className="h-8 w-20" /> : value}
        </div>
        {trend && !isLoading && (
          <p className="text-xs text-green-600 flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend} from last period
          </p>
        )}
      </div>
    </>
  )
}
