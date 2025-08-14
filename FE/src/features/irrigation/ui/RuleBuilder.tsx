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
        title: 'Rule Deleted',
        description: `"${rule.name}" has been deleted successfully.`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleRule = async (rule: IrrigationRule) => {
    try {
      await toggleRule(rule.id, !rule.enabled)
      toast({
        title: 'Rule Updated',
        description: `"${rule.name}" has been ${!rule.enabled ? 'enabled' : 'disabled'}.`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
        variant: 'destructive',
      })
    }
  }

  if (!rules.length && !loadingStates['create-rule']?.isLoading) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Irrigation Rules</h3>
          <p className="text-muted-foreground mb-6">
            Create intelligent rules to automate your irrigation system based on conditions.
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
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
          <h2 className="text-2xl font-semibold">Rule Builder</h2>
          <p className="text-muted-foreground">
            Create smart automation rules for your irrigation system
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Rule
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
          title: 'Rule Updated',
          description: `"${data.name}" has been updated successfully.`,
          variant: 'success',
        })
      } else {
        await createRule(data)
        toast({
          title: 'Rule Created',
          description: `"${data.name}" has been created successfully.`,
          variant: 'success',
        })
      }
      onSuccess()
    } catch (error) {
      toast({
        title: isEditing ? 'Update Failed' : 'Creation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
        variant: 'destructive',
      })
    }
  }

  const previewRule = () => {
    const name = form.watch('name')
    const condition = form.watch('conditionText')

    if (!name || !condition) return null

    return `When ${condition.toLowerCase()}, the system will automatically adjust irrigation according to the rule "${name}".`
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {isEditing ? 'Edit Rule' : 'Create New Rule'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Rule Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                placeholder="e.g., Low Moisture Emergency Response"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Rule Condition */}
            <div className="space-y-2">
              <Label htmlFor="condition">Rule Condition</Label>
              <textarea
                id="condition"
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="e.g., If soil moisture < 15%, run for 30 minutes immediately"
                {...form.register('conditionText')}
              />
              {form.formState.errors.conditionText && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.conditionText.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Describe the condition and action in plain language
              </p>
            </div>

            {/* Preview */}
            {previewRule() && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Preview</span>
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
                Enable rule immediately
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? 'Update Rule' : 'Create Rule'}
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
            <p className="text-sm text-muted-foreground">Created {formatDate(rule.createdAt)}</p>
          </div>
          <Badge variant={rule.enabled ? 'success' : 'secondary'} className="text-xs">
            {rule.enabled ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Inactive
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
            <span className="text-sm text-muted-foreground">Processing...</span>
          </div>
        </div>
      )}
    </Card>
  )
}
