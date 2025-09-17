import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Badge } from '@/shared/ui/badge'
import { useToast } from '@/shared/ui/use-toast'
import {
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Brain,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle,
  Save,
  X,
} from 'lucide-react'
import { useIrrigationStore } from '../store/irrigationStore'
import type { IrrigationRule } from '@/shared/lib/localData'
import { ruleFormSchema } from '../model/schemas'
import type { RuleFormData } from '../model/schemas'
import { formatDate } from '@/shared/lib/localData/storage'

interface RuleBuilderProps {
  className?: string
}

export function RuleBuilder({ className }: RuleBuilderProps) {
  const { rules, loadingStates, createRule, updateRule, deleteRule, toggleRule } =
    useIrrigationStore()
  const { toast } = useToast()
  const [editingRule, setEditingRule] = React.useState<IrrigationRule | null>(null)
  const [showCreateForm, setShowCreateForm] = React.useState(false)

  const handleDeleteRule = async (rule: IrrigationRule) => {
    try {
      await deleteRule(rule.id)
      toast({
        title: 'Đã xóa quy tắc',
        description: `"${rule.name}" đã được xóa thành công.`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Xóa thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleRule = async (rule: IrrigationRule) => {
    try {
      await toggleRule(rule.id, !rule.enabled)
      toast({
        title: 'Đã cập nhật quy tắc',
        description: `"${rule.name}" đã được ${!rule.enabled ? 'kích hoạt' : 'tắt'}.`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Cập nhật thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
        variant: 'destructive',
      })
    }
  }

  if (!rules.length && !loadingStates['create-rule']?.isLoading) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có quy tắc tưới</h3>
          <p className="text-muted-foreground mb-6">
            Tạo các quy tắc thông minh để tự động hoá hệ thống tưới dựa trên điều kiện.
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo quy tắc
          </Button>
        </div>

        {showCreateForm && (
          <RuleForm
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Trình tạo quy tắc</h2>
          <p className="text-muted-foreground">Tạo các quy tắc tự động cho hệ thống tưới</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Quy tắc mới
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-6">
          <RuleForm
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {editingRule && (
        <div className="mb-6">
          <RuleForm
            editingRule={editingRule}
            onSuccess={() => setEditingRule(null)}
            onCancel={() => setEditingRule(null)}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rules.map(rule => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onEdit={() => setEditingRule(rule)}
            onDelete={() => handleDeleteRule(rule)}
            onToggle={() => handleToggleRule(rule)}
            loading={loadingStates[`update-rule-${rule.id}`]?.isLoading}
          />
        ))}
      </div>
    </div>
  )
}

interface RuleFormProps {
  editingRule?: IrrigationRule
  onSuccess: () => void
  onCancel: () => void
}

function RuleForm({ editingRule, onSuccess, onCancel }: RuleFormProps) {
  const { createRule, updateRule, loadingStates } = useIrrigationStore()
  const { toast } = useToast()
  const isEditing = !!editingRule

  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: editingRule?.name || '',
      conditionText: editingRule?.conditionText || '',
      enabled: editingRule?.enabled ?? true,
    },
  })

  const isLoading =
    loadingStates[isEditing ? `update-rule-${editingRule?.id}` : 'create-rule']?.isLoading

  const onSubmit = async (data: RuleFormData) => {
    try {
      if (isEditing && editingRule) {
        await updateRule(editingRule.id, data)
        toast({
          title: 'Đã cập nhật quy tắc',
          description: `Đã cập nhật "${data.name}" thành công.`,
          variant: 'success',
        })
      } else {
        await createRule(data)
        toast({
          title: 'Đã tạo quy tắc',
          description: `Đã tạo "${data.name}" thành công.`,
          variant: 'success',
        })
      }
      onSuccess()
    } catch (error) {
      toast({
        title: isEditing ? 'Cập nhật thất bại' : 'Tạo thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
        variant: 'destructive',
      })
    }
  }

  const previewRule = () => {
    const name = form.watch('name')
    const condition = form.watch('conditionText')

    if (!name || !condition) return null

    return `Khi ${condition.toLowerCase()}, hệ thống sẽ tự động điều chỉnh tưới theo quy tắc "${name}".`
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {isEditing ? 'Sửa quy tắc' : 'Tạo quy tắc mới'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Rule Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Tên quy tắc</Label>
              <Input id="name" placeholder="VD: Ứng phó độ ẩm thấp" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Rule Condition */}
            <div className="space-y-2">
              <Label htmlFor="condition">Điều kiện</Label>
              <textarea
                id="condition"
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="VD: Nếu độ ẩm đất < 15%, chạy ngay trong 30 phút"
                {...form.register('conditionText')}
              />
              {form.formState.errors.conditionText && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.conditionText.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Mô tả điều kiện và hành động bằng ngôn ngữ tự nhiên
              </p>
            </div>

            {/* Preview */}
            {previewRule() && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Xem trước</span>
                </div>
                <p className="text-sm text-muted-foreground italic">{previewRule()}</p>
              </div>
            )}

            {/* Enabled Switch */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                {...form.register('enabled')}
              />
              <Label htmlFor="enabled" className="text-sm font-medium">
                Kích hoạt ngay
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? 'Cập nhật' : 'Tạo quy tắc'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

interface RuleCardProps {
  rule: IrrigationRule
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  loading?: boolean
}

function RuleCard({ rule, onEdit, onDelete, onToggle, loading }: RuleCardProps) {
  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{rule.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Tạo ngày {formatDate(rule.createdAt)}</p>
          </div>
          <Badge variant={rule.enabled ? 'success' : 'secondary'} className="text-xs">
            {rule.enabled ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Đang bật
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Đang tắt
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground italic">"{rule.conditionText}"</p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} disabled={loading}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onToggle}
            disabled={loading}
            className={rule.enabled ? '' : 'text-muted-foreground'}
          >
            {rule.enabled ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete} disabled={loading}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>

      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Đang xử lý...</span>
          </div>
        </div>
      )}
    </Card>
  )
}
