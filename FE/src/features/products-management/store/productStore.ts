import { create } from 'zustand'
import {
  productService,
  type Product,
  type ProductFilter,
  type CreateProductRequest,
  type UpdateProductRequest,
  type ProductListResponse,
} from '@/shared/api/productService'
import { categoryService, type Category } from '@/shared/api/categoryService'

interface ProductState {
  // Data
  products: Product[]
  categories: Category[]
  selectedProduct: Product | null
  allProducts: Product[] // Cache all products for client-side filtering
  filteredProducts: Product[] // Computed filtered products

  // Pagination
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number

  // Filtering & Search
  searchQuery: string
  filters: ProductFilter

  // UI State
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  selectedProductIds: number[]

  // Actions
  // Data loading
  fetchProducts: (filter?: ProductFilter) => Promise<void>
  fetchAllProducts: () => Promise<void> // Fetch all products for filtering
  fetchCategories: () => Promise<void>
  fetchProductById: (id: number) => Promise<Product>
  searchProducts: (productName: string) => Promise<Product[]>
  applyClientSideFilters: () => void // Apply filters on cached data

  // Product CRUD
  createProduct: (product: CreateProductRequest) => Promise<Product>
  updateProduct: (id: number, product: UpdateProductRequest) => Promise<Product>
  deleteProduct: (id: number) => Promise<void>
  changeProductStatus: (id: number, status: 'Active' | 'Inactive') => Promise<Product>
  changeProductQuantity: (id: number, quantity: number) => Promise<Product>

  // UI Actions
  setSearchQuery: (query: string) => void
  setFilters: (filters: Partial<ProductFilter>) => void
  setPagination: (page: number, pageSize?: number) => void
  setSelectedProduct: (product: Product | null) => void
  toggleProductSelection: (productId: number) => void
  selectAllProducts: () => void
  clearSelection: () => void

  // Reset state
  resetState: () => void
  clearFilters: () => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  // Initial state
  products: [],
  categories: [],
  selectedProduct: null,
  allProducts: [],
  filteredProducts: [],

  // Pagination
  currentPage: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,

  // Filtering & Search
  searchQuery: '',
  filters: {},

  // UI State
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  selectedProductIds: [],

