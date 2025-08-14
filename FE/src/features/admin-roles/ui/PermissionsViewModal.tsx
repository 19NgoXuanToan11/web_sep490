import React from 'react'
import { Shield, Users, Eye, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Badge } from '@/shared/ui/badge'
import { PermissionsMatrix } from './PermissionsMatrix'
import { SYSTEM_ROLES } from '../model/schemas'
import type { Role } from '@/shared/lib/localData'
import { formatDate } from '@/shared/lib/localData/storage'

interface PermissionsViewModalProps {
  isOpen: boolean
  onClose: () => void
  role?: Role | null
}

export const PermissionsViewModal: React.FC<PermissionsViewModalProps> = ({
  isOpen,
  onClose,
  role,
}) => {
  if (!role) return null

  const isSystemRole = SYSTEM_ROLES.includes(role.name)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Role Permissions: {role.name}
            {isSystemRole && (
              <Badge variant="outline" className="ml-2">
                System Role
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            View all permissions granted to this role.
            {isSystemRole ? ' This is a built-in system role.' : ' This is a custom role.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Role Name</h4>
              <div className="flex items-center gap-2">
                <Badge variant={isSystemRole ? 'default' : 'secondary'}>{role.name}</Badge>
                {isSystemRole && (
                  <Badge variant="outline" className="text-xs">
                    System
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Permissions Count</h4>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-600" />
                <span className="text-sm">{role.permissions.length} permissions</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Created</h4>
              <span className="text-sm text-gray-600">{formatDate(role.createdAt)}</span>
            </div>

            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Last Modified</h4>
              <span className="text-sm text-gray-600">{formatDate(role.updatedAt)}</span>
            </div>

            <div className="md:col-span-2">
              <h4 className="font-medium text-sm text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{role.description}</p>
            </div>
          </div>

          {/* Permissions Matrix (Read-only) */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Granted Permissions
            </h3>

            {role.permissions.length > 0 ? (
              <div className="border rounded-lg p-4">
                <PermissionsMatrix
                  selectedPermissions={role.permissions}
                  onPermissionChange={() => {}} // Read-only
                  readonly={true}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No permissions assigned</p>
                <p className="text-sm">This role has no permissions granted.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
