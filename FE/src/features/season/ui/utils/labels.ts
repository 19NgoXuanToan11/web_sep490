export const activityTypeLabels: Record<string, string> = {
  SoilPreparation: 'Chuẩn bị đất trước gieo',
  Sowing: 'Gieo hạt',
  Thinning: 'Tỉa cây con cho đều',
  FertilizingDiluted: 'Bón phân pha loãng (NPK 20–30%)',
  Weeding: 'Nhổ cỏ nhỏ',
  PestControl: 'Phòng trừ sâu bằng thuốc sinh học',
  FertilizingLeaf: 'Bón phân cho lá (N, hữu cơ)',
  Harvesting: 'Thu hoạch',
  CleaningFarmArea: 'Dọn dẹp đồng ruộng',
  FrostProtectionCovering: 'Phủ bạt che lạnh',
}

export const plantStageLabels: Record<string, string> = {
  Preparation: 'Chuẩn bị gieo trồng',
  Seedling: 'Nảy mầm',
  Vegetative: 'Tăng trưởng lá',
  Harvest: 'Thu hoạch',
}

export const PLANT_STAGE_ORDER = ['Preparation', 'Seedling', 'Vegetative', 'Harvest']

export const statusOptions = [
  { value: 0, label: 'Vô hiệu hóa' },
  { value: 1, label: 'Hoạt động' },
  { value: 2, label: 'Hoàn thành' },
]

export const farmActivityStatusOptions = [
  { value: 'ACTIVE', label: 'Hoạt động', variant: 'golden' as const },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện', variant: 'processing' as const },
  { value: 'COMPLETED', label: 'Hoàn thành', variant: 'completed' as const },
  { value: 'DEACTIVATED', label: 'Tạm dừng', variant: 'destructive' as const },
]

export const staffStatusOptions = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'DEACTIVATED', label: 'Vô hiệu hóa' },
]

export const diseaseOptions = [{ value: -1, label: 'Không có bệnh' }]

export const diseaseEnumMap: Record<string, number> = {
  DownyMildew: 0,
  PowderyMildew: 1,
  LeafSpot: 2,
  BacterialSoftRot: 3,
  FusariumWilt: 4,
  Anthracnose: 5,
  DampingOff: 6,
  BlackRot: 7,
  MosaicVirus: 8,
  AphidInfestation: 9,
  ThripsDamage: 10,
  WhiteflyInfestation: 11,
}

export const translateActivityType = (type: string) => activityTypeLabels[type] ?? type

export const translatePlantStage = (stage?: string | null) => {
  if (!stage) return '-'
  return plantStageLabels[stage] ?? stage
}

export const getFarmActivityStatusInfo = (
  status: string | null | undefined
): {
  label: string
  variant: 'golden' | 'processing' | 'completed' | 'destructive' | 'outline'
} => {
  if (!status) {
    return { label: 'Không xác định', variant: 'outline' }
  }

  const normalizedStatus = status.toUpperCase()

  switch (normalizedStatus) {
    case 'ACTIVE':
      return { label: 'Hoạt động', variant: 'golden' }
    case 'IN_PROGRESS':
      return { label: 'Đang thực hiện', variant: 'processing' }
    case 'COMPLETED':
      return { label: 'Hoàn thành', variant: 'completed' }
    case 'DEACTIVATED':
      return { label: 'Tạm dừng', variant: 'destructive' }
    default:
      return { label: status, variant: 'outline' }
  }
}

export const getStatusLabel = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') {
    if (value === 'ACTIVE') return 'Hoạt động'
    if (value === 'DEACTIVATED') return 'Vô hiệu hóa'
    if (value === 'COMPLETED') return 'Hoàn thành'
    return value
  }
  return statusOptions.find(option => option.value === value)?.label ?? String(value)
}

export const isActiveStatus = (status: number | string | null | undefined) => {
  if (status === null || status === undefined) return false
  if (typeof status === 'string') {
    return status === 'ACTIVE'
  }
  return status === 1
}

export const getStatusVariant = (
  value: number | string | null | undefined
): 'golden' | 'processing' | 'completed' | 'destructive' | 'outline' => {
  if (value === null || value === undefined) return 'outline'

  if (typeof value === 'string') {
    const normalized = value.toUpperCase()
    switch (normalized) {
      case 'ACTIVE':
        return 'golden'
      case 'IN_PROGRESS':
        return 'processing'
      case 'COMPLETED':
        return 'completed'
      case 'DEACTIVATED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (typeof value === 'number') {
    if (value === 1) return 'golden'
    if (value === 2) return 'completed'
    if (value === 0) return 'destructive'
  }

  return 'outline'
}

export const getDiseaseLabel = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return 'Không có'

  if (typeof value === 'number') {
    if (value === -1) return 'Không có'
    return diseaseOptions.find(option => option.value === value)?.label ?? String(value)
  }

  const normalized = String(value).trim()
  if (normalized === '' || normalized.toLowerCase() === 'none' || normalized === '-1') {
    return 'Không có'
  }

  return diseaseOptions.find(option => String(option.value) === normalized)?.label ?? normalized
}

export const getDiseaseSelectValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-1'
  return String(value)
}

export const parseDiseaseStatus = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const maybeNum = Number(value)
    if (!Number.isNaN(maybeNum)) return maybeNum
    const mapped = (diseaseEnumMap as any)[value]
    return mapped !== undefined ? mapped : undefined
  }
  return undefined
}
