echo "Starting toast refactor..."

files=$(grep -r "useToast" src/ --include="*.tsx" --include="*.ts" | cut -d: -f1 | sort | uniq)

for file in $files; do
    echo "Processing $file..."

    sed -i "s|import { useToast } from '@/shared/ui/use-toast'|import { showSuccessToast, showErrorToast, withBackendToast } from '@/shared/lib/toast-manager'|g" "$file"

    sed -i '/const { toast } = useToast()/d' "$file"

    sed -i 's/toast({[^}]*title: *['\''"]Lỗi[^}]*variant: *['\''"]destructive['\''"][^}]*})/showErrorToast(error)/g' "$file"

    sed -i 's/if (res?.message) toast({ title: res\.message })/showSuccessToast(res)/g' "$file"

    sed -i 's/if (res?.message) toast({ title: res\.message, variant: '\''success'\'' })/showSuccessToast(res)/g' "$file"

    sed -i 's/toast({ title: msg, variant: '\''destructive'\'' })/showErrorToast(error)/g' "$file"
done

echo "Toast refactor completed!"
