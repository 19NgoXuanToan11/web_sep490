import { z } from 'zod'

// Product form validation schema
export const productFormSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be less than 50 characters'),
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(100, 'Name must be less than 100 characters'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be non-negative').max(999999, 'Price is too high'),
  imageFile: z.instanceof(File).optional(),
})

// Inventory threshold validation schema
export const inventoryThresholdSchema = z
  .object({
    minThreshold: z.number().min(0, 'Minimum threshold must be non-negative'),
    maxThreshold: z.number().min(1, 'Maximum threshold must be at least 1'),
  })
  .refine(data => data.maxThreshold > data.minThreshold, {
    message: 'Maximum threshold must be greater than minimum threshold',
    path: ['maxThreshold'],
  })

// Bulk actions schema
export const bulkActionSchema = z.object({
  action: z.enum(['set-category', 'update-thresholds', 'export-csv']),
  productIds: z.array(z.string()).min(1, 'At least one product must be selected'),
  data: z.record(z.any()).optional(),
})

// Search and filter schema
export const inventoryFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  lowStock: z.boolean().optional(),
  sortBy: z.enum(['name', 'category', 'stock', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Form data types (inferred from schemas)
export type ProductFormData = z.infer<typeof productFormSchema>
export type InventoryThresholdData = z.infer<typeof inventoryThresholdSchema>
export type BulkActionData = z.infer<typeof bulkActionSchema>
export type InventoryFilterData = z.infer<typeof inventoryFilterSchema>
