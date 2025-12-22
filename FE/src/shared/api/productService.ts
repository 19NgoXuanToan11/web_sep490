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
    const backendPayload: any = {
      ProductName: product.productName,
      Price: product.price,
      CategoryId: product.categoryId,
    }

    if (product.productDescription !== undefined) {
      backendPayload.Description = product.productDescription || null
    }

    if (product.imageUrl !== undefined) {
      backendPayload.Images = product.imageUrl || null
    }

    const response = await http.put<any>(`/v1/products/update/${id}`, backendPayload)
    const updatedProduct = await productService.getProductById(id)

    const normalizedProduct: Product = {
      ...updatedProduct,
      productId: updatedProduct.productId || id,
      categoryId: updatedProduct.categoryId || Number(product.categoryId) || 0,
      productName: updatedProduct.productName || product.productName || '',
      productDescription:
        updatedProduct.productDescription ?? product.productDescription ?? '',
      price: updatedProduct.price ?? Number(product.price) ?? 0,
    }

    if (product.imageUrl !== undefined) {
      normalizedProduct.imageUrl = product.imageUrl || undefined
    } else {
      const responseData = response.data?.data
      if (
        responseData?.Images !== undefined &&
        responseData.Images !== null &&
        responseData.Images !== ''
      ) {
        normalizedProduct.imageUrl = responseData.Images
      }
    }

    return normalizedProduct
  },

  changeProductStatus: async (id: number): Promise<Product> => {
    await http.put<any>(`/v1/products/change-product-status/${id}`)
    return await productService.getProductById(id)
  },

  changeProductQuantity: async (
    id: number,
    quantityData: ChangeQuantityRequest
  ): Promise<Product> => {
    await http.put<any>(`/v1/products/change-product-Quantity/${id}`, quantityData)
    return await productService.getProductById(id)
  },

  deleteProduct: async (id: number): Promise<void> => {
    await http.delete(`/v1/products/delete/${id}`)
  },
}