  // Fetch products with pagination and filters
  fetchProducts: async (filter?: ProductFilter) => {
    set({ isLoading: true })
    try {
      const { currentPage, pageSize, filters } = get()
      const requestFilter: ProductFilter = {
        ...filters,
        ...filter,
        page: filter?.page || currentPage,
        pageSize: filter?.pageSize || pageSize,
      }

      const response: ProductListResponse = await productService.getProductsList(requestFilter)

      set({
        products: response.products || [],
        totalCount: response.totalCount || 0,
        currentPage: response.page || 1,
        pageSize: response.pageSize || 10,
        totalPages: response.totalPages || 0,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // Fetch categories for dropdown
  fetchCategories: async () => {
    try {
      const categories = await categoryService.getAllCategories()
      set({ categories })
    } catch (error) {
      throw error
    }
  },

  // Fetch single product by ID
  fetchProductById: async (id: number) => {
    set({ isLoading: true })
    try {
      const product = await productService.getProductById(id)
      set({ selectedProduct: product, isLoading: false })
      return product
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // Search products by name
  searchProducts: async (productName: string) => {
    set({ isLoading: true })
    try {
      const products = await productService.searchProductByName(productName)
      set({ isLoading: false })
      return products
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // Create new product
  createProduct: async (productData: CreateProductRequest) => {
    set({ isCreating: true })
    try {
      const newProduct = await productService.createProduct(productData)

      // Refresh products list
      await get().fetchProducts()

      set({ isCreating: false })
      return newProduct
    } catch (error) {
      set({ isCreating: false })
      throw error
    }
  },

  // Update existing product
  updateProduct: async (id: number, productData: UpdateProductRequest) => {
    set({ isUpdating: true })
    try {
      const updatedProduct = await productService.updateProduct(id, productData)

      // Update product in local state
      set(state => ({
        products: state.products.map(product =>
          product.productId === id ? updatedProduct : product
        ),
        selectedProduct:
          state.selectedProduct?.productId === id ? updatedProduct : state.selectedProduct,
        isUpdating: false,
      }))

      return updatedProduct
    } catch (error) {
      set({ isUpdating: false })
      throw error
    }
  },

  // Delete product
  deleteProduct: async (id: number) => {
    set({ isDeleting: true })
    try {
      await productService.deleteProduct(id)

      // Remove product from local state
      set(state => ({
        products: state.products.filter(product => product.productId !== id),
        selectedProduct: state.selectedProduct?.productId === id ? null : state.selectedProduct,
        selectedProductIds: state.selectedProductIds.filter(productId => productId !== id),
        totalCount: state.totalCount - 1,
        isDeleting: false,
      }))
    } catch (error) {
      set({ isDeleting: false })
      throw error
    }
  },

  // Change product status
  changeProductStatus: async (id: number, status: 'Active' | 'Inactive') => {
    set({ isUpdating: true })
    try {
      const updatedProduct = await productService.changeProductStatus(id, { status })

      // Update product in local state
      set(state => ({
        products: state.products.map(product =>
          product.productId === id ? updatedProduct : product
        ),
        selectedProduct:
          state.selectedProduct?.productId === id ? updatedProduct : state.selectedProduct,
        isUpdating: false,
      }))

      return updatedProduct
    } catch (error) {
      set({ isUpdating: false })
      throw error
    }
  },

  // Change product quantity
  changeProductQuantity: async (id: number, quantity: number) => {
    set({ isUpdating: true })
    try {
      const updatedProduct = await productService.changeProductQuantity(id, { quantity })

      // Update product in local state
      set(state => ({
        products: state.products.map(product =>
          product.productId === id ? updatedProduct : product
        ),
        selectedProduct:
          state.selectedProduct?.productId === id ? updatedProduct : state.selectedProduct,
        isUpdating: false,
      }))

      return updatedProduct
    } catch (error) {
      set({ isUpdating: false })
      throw error
    }
  },

  // Set search query and trigger search
  setSearchQuery: (query: string) => {
    set({ searchQuery: query })

    // Auto search when query changes
    if (query.length >= 2) {
      get()
        .searchProducts(query)
        .then(results => {
          set({ products: results || [], totalCount: (results || []).length })
        })
        .catch(() => {
          // Handle search error silently
        })
    } else if (query.length === 0) {
      // Reset to full list when search is cleared
      get().fetchProducts()
    }
  },

  // Set filters and apply them
  setFilters: (newFilters: Partial<ProductFilter>) => {
    const currentFilters = get().filters
    const updatedFilters = { ...currentFilters, ...newFilters }

    set({ filters: updatedFilters, currentPage: 1 })
    get().applyClientSideFilters()
  },

  // Set pagination
  setPagination: (page: number, pageSize?: number) => {
    const newPageSize = pageSize || get().pageSize
    set({ currentPage: page, pageSize: newPageSize })

    get().applyClientSideFilters()
  },

  // Set selected product
  setSelectedProduct: (product: Product | null) => {
    set({ selectedProduct: product })
  },

  // Toggle product selection
  toggleProductSelection: (productId: number) => {
    set(state => ({
      selectedProductIds: state.selectedProductIds.includes(productId)
        ? state.selectedProductIds.filter(id => id !== productId)
        : [...state.selectedProductIds, productId],
    }))
  },

  // Select all products
  selectAllProducts: () => {
    const { products } = get()
    set({ selectedProductIds: (products || []).map(p => p.productId) })
  },

  // Clear selection
  clearSelection: () => {
    set({ selectedProductIds: [] })
  },

  // Fetch all products for client-side filtering
  fetchAllProducts: async () => {
    set({ isLoading: true })
    try {
      const response: ProductListResponse = await productService.getProductsList({
        pageSize: 1000, // Large number to get all products
      })

      set({
        allProducts: response.products || [],
        isLoading: false,
      })

      // Apply current filters
      get().applyClientSideFilters()
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // Apply client-side filters to cached products
  applyClientSideFilters: () => {
    const { allProducts, filters } = get()

    let filtered = [...allProducts]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        product =>
          product.productName.toLowerCase().includes(searchLower) ||
          product.productDescription.toLowerCase().includes(searchLower) ||
          (product.categoryName && product.categoryName.toLowerCase().includes(searchLower))
      )
    }

    // Category filter
    if (filters.categoryId) {
      filtered = filtered.filter(product => product.categoryId === filters.categoryId)
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(product => product.status === filters.status)
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(product => product.price >= filters.minPrice!)
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(product => product.price <= filters.maxPrice!)
    }

    // Sort
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any

        switch (filters.sortBy) {
          case 'productName':
            aValue = a.productName.toLowerCase()
            bValue = b.productName.toLowerCase()
            break
          case 'price':
            aValue = a.price
            bValue = b.price
            break
          case 'quantity':
            aValue = a.quantity
            bValue = b.quantity
            break
          case 'updatedAt':
            aValue = new Date(a.updatedAt || 0)
            bValue = new Date(b.updatedAt || 0)
            break
          default:
            return 0
        }

        if (filters.sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      })
    }

    // Update filtered products and pagination
    const { currentPage, pageSize } = get()
    const totalCount = filtered.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedProducts = filtered.slice(startIndex, endIndex)

    set({
      filteredProducts: filtered,
      products: paginatedProducts,
      totalCount,
      totalPages: Math.max(1, totalPages),
    })
  },

  // Reset state
  resetState: () => {
    set({
      products: [],
      categories: [],
      selectedProduct: null,
      allProducts: [],
      filteredProducts: [],
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      searchQuery: '',
      filters: {},
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      selectedProductIds: [],
    })
  },

  // Clear filters and apply to cached products
  clearFilters: () => {
    set({ filters: {}, currentPage: 1 })
    get().applyClientSideFilters()
  },
}))
