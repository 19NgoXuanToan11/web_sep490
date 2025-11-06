import { create } from 'zustand'
import type { TimeRange, LoadingState } from '@/shared/lib/localData'
import { simulateLatency } from '@/shared/lib/localData/storage'

interface ReportSummary {
  kpis: {
    revenue: number
    orders: number
    customers: number
    growth: number
    efficiencyIndex: number
    batches: number
  }
  timeseries: Array<{ date: string; efficiency: number; [key: string]: any }>
  productionVsSales: Array<{ month: string; production: number; sales: number; [key: string]: any }>
}

interface ReportsState {
  timeRange: TimeRange
  reportData: ReportSummary
  loadingStates: Record<string, LoadingState>

  setTimeRange: (range: TimeRange) => void
  loadReportData: () => Promise<void>
  exportReportCSV: () => void
  setLoadingState: (key: string, state: LoadingState) => void
}

const mockReportData: ReportSummary = {
  kpis: {
    revenue: 50000,
    orders: 120,
    customers: 45,
    growth: 12.5,
    efficiencyIndex: 88.5,
    batches: 156,
  },
  timeseries: [
    { date: '2024-01', efficiency: 85 },
    { date: '2024-02', efficiency: 88 },
    { date: '2024-03', efficiency: 92 },
  ],
  productionVsSales: [
    { month: 'Jan', production: 1000, sales: 950 },
    { month: 'Feb', production: 1100, sales: 1050 },
    { month: 'Mar', production: 1200, sales: 1150 },
  ],
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  timeRange: 'last30',
  reportData: mockReportData,
  loadingStates: {},

  setTimeRange: (range: TimeRange) => {
    set({ timeRange: range })

    get().loadReportData()
  },

  loadReportData: async () => {
    const key = 'load-reports'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(800, 1500)

      const { timeRange } = get()
      let filteredData = { ...mockReportData }

      if (timeRange === 'last7') {
        filteredData = {
          ...mockReportData,
          kpis: {
            ...mockReportData.kpis,
            revenue: 8750.21,
            orders: 89,
            efficiencyIndex: 91.2,
            batches: 42,
          },
          timeseries: mockReportData.timeseries.slice(-1),
          productionVsSales: mockReportData.productionVsSales.slice(-1),
        }
      } else if (timeRange === 'last90') {
        filteredData = {
          ...mockReportData,
          kpis: {
            ...mockReportData.kpis,
            revenue: 89750.84,
            orders: 1248,
            efficiencyIndex: 84.1,
            batches: 512,
          },
        }
      }

      set({ reportData: filteredData })
      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load report data',
      })
    }
  },

  exportReportCSV: () => {
    const { reportData } = get()

    const efficiencyData = reportData.timeseries.map((item: any) => ({
      Date: new Date(item.date).toLocaleDateString(),
      'Efficiency (%)': item.efficiency,
    }))

    const productionData = reportData.productionVsSales.map((item: any) => ({
      Month: item.month,
      Production: item.production,
      Sales: item.sales,
      Difference: item.production - item.sales,
    }))

    const csvEfficiency = [
      Object.keys(efficiencyData[0] || {}).join(','),
      ...efficiencyData.map(row => Object.values(row).join(',')),
    ].join('\n')

    const csvProduction = [
      Object.keys(productionData[0] || {}).join(','),
      ...productionData.map(row => Object.values(row).join(',')),
    ].join('\n')

    const downloadCSV = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    downloadCSV(csvEfficiency, 'efficiency-report.csv')
    downloadCSV(csvProduction, 'production-report.csv')
  },

  setLoadingState: (key: string, state: LoadingState) => {
    set(currentState => ({
      loadingStates: {
        ...currentState.loadingStates,
        [key]: state,
      },
    }))
  },
}))
