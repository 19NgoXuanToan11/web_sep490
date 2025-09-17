import { create } from 'zustand'
import type {
  Product,
  InventoryItem,
  LoadingState,
  SearchState,
  PaginationState,
  TableDensity,
} from '@/shared/lib/localData'
import {
  products as initialProducts,
  inventoryItems as initialInventoryItems,
} from '@/shared/lib/localData/fixtures'
import { simulateLatency, simulateError, userPreferences } from '@/shared/lib/localData/storage'
import type { ProductFormData, InventoryThresholdData } from '../model/schemas'

interface InventoryState {
  // Data
  products: Product[]
  inventoryItems: InventoryItem[]

  // UI State
  selectedTab: 'products' | 'inventory'
  loadingStates: Record<string, LoadingState>
  searchState: SearchState
  paginationState: PaginationState
  tableDensity: TableDensity
  selectedProductIds: string[]

  // Filters
  categoryFilter: string
  lowStockFilter: boolean

  // Actions
  initializeData: () => void

  // Product actions
  createProduct: (data: ProductFormData) => Promise<void>
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>

  // Inventory actions
  updateInventoryThresholds: (id: string, data: InventoryThresholdData) => Promise<void>
  bulkUpdateThresholds: (productIds: string[], data: InventoryThresholdData) => Promise<void>
  bulkSetCategory: (productIds: string[], category: string) => Promise<void>

  // Search and filter actions
  setSearch: (query: string) => void
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  setCategoryFilter: (category: string) => void
  setLowStockFilter: (enabled: boolean) => void
  setPagination: (page: number, pageSize?: number) => void

  // Selection actions
  toggleProductSelection: (productId: string) => void
  selectAllProducts: () => void
  clearSelection: () => void

  // UI actions
  setSelectedTab: (tab: 'products' | 'inventory') => void
  setTableDensity: (density: TableDensity) => void
  setLoadingState: (key: string, state: LoadingState) => void

  // Computed getters
  getFilteredProducts: () => Product[]
  getFilteredInventoryItems: () => (InventoryItem & { product: Product })[]
  getPaginatedProducts: () => Product[]
  getPaginatedInventoryItems: () => (InventoryItem & { product: Product })[]
  getTotalCount: () => number
  getLowStockItems: () => (InventoryItem & { product: Product })[]
  getCategories: () => string[]
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  // Initial state
  products: [],
  inventoryItems: [],
  selectedTab: 'products',
  loadingStates: {},
  searchState: {
    query: '',
    sortBy: 'name',
    sortOrder: 'asc',
  },
  paginationState: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  tableDensity: 'comfortable',
  selectedProductIds: [],
  categoryFilter: '',
  lowStockFilter: false,

  // Initialize data from fixtures
  initializeData: () => {
    const prefs = userPreferences.get()

    set({
      products: [...initialProducts],
      inventoryItems: [...initialInventoryItems],
      selectedTab: (prefs.lastSelectedTab?.inventory as 'products' | 'inventory') || 'products',
      tableDensity: prefs.tableDensity,
    })
  },

  // Product actions
  createProduct: async (data: ProductFormData) => {
    const key = 'create-product'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(400, 800)

      if (simulateError(0.1)) {
        throw new Error('Failed to create product. Please try again.')
      }

      // Check for SKU uniqueness
      const { products } = get()
      if (products.some(p => p.sku.toLowerCase() === data.sku.toLowerCase())) {
        throw new Error('SKU already exists. Please use a unique SKU.')
      }

      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        sku: data.sku,
        name: data.name,
        category: data.category,
        price: data.price,
        imageUrl: data.imageFile ? URL.createObjectURL(data.imageFile) : undefined,
        updatedAt: new Date().toISOString(),
      }

