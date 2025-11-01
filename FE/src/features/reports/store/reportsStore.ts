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
    // Reload data for new time range
    get().loadReportData()
  },

  loadReportData: async () => {
    const key = 'load-reports'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(800, 1500) // Simulate longer loading for calculations

      // In a real app, this would filter data based on timeRange
      const { timeRange } = get()
      let filteredData = { ...mockReportData }

      // Simulate different data for different time ranges
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
    const { reportData, timeRange } = get()

    // Export efficiency data
    const efficiencyData = reportData.timeseries.map((item: any) => ({
      Date: new Date(item.date).toLocaleDateString(),
      'Efficiency (%)': item.efficiency,
    }))

    console.log('Exporting efficiency data:', efficiencyData, timeRange)

    // Export production vs sales data
    const productionData = reportData.productionVsSales.map((item: any) => ({
      Month: item.month,
      Production: item.production,
      Sales: item.sales,
      Difference: item.production - item.sales,
    }))

    console.log('Exporting production data:', productionData)
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
