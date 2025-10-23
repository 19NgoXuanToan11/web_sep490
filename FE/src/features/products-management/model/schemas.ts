import { z } from 'zod'

// Zod schemas for form validation
export const productSchema = z.object({
  productName: z
    .string()
    .min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự')
    .max(100, 'Tên sản phẩm không được quá 100 ký tự'),

  productDescription: z
    .string()
    .min(10, 'Mô tả sản phẩm phải có ít nhất 10 ký tự')
    .max(500, 'Mô tả sản phẩm không được quá 500 ký tự'),

  sku: z
    .string()
    .min(3, 'SKU phải có ít nhất 3 ký tự')
    .max(20, 'SKU không được quá 20 ký tự')
    .regex(/^[A-Z0-9-_]+$/, 'SKU chỉ được chứa chữ in hoa, số, dấu gạch ngang và gạch dưới'),

  price: z.number().min(0, 'Giá không được âm').max(999999999, 'Giá không được quá 999,999,999'),

  categoryId: z.number().min(1, 'Vui lòng chọn danh mục'),

  imageUrl: z.string().url('URL hình ảnh không hợp lệ').optional().or(z.literal('')),

  quantity: z
    .number()
    .min(0, 'Số lượng không được âm')
    .max(999999, 'Số lượng không được quá 999,999')
    .optional(),
})

export const productUpdateSchema = productSchema.partial()

export const changeStatusSchema = z.object({
  status: z.enum(['Active', 'Inactive'], {
    required_error: 'Vui lòng chọn trạng thái',
  }),
})

export const changeQuantitySchema = z.object({
  quantity: z
    .number()
    .min(0, 'Số lượng không được âm')
    .max(999999, 'Số lượng không được quá 999,999'),
})

export const productFilterSchema = z.object({
  categoryId: z.number().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
})

// Types derived from schemas
export type ProductFormData = z.infer<typeof productSchema>
export type ProductUpdateFormData = z.infer<typeof productUpdateSchema>
export type ChangeStatusFormData = z.infer<typeof changeStatusSchema>
export type ChangeQuantityFormData = z.infer<typeof changeQuantitySchema>
export type ProductFilterFormData = z.infer<typeof productFilterSchema>

// Additional validation helpers
export const validateSKU = (sku: string, existingSKUs: string[] = []) => {
  if (existingSKUs.includes(sku.toUpperCase())) {
    return { isValid: false, error: 'SKU đã tồn tại' }
  }

  const result = productSchema.pick({ sku: true }).safeParse({ sku })
  return result.success
    ? { isValid: true }
    : { isValid: false, error: result.error.issues[0]?.message || 'SKU không hợp lệ' }
}

export const validatePrice = (price: number) => {
  const result = productSchema.pick({ price: true }).safeParse({ price })
  return result.success
    ? { isValid: true }
    : { isValid: false, error: result.error.issues[0]?.message || 'Giá không hợp lệ' }
}
