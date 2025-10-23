import { http } from './client'

export interface Product {
  productId: number
  productName: string
  productDescription: string
  sku: string
  price: number
  categoryId: number
  categoryName?: string
  imageUrl?: string
  status: 'Active' | 'Inactive'
  quantity: number
  createdAt?: string
  updatedAt?: string
}

export interface ProductFilter {
  search?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface ProductListResponse {
  products: Product[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// API Response interface (actual structure from backend)
export interface ApiProductListResponse {
  pageSize: number
  totalPagesCount: number
  pageIndex: number
  next: boolean
  previous: boolean
  items: ApiProduct[]
}

export interface ApiProduct {
  productId: number
  productName: string
  description: string
  price: number
  unit: string
  stockQuantity: number
  images?: string
  status: number
  createdAt: string
  updatedAt: string
  categoryname?: string
  cropId?: string
  cropName?: string
}

export interface CreateProductRequest {
  productName: string
  productDescription: string
  sku: string
  price: number
  categoryId: number
  imageUrl?: string
  quantity?: number
}

export interface UpdateProductRequest {
  productName?: string
  productDescription?: string
  sku?: string
  price?: number
  categoryId?: number
  imageUrl?: string
}

export interface ChangeStatusRequest {
  status: 'Active' | 'Inactive'
}

export interface ChangeQuantityRequest {
  quantity: number
}

// Helper function to map API product to our Product interface
const mapApiProductToProduct = (apiProduct: any): Product => {
  return {
    productId: apiProduct.productId || 0,
    productName: apiProduct.productName || '',
    productDescription: apiProduct.description || '',
    sku: `SKU-${apiProduct.productId || ''}`,
    price: Number(apiProduct.price || 0),
    categoryId: apiProduct.categoryId || 1,
    categoryName: apiProduct.categoryname,
    imageUrl: apiProduct.images,
    status: apiProduct.status === 1 ? 'Active' : 'Inactive',
    quantity: Number(apiProduct.stockQuantity || 0),
    createdAt: apiProduct.createdAt || new Date().toISOString(),
    updatedAt: apiProduct.updatedAt || new Date().toISOString(),
  }
}

export const productService = {
  // GET /api/v1/products/products-list
  getProductsList: async (filter?: ProductFilter): Promise<ProductListResponse> => {
    const queryParams = new URLSearchParams()

    if (filter) {
      if (filter.search) queryParams.append('search', filter.search)
      if (filter.categoryId) queryParams.append('categoryId', filter.categoryId.toString())
      if (filter.minPrice) queryParams.append('minPrice', filter.minPrice.toString())
      if (filter.maxPrice) queryParams.append('maxPrice', filter.maxPrice.toString())
      if (filter.status) queryParams.append('status', filter.status)
      if (filter.sortBy) queryParams.append('sortBy', filter.sortBy)
      if (filter.sortOrder) queryParams.append('sortOrder', filter.sortOrder)
      if (filter.page) queryParams.append('page', (filter.page - 1).toString()) // API uses 0-based indexing
      if (filter.pageSize) queryParams.append('pageSize', filter.pageSize.toString())
    }

    const url = `/v1/products/products-list${queryParams.toString() ? '?' + queryParams.toString() : ''}`

    const response = await http.get<any>(url) // Use any to see actual structure

    // Check if response.data exists and has the expected structure
    if (!response.data || !response.data.data) {
      console.error('No data in API response')
      return {
        products: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      }
    }

    // The actual data is nested in response.data.data (Pagination object)
    const apiData = response.data.data

    // Transform API response to match our interface
    // Backend returns: { totalItemCount, pageSize, pageIndex, items }
    const transformedResponse: ProductListResponse = {
      products: (apiData?.items || []).map(mapApiProductToProduct),
      totalCount: apiData?.totalItemCount || 0,
      page: (apiData?.pageIndex || 0) + 1, // Convert to 1-based indexing
      pageSize: apiData?.pageSize || 10,
      totalPages: Math.ceil((apiData?.totalItemCount || 0) / (apiData?.pageSize || 10)),
    }

    return transformedResponse
  },

  // GET /api/v1/products/product-filter
  getFilteredProducts: async (filter: ProductFilter): Promise<ProductListResponse> => {
    const response = await http.post<ProductListResponse>('/v1/products/product-filter', filter)
    return response.data
  },

  // GET /api/v1/products/get-product/{productId}
  getProductById: async (productId: number): Promise<Product> => {
    const response = await http.get<Product>(`/v1/products/get-product/${productId}`)
    return response.data
  },

  // GET /api/v1/products/search-product/{productName}
  searchProductByName: async (productName: string): Promise<Product[]> => {
    const response = await http.get<Product[]>(
      `/v1/products/search-product/${encodeURIComponent(productName)}`
    )
    return response.data
  },

  // POST /api/v1/products/create
  createProduct: async (product: CreateProductRequest): Promise<Product> => {
    const response = await http.post<Product>('/v1/products/create', product)
    return response.data
  },

  // PUT /api/v1/products/update/{id}
  updateProduct: async (id: number, product: UpdateProductRequest): Promise<Product> => {
    const response = await http.put<Product>(`/v1/products/update/${id}`, product)
    return response.data
  },

  // PUT /api/v1/products/change-product-status/{id}
  changeProductStatus: async (id: number, statusData: ChangeStatusRequest): Promise<Product> => {
    const response = await http.put<Product>(`/v1/products/change-product-status/${id}`, statusData)
    return response.data
  },

  // PUT /api/v1/products/change-product-quantity/{id}
  changeProductQuantity: async (
    id: number,
    quantityData: ChangeQuantityRequest
  ): Promise<Product> => {
    const response = await http.put<Product>(
      `/v1/products/change-product-quantity/${id}`,
      quantityData
    )
    return response.data
  },

  // DELETE /api/v1/products/delete/{id}
  deleteProduct: async (id: number): Promise<void> => {
    await http.delete(`/v1/products/delete/${id}`)
  },
}
