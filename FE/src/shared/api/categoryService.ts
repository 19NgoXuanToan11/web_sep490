import { http } from './client'

export interface Category {
  categoryId: number
  categoryName: string
  products?: any[]
}

export const categoryService = {
  getAllCategories: async (): Promise<Category[]> => {
    const response = await http.get<Category[]>('/v1/category/get-all')
    return response.data
  },

  getCategoryById: async (id: number): Promise<Category> => {
    const response = await http.get<Category>(`/v1/category/${id}`)
    return response.data
  },

  createCategory: async (categoryName: string): Promise<Category> => {
    const response = await http.post<Category>('/v1/category/create', categoryName)
    return response.data
  },

  updateCategory: async (id: number, categoryName: string): Promise<Category> => {
    const response = await http.put<Category>(`/v1/category/${id}`, categoryName)
    return response.data
  },

  deleteCategory: async (id: number): Promise<void> => {
    await http.delete(`/api/v1/category/${id}`)
  },
}