      // Create corresponding inventory item
      const newInventoryItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        productId: newProduct.id,
        stock: 0,
        minThreshold: 10,
        maxThreshold: 100,
        qualityFlags: ['Fresh'],
        updatedAt: new Date().toISOString(),
      }

      set(state => ({
        products: [...state.products, newProduct],
        inventoryItems: [...state.inventoryItems, newInventoryItem],
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  updateProduct: async (id: string, data: Partial<Product>) => {
    const key = `update-product-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(300, 600)

      if (simulateError(0.1)) {
        throw new Error('Failed to update product. Please try again.')
      }

      set(state => ({
        products: state.products.map(product =>
          product.id === id ? { ...product, ...data, updatedAt: new Date().toISOString() } : product
        ),
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  deleteProduct: async (id: string) => {
    const key = `delete-product-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(200, 400)

      if (simulateError(0.05)) {
        throw new Error('Failed to delete product. Please try again.')
      }

      set(state => ({
        products: state.products.filter(product => product.id !== id),
        inventoryItems: state.inventoryItems.filter(item => item.productId !== id),
        selectedProductIds: state.selectedProductIds.filter(pid => pid !== id),
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  // Inventory actions
  updateInventoryThresholds: async (id: string, data: InventoryThresholdData) => {
    const key = `update-inventory-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(200, 500)

      if (simulateError(0.1)) {
        throw new Error('Failed to update thresholds. Please try again.')
      }

      set(state => ({
        inventoryItems: state.inventoryItems.map(item =>
          item.id === id
            ? {
                ...item,
                ...data,
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  bulkUpdateThresholds: async (productIds: string[], data: InventoryThresholdData) => {
    const key = 'bulk-update-thresholds'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(500, 1000)

      if (simulateError(0.1)) {
        throw new Error('Failed to update thresholds. Please try again.')
      }

      set(state => ({
        inventoryItems: state.inventoryItems.map(item =>
          productIds.includes(item.productId)
            ? {
                ...item,
                ...data,
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  bulkSetCategory: async (productIds: string[], category: string) => {
    const key = 'bulk-set-category'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(400, 800)

      if (simulateError(0.1)) {
        throw new Error('Failed to update categories. Please try again.')
      }

      set(state => ({
        products: state.products.map(product =>
          productIds.includes(product.id)
            ? {
                ...product,
                category,
                updatedAt: new Date().toISOString(),
              }
            : product
        ),
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  // Search and filter actions
  setSearch: (query: string) => {
    set(state => ({
      searchState: { ...state.searchState, query },
      paginationState: { ...state.paginationState, page: 1 },
    }))
  },

  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => {
    set(state => ({
      searchState: { ...state.searchState, sortBy, sortOrder },
      paginationState: { ...state.paginationState, page: 1 },
    }))
  },

  setCategoryFilter: (category: string) => {
    set(state => ({
      categoryFilter: category === '__all__' ? '' : category,
      paginationState: { ...state.paginationState, page: 1 },
    }))
  },

  setLowStockFilter: (enabled: boolean) => {
    set(state => ({
      lowStockFilter: enabled,
      paginationState: { ...state.paginationState, page: 1 },
    }))
  },

  setPagination: (page: number, pageSize?: number) => {
    set(state => ({
      paginationState: {
        ...state.paginationState,
        page,
        pageSize: pageSize || state.paginationState.pageSize,
      },
    }))
  },

  // Selection actions
  toggleProductSelection: (productId: string) => {
    set(state => ({
      selectedProductIds: state.selectedProductIds.includes(productId)
        ? state.selectedProductIds.filter(id => id !== productId)
        : [...state.selectedProductIds, productId],
    }))
  },

  selectAllProducts: () => {
    const products = get().getFilteredProducts()
    set({ selectedProductIds: products.map(p => p.id) })
  },

  clearSelection: () => {
    set({ selectedProductIds: [] })
  },

  // UI actions
  setSelectedTab: (tab: 'products' | 'inventory') => {
    set({ selectedTab: tab })
    userPreferences.set({ lastSelectedTab: { inventory: tab } })
  },

  setTableDensity: (density: TableDensity) => {
    set({ tableDensity: density })
    userPreferences.set({ tableDensity: density })
  },

  setLoadingState: (key: string, state: LoadingState) => {
    set(currentState => ({
      loadingStates: {
        ...currentState.loadingStates,
        [key]: state,
      },
    }))
  },

  // Computed getters
  getFilteredProducts: () => {
    const { products, searchState, categoryFilter } = get()

    let filtered = products

    // Apply search filter
    if (searchState.query) {
      const query = searchState.query.toLowerCase()
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      const aValue = a[searchState.sortBy as keyof Product] as string
      const bValue = b[searchState.sortBy as keyof Product] as string

      const comparison = aValue.localeCompare(bValue)
      return searchState.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  },

  getFilteredInventoryItems: () => {
    const { inventoryItems, products, searchState, categoryFilter, lowStockFilter } = get()

    let filtered = inventoryItems
      .map(item => ({
        ...item,
        product: products.find(p => p.id === item.productId)!,
      }))
      .filter(item => item.product) // Ensure product exists

    // Apply search filter
    if (searchState.query) {
      const query = searchState.query.toLowerCase()
      filtered = filtered.filter(
        item =>
          item.product.name.toLowerCase().includes(query) ||
          item.product.sku.toLowerCase().includes(query) ||
          item.product.category.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.product.category === categoryFilter)
    }

    // Apply low stock filter
    if (lowStockFilter) {
      filtered = filtered.filter(item => item.stock < item.minThreshold)
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (searchState.sortBy === 'name') {
        aValue = a.product.name
        bValue = b.product.name
      } else if (searchState.sortBy === 'category') {
        aValue = a.product.category
        bValue = b.product.category
      } else {
        aValue = a[searchState.sortBy as keyof InventoryItem] as any
        bValue = b[searchState.sortBy as keyof InventoryItem] as any
      }

      const comparison = typeof aValue === 'string' ? aValue.localeCompare(bValue) : aValue - bValue

      return searchState.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  },

  getPaginatedProducts: () => {
    const { paginationState } = get()
    const filtered = get().getFilteredProducts()
    const startIndex = (paginationState.page - 1) * paginationState.pageSize
    const endIndex = startIndex + paginationState.pageSize

    return filtered.slice(startIndex, endIndex)
  },

  getPaginatedInventoryItems: () => {
    const { paginationState } = get()
    const filtered = get().getFilteredInventoryItems()
    const startIndex = (paginationState.page - 1) * paginationState.pageSize
    const endIndex = startIndex + paginationState.pageSize

    return filtered.slice(startIndex, endIndex)
  },

  getTotalCount: () => {
    const { selectedTab } = get()
    if (selectedTab === 'products') {
      return get().getFilteredProducts().length
    } else {
      return get().getFilteredInventoryItems().length
    }
  },

  getLowStockItems: () => {
    const allItems = get().getFilteredInventoryItems()
    return allItems.filter(item => item.stock < item.minThreshold)
  },

  getCategories: () => {
    const { products } = get()
    const categories = Array.from(new Set(products.map(p => p.category)))
    return categories.sort()
  },
}))
