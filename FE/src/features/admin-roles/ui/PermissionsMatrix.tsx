import React from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Users,
  Settings,
  Package,
  BarChart3,
  Droplets,
  CheckSquare,
  FileText,
  Eye,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Checkbox } from '@/shared/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { useAdminRolesStore } from '../store/adminRolesStore'
import { permissionCategories, actionLabels, actionColors } from '../model/schemas'
import type { Permission } from '@/shared/lib/localData'

interface PermissionsMatrixProps {
  selectedPermissions: string[]
  onPermissionChange: (permissionId: string, granted: boolean) => void
  readonly?: boolean
}

export const PermissionsMatrix: React.FC<PermissionsMatrixProps> = ({
  selectedPermissions,
  onPermissionChange,
  readonly = false,
}) => {
  const { permissions, getPermissionById } = useAdminRolesStore()

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'user-management':
        return Users
      case 'system-admin':
        return Settings
      case 'farm-operations':
        return Droplets
      case 'inventory-management':
        return Package
      case 'field-operations':
        return CheckSquare
      case 'reporting':
        return BarChart3
      default:
        return Shield
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return Plus
      case 'read':
        return Eye
      case 'update':
        return Edit
      case 'delete':
        return Trash2
      default:
        return Check
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    if (readonly) return

    const category = permissionCategories.find(c => c.id === categoryId)
    if (!category) return

    const categoryPermissions = category.permissionIds
      .map(id => getPermissionById(id))
      .filter(Boolean) as Permission[]
    const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p.id))

    categoryPermissions.forEach(permission => {
      onPermissionChange(permission.id, !allSelected)
    })
  }

  const isCategoryFullySelected = (categoryId: string) => {
    const category = permissionCategories.find(c => c.id === categoryId)
    if (!category) return false

    const categoryPermissions = category.permissionIds
      .map(id => getPermissionById(id))
      .filter(Boolean) as Permission[]
    return (
      categoryPermissions.length > 0 &&
      categoryPermissions.every(p => selectedPermissions.includes(p.id))
    )
  }

  const isCategoryPartiallySelected = (categoryId: string) => {
    const category = permissionCategories.find(c => c.id === categoryId)
    if (!category) return false

    const categoryPermissions = category.permissionIds
      .map(id => getPermissionById(id))
      .filter(Boolean) as Permission[]
    const selectedCount = categoryPermissions.filter(p => selectedPermissions.includes(p.id)).length
    return selectedCount > 0 && selectedCount < categoryPermissions.length
  }

  return (
    <div className="space-y-6">
      {/* Permissions Summary */}
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-800">
            {selectedPermissions.length} of {permissions.length} permissions selected
          </span>
        </div>
        {selectedPermissions.length > 0 && (
          <Badge variant="default" className="bg-green-600">
            {Math.round((selectedPermissions.length / permissions.length) * 100)}% Coverage
          </Badge>
        )}
      </div>

      {/* Permission Categories */}
      <div className="grid gap-6">
        {permissionCategories.map((category, index) => {
          const IconComponent = getCategoryIcon(category.id)
          const categoryPermissions = category.permissionIds
            .map(id => getPermissionById(id))
            .filter(Boolean) as Permission[]
          const isFullySelected = isCategoryFullySelected(category.id)
          const isPartiallySelected = isCategoryPartiallySelected(category.id)

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`${isFullySelected ? 'ring-2 ring-green-200' : isPartiallySelected ? 'ring-2 ring-yellow-200' : ''}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${isFullySelected ? 'bg-green-100' : 'bg-gray-100'}`}
                      >
                        <IconComponent
                          className={`h-5 w-5 ${isFullySelected ? 'text-green-600' : 'text-gray-600'}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {category.name}
                          {isFullySelected && <Check className="h-4 w-4 text-green-600" />}
                          {isPartiallySelected && (
                            <Badge variant="secondary" className="text-xs">
                              Partial
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>

                    {!readonly && (
                      <Checkbox
                        checked={isFullySelected}
                        indeterminate={isPartiallySelected}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {categoryPermissions.map(permission => {
                    const isSelected = selectedPermissions.includes(permission.id)

                    return (
                      <motion.div
                        key={permission.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        whileHover={{ scale: readonly ? 1 : 1.02 }}
                        whileTap={{ scale: readonly ? 1 : 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {!readonly && (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={checked =>
                                  onPermissionChange(permission.id, checked as boolean)
                                }
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{permission.name}</span>
                                {isSelected && readonly && (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{permission.description}</p>
                            </div>
                          </div>

                          {/* Action badges */}
                          <div className="flex gap-1">
                            {permission.actions.map(action => {
                              const ActionIcon = getActionIcon(action)
                              return (
                                <Badge
                                  key={action}
                                  variant="outline"
                                  className={`text-xs flex items-center gap-1 ${actionColors[action]}`}
                                >
                                  <ActionIcon className="h-3 w-3" />
                                  {actionLabels[action]}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}

                  {categoryPermissions.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No permissions in this category
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Permission Summary (for readonly mode) */}
      {readonly && selectedPermissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Permissions Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedPermissions.map(permId => {
                const permission = getPermissionById(permId)
                return permission ? (
                  <Badge key={permId} variant="default" className="text-xs">
                    {permission.name}
                  </Badge>
                ) : null
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
