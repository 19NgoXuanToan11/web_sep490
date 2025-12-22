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
  products: Product[]
  categories: Category[]
  selectedProduct: Product | null
  allProducts: Product[]
  filteredProducts: Product[]

  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number

  searchQuery: string
  filters: ProductFilter

  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  selectedProductIds: number[]

  fetchProducts: (filter?: ProductFilter) => Promise<void>
  fetchAllProducts: () => Promise<void>
  fetchCategories: () => Promise<void>
  fetchProductById: (id: number) => Promise<Product>
  searchProducts: (productName: string) => Promise<Product[]>
  applyClientSideFilters: () => void

  createProduct: (product: CreateProductRequest) => Promise<Product>
  updateProduct: (id: number, product: UpdateProductRequest) => Promise<Product>
  deleteProduct: (id: number) => Promise<void>
  changeProductStatus: (id: number) => Promise<Product>
  changeProductQuantity: (id: number, quantity: number) => Promise<Product>

  setSearchQuery: (query: string) => void
  setFilters: (filters: Partial<ProductFilter>) => void
  setPagination: (page: number, pageSize?: number) => void
  setSelectedProduct: (product: Product | null) => void
  toggleProductSelection: (productId: number) => void
  selectAllProducts: () => void
  clearSelection: () => void

  resetState: () => void
  clearFilters: () => void
}

export const useProductStore = create<ProductState>((set, get) => ({
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

  fetchProducts: async (filter?: ProductFilter) => {
    set({ isLoading: true })
    try {
      const { currentPage, pageSize, filters } = get()
      const mergedFilters = {
        ...filters,
        ...filter,
        page: filter?.page || currentPage,
        pageSize: filter?.pageSize || pageSize,
      }

      const apiFilter: {
        pageIndex?: number
        pageSize?: number
        status?: 'ACTIVE' | 'DEACTIVATED'
        categoryId?: number
        sortByStockAsc?: boolean
      } = {
        pageIndex: mergedFilters.page ? mergedFilters.page - 1 : 0,
        pageSize: mergedFilters.pageSize || pageSize,
        sortByStockAsc: true,
      }

      if (mergedFilters.status) {
        if (mergedFilters.status === 'Active' || mergedFilters.status === 'ACTIVE') {
          apiFilter.status = 'ACTIVE'
        } else if (mergedFilters.status === 'Inactive' || mergedFilters.status === 'DEACTIVATED') {
          apiFilter.status = 'DEACTIVATED'
        }
      }

      if (mergedFilters.categoryId) {
        apiFilter.categoryId = mergedFilters.categoryId
      }

      const response: ProductListResponse = await productService.getProductFilter(apiFilter)

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

  fetchCategories: async () => {
    try {
      const categories = await categoryService.getAllCategories()
      set({ categories })
    } catch (error) {
      throw error
    }
  },

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

  createProduct: async (productData: CreateProductRequest) => {
    set({ isCreating: true })
    try {
      const newProduct = await productService.createProduct(productData)

      await get().fetchProducts()

      set({ isCreating: false })
      return newProduct
    } catch (error) {
      set({ isCreating: false })
      throw error
    }
  },

  updateProduct: async (id: number, productData: UpdateProductRequest) => {
    set({ isUpdating: true })
    try {
      const updatedProduct = await productService.updateProduct(id, productData)

      const savedImageUrl = updatedProduct.imageUrl

      await get().fetchAllProducts()

      const normalizedProduct = {
        ...updatedProduct,
        productId: updatedProduct.productId || id,
        imageUrl: savedImageUrl || updatedProduct.imageUrl,
        categoryId: updatedProduct.categoryId || productData.categoryId || 0,
      }

      set(state => ({
        products: state.products.map(product => {
          if (product.productId === id) {
            return {
              ...product,
              ...normalizedProduct,
            }
          }
          return product
        }),
        filteredProducts: state.filteredProducts.map(product =>
          product.productId === id
            ? {
                ...product,
                ...normalizedProduct,
              }
            : product
        ),
        allProducts: state.allProducts.map(product =>
          product.productId === id
            ? {
                ...product,
                ...normalizedProduct,
              }
            : product
        ),
        selectedProduct:
          state.selectedProduct?.productId === id
            ? {
                ...state.selectedProduct,
                ...normalizedProduct,
              }
            : state.selectedProduct,
        isUpdating: false,
      }))

      return normalizedProduct
    } catch (error) {
      set({ isUpdating: false })
      throw error
    }
  },

  deleteProduct: async (id: number) => {
    set({ isDeleting: true })
    try {
      await productService.deleteProduct(id)

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

  changeProductStatus: async (id: number) => {
    set({ isUpdating: true })
    try {
      const updatedProduct = await productService.changeProductStatus(id)

      await get().fetchAllProducts()

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

  changeProductQuantity: async (id: number, quantity: number) => {
    set({ isUpdating: true })
    try {
      const updatedProduct = await productService.changeProductQuantity(id, {
        stockQuantity: quantity,
      })

      await get().fetchAllProducts()

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

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })

    if (query.length >= 2) {
      get()
        .searchProducts(query)
        .then(results => {
          set({ products: results || [], totalCount: (results || []).length })
        })
        .catch(() => {})
    } else if (query.length === 0) {
      get().fetchProducts()
    }
  },

  setFilters: (newFilters: Partial<ProductFilter>) => {
    const currentFilters = get().filters
    const updatedFilters = { ...currentFilters, ...newFilters }

    set({ filters: updatedFilters, currentPage: 1 })
    get().applyClientSideFilters()
  },

  setPagination: (page: number, pageSize?: number) => {
    const newPageSize = pageSize || get().pageSize
    set({ currentPage: page, pageSize: newPageSize })

    get().applyClientSideFilters()
  },

  setSelectedProduct: (product: Product | null) => {
    set({ selectedProduct: product })
  },

  toggleProductSelection: (productId: number) => {
    set(state => ({
      selectedProductIds: state.selectedProductIds.includes(productId)
        ? state.selectedProductIds.filter(id => id !== productId)
        : [...state.selectedProductIds, productId],
    }))
  },

  selectAllProducts: () => {
    const { products } = get()
    set({ selectedProductIds: (products || []).map(p => p.productId) })
  },

  clearSelection: () => {
    set({ selectedProductIds: [] })
  },

  fetchAllProducts: async () => {
    set({ isLoading: true })
    try {
      const response: ProductListResponse = await productService.getProductFilter({
        pageIndex: 0,
        pageSize: 1000,
        sortByStockAsc: true,
      })

      set({
        allProducts: response.products || [],
        totalCount: response.totalCount || response.products?.length || 0,
        isLoading: false,
      })

      get().applyClientSideFilters()
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  applyClientSideFilters: () => {
    const { allProducts, filters } = get()

    let filtered = [...allProducts]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        product =>
          product.productName.toLowerCase().includes(searchLower) ||
          product.productDescription.toLowerCase().includes(searchLower) ||
          (product.categoryName && product.categoryName.toLowerCase().includes(searchLower))
      )
    }

    if (filters.categoryId) {
      filtered = filtered.filter(product => product.categoryId === filters.categoryId)
    }

    if (filters.status) {
      filtered = filtered.filter(product => product.status === filters.status)
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(product => product.price >= filters.minPrice!)
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(product => product.price <= filters.maxPrice!)
    }

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

  clearFilters: () => {
    set({ filters: {}, currentPage: 1 })
    get().applyClientSideFilters()
  },
}))
