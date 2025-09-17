import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Package, Warehouse, Search } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { useInventoryStore } from '@/features/inventory/store/inventoryStore'
import { userPreferences } from '@/shared/lib/localData/storage'
import { ProductsTable } from '@/features/inventory/ui/ProductsTable'
import { InventoryTable } from '@/features/inventory/ui/InventoryTable'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'

export default function InventoryPage() {
  const { selectedTab, setSelectedTab, initializeData, searchState, setSearch, getLowStockItems } =
    useInventoryStore()

  // Initialize data and restore last selected tab
  React.useEffect(() => {
    initializeData()

    // Restore last selected tab from localStorage
    const prefs = userPreferences.get()
    if (prefs.lastSelectedTab?.inventory) {
      setSelectedTab(prefs.lastSelectedTab.inventory as 'products' | 'inventory')
    }
  }, []) // Empty dependency array - only run once on mount

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab as 'products' | 'inventory')
  }

  const lowStockItems = getLowStockItems()

  return (
    <ManagerLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý kho & sản phẩm</h1>
            <p className="text-gray-600 mt-2">Quản lý danh mục sản phẩm và tồn kho với cảnh báo thông minh.</p>
          </div>

          {/* Global Search & Alerts */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm sản phẩm và tồn kho..."
                value={searchState.query}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-white border-gray-200 shadow-sm"
              />
            </div>

            {lowStockItems.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">{lowStockItems.length} cảnh báo sắp hết hàng</span>
              </div>
            )}
          </div>

          {/* Main Tabs */}
          <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md bg-white shadow-sm border border-gray-200">
              <TabsTrigger value="products" className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
                <Package className="h-4 w-4" />
                <span>Danh mục sản phẩm</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
                <Warehouse className="h-4 w-4" />
                <span>Quản lý tồn kho</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Quản lý danh mục sản phẩm</h2>
                  <p className="text-gray-600">Quản lý thông tin, danh mục, giá và thuộc tính sản phẩm.</p>
                </div>
                <ProductsTable />
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Hệ thống quản lý tồn kho</h2>
                  <p className="text-gray-600">Theo dõi mức tồn, đặt ngưỡng, theo dõi chất lượng và phiếu xuất/nhập.</p>
                </div>
                <InventoryTable />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ManagerLayout>
  )
}
