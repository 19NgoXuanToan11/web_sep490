import { create } from 'zustand'
import type { ReportSummary, TimeRange, LoadingState } from '@/shared/lib/localData'
import { reportSummary } from '@/shared/lib/localData/fixtures'
import { simulateLatency, userPreferences, exportToCSV } from '@/shared/lib/localData/storage'

interface ReportsState {
  timeRange: TimeRange
  reportData: ReportSummary
  loadingStates: Record<string, LoadingState>

  setTimeRange: (range: TimeRange) => void
  loadReportData: () => Promise<void>
  exportReportCSV: () => void
  setLoadingState: (key: string, state: LoadingState) => void
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  timeRange: 'last30',
  reportData: reportSummary,
  loadingStates: {},

  setTimeRange: (range: TimeRange) => {
    set({ timeRange: range })
    userPreferences.set({ reportsTimeRange: range })
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
      let filteredData = { ...reportSummary }

      // Simulate different data for different time ranges
      if (timeRange === 'last7') {
        filteredData = {
          ...reportSummary,
          kpis: {
            ...reportSummary.kpis,
            efficiencyIndex: 91.2,
            batches: 42,
            revenue: 8750.21,
            orders: 89,
          },
          timeseries: reportSummary.timeseries.slice(-7),
          productionVsSales: reportSummary.productionVsSales.slice(-2),
        }
      } else if (timeRange === 'last90') {
        filteredData = {
          ...reportSummary,
          kpis: {
            ...reportSummary.kpis,
            efficiencyIndex: 84.1,
            batches: 512,
            revenue: 89750.84,
            orders: 1248,
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
    const efficiencyData = reportData.timeseries.map(item => ({
      Date: new Date(item.date).toLocaleDateString(),
      'Efficiency (%)': item.efficiency,
    }))

    exportToCSV(
      efficiencyData,
      `efficiency-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
    )

    // Export production vs sales data
    const productionData = reportData.productionVsSales.map(item => ({
      Period: item.period,
      Production: item.production,
      Sales: item.sales,
      Difference: item.production - item.sales,
    }))

    exportToCSV(
      productionData,
      `production-sales-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
    )
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
