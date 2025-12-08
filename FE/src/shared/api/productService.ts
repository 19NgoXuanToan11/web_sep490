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
  cropId?: string | number
  cropName?: string
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

  price: number
  categoryId: number
  imageUrl?: string
  quantity?: number
}

export interface UpdateProductRequest {
  productName?: string
  productDescription?: string
  price?: number
  categoryId?: number
  imageUrl?: string
}

export interface ChangeStatusRequest {
  status: 'Active' | 'Inactive'
}

export interface ChangeQuantityRequest {
  stockQuantity: number
}

const mapApiProductToProduct = (apiProduct: any): Product => {
  // Handle status: backend returns "ACTIVE" (string) or 1 (number)
  let status: 'Active' | 'Inactive' = 'Inactive'
  if (apiProduct.status === 1 || apiProduct.status === 'ACTIVE' || apiProduct.status === 'Active') {
    status = 'Active'
  }

  return {
    productId: apiProduct.productId || 0,
    productName: apiProduct.productName || '',
    productDescription: apiProduct.description || '',
    sku: `SKU-${apiProduct.productId || ''}`,
    price: Number(apiProduct.price || 0),
    categoryId: apiProduct.categoryId || 1,
    categoryName: apiProduct.categoryname,
    imageUrl: apiProduct.images,
    status,
    quantity: Number(apiProduct.stockQuantity || 0),
    createdAt: apiProduct.createdAt || new Date().toISOString(),
    updatedAt: apiProduct.updatedAt || new Date().toISOString(),
    cropId: apiProduct.cropId ?? undefined,
    cropName: apiProduct.cropName ?? undefined,
  }
}

export const productService = {
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
      if (filter.page) queryParams.append('page', (filter.page - 1).toString())
      if (filter.pageSize) queryParams.append('pageSize', filter.pageSize.toString())
    }

    const url = `/v1/products/products-list${queryParams.toString() ? '?' + queryParams.toString() : ''}`

    const response = await http.get<any>(url)

    if (!response.data || !response.data.data) {
      return {
        products: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      }
    }

    const apiData = response.data.data

    const transformedResponse: ProductListResponse = {
      products: (apiData?.items || []).map(mapApiProductToProduct),
      totalCount: apiData?.totalItemCount || 0,
      page: (apiData?.pageIndex || 0) + 1,
      pageSize: apiData?.pageSize || 10,
      totalPages: Math.ceil((apiData?.totalItemCount || 0) / (apiData?.pageSize || 10)),
    }

    return transformedResponse
  },

  getFilteredProducts: async (filter: ProductFilter): Promise<ProductListResponse> => {
    const response = await http.post<ProductListResponse>('/v1/products/product-filter', filter)
    return response.data
  },

  getProductFilter: async (filter?: {
    pageIndex?: number
    pageSize?: number
    status?: 'ACTIVE' | 'DEACTIVATED'
    categoryId?: number
    sortByStockAsc?: boolean
  }): Promise<ProductListResponse> => {
    const queryParams = new URLSearchParams()

    // Set defaults according to API spec
    const pageIndex = filter?.pageIndex ?? 1
    const pageSize = filter?.pageSize ?? 10
    const sortByStockAsc = filter?.sortByStockAsc ?? true

    queryParams.append('pageIndex', pageIndex.toString())
    queryParams.append('pageSize', pageSize.toString())
    queryParams.append('sortByStockAsc', sortByStockAsc.toString())

    if (filter?.status) {
      queryParams.append('status', filter.status)
    }

    if (filter?.categoryId) {
      queryParams.append('categoryId', filter.categoryId.toString())
    }

    const url = `/v1/products/product-filter${queryParams.toString() ? '?' + queryParams.toString() : ''}`

    const response = await http.get<any>(url)

    if (!response.data || !response.data.data) {
      return {
        products: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      }
    }

    const apiData = response.data.data

    // Calculate totalCount: use totalItemCount if available, otherwise estimate from totalPagesCount
    const totalItemCount = apiData?.totalItemCount
    const totalPagesCount = apiData?.totalPagesCount || 0
    const responsePageSize = apiData?.pageSize || pageSize
    const calculatedTotalCount = totalItemCount || totalPagesCount * responsePageSize

    const transformedResponse: ProductListResponse = {
      products: (apiData?.items || []).map(mapApiProductToProduct),
      totalCount: calculatedTotalCount,
      page: (apiData?.pageIndex || 0) + 1,
      pageSize: responsePageSize,
      totalPages: totalPagesCount || Math.ceil(calculatedTotalCount / responsePageSize),
    }

    return transformedResponse
  },

  getProductById: async (productId: number): Promise<Product> => {
    const response = await http.get<any>(`/v1/products/get-product/${productId}`)
    const apiProduct = response.data?.data ?? response.data
    return mapApiProductToProduct(apiProduct)
  },

  searchProductByName: async (productName: string): Promise<Product[]> => {
    const response = await http.get<any>(
      `/v1/products/search-product/${encodeURIComponent(productName)}`
    )
    const list = response.data?.data ?? response.data ?? []
    return (Array.isArray(list) ? list : []).map(mapApiProductToProduct)
  },

  createProduct: async (product: CreateProductRequest): Promise<Product> => {
    const response = await http.post<Product>('/v1/products/create', product)
    return response.data
  },

  updateProduct: async (id: number, product: UpdateProductRequest): Promise<Product> => {
    // Map frontend field names to backend DTO field names (PascalCase)
    // Backend expects: ProductName, Description, Price, CategoryId, Images
    const backendPayload: any = {
      ProductName: product.productName,
      Price: product.price,
      CategoryId: product.categoryId,
    }

    // Include Description only if provided (can be empty string, null, or undefined)
    // Backend accepts null/empty for optional Description field
    if (product.productDescription !== undefined) {
      backendPayload.Description = product.productDescription || null
    }

    // Include Images only if provided
    if (product.imageUrl !== undefined) {
      backendPayload.Images = product.imageUrl || null
    }

    const response = await http.put<any>(`/v1/products/update/${id}`, backendPayload)
    // Backend returns ResponseDTO with Data field containing ProductDetailDTO
    // ProductDetailDTO doesn't have productId, so we fetch the full product
    const updatedProduct = await productService.getProductById(id)

    // Always prioritize imageUrl from request if it was provided
    // This ensures the image is included even if the backend response doesn't have it yet
    // or if getProductById returns stale data
    if (product.imageUrl !== undefined) {
      // If imageUrl was explicitly provided (including empty string to remove image)
      updatedProduct.imageUrl = product.imageUrl || undefined
    } else {
      // Otherwise, try to use from response
      const responseData = response.data?.data
      if (
        responseData?.Images !== undefined &&
        responseData.Images !== null &&
        responseData.Images !== ''
      ) {
        updatedProduct.imageUrl = responseData.Images
      }
    }

    return updatedProduct
  },

  changeProductStatus: async (id: number): Promise<Product> => {
    await http.put<any>(`/v1/products/change-product-status/${id}`)
    // Backend returns ResponseDTO with message only, not full product data
    // Fetch the updated product
    return await productService.getProductById(id)
  },

  changeProductQuantity: async (
    id: number,
    quantityData: ChangeQuantityRequest
  ): Promise<Product> => {
    await http.put<any>(`/v1/products/change-product-Quantity/${id}`, quantityData)
    // Backend returns ResponseDTO with message only, not full product data
    // Fetch the updated product
    return await productService.getProductById(id)
  },

  deleteProduct: async (id: number): Promise<void> => {
    await http.delete(`/v1/products/delete/${id}`)
  },
}
