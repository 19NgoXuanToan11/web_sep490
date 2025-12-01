import { http } from '@/shared/api/client'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  Token?: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword: string
}

export interface BasicResponse {
  status: number
  message: string
}

export const authApi = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const { data } = await http.post<LoginResponse>('/v1/account/login', payload)
    return data
  },
  register: async (payload: RegisterRequest): Promise<BasicResponse> => {
    const { data } = await http.post<BasicResponse>('/v1/account/register', payload)
    return data
  },
}

export interface AccountProfileDto {
  accountProfileId?: number
  fullname?: string
  phone?: string
  address?: string
  gender?: string
  images?: string
  createdAt?: string
  updatedAt?: string
}

export interface AccountDto {
  accountId: number
  email: string
  role: 'Customer' | 'Manager' | 'Staff'
  status: 'Active' | 'Inactive' | 'ACTIVE' | number
  createdAt?: string
  updatedAt?: string
  accountProfile?: AccountProfileDto
}

export interface AccountFormRequest {
  email: string
  gender: number // 0: Male, 1: Female, 2: Other
  role: number // 0: Customer, 1: Admin, 2: Manager, 3: Staff
  phone: string
  fullname: string
  address: string
  images?: string
}

export interface UpdatePasswordRequest {
  email: string
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ProfileDto {
  accountId: number
  email: string
  fullName?: string
  phoneNumber?: string
  address?: string
  gender?: string
}

export interface UpdateProfileRequest {
  fullName?: string
  phoneNumber?: string
  address?: string
  gender?: string
}

export interface PaginationResponse<T> {
  totalItemCount: number
  pageSize: number
  totalPagesCount: number
  pageIndex: number
  next: boolean
  previous: boolean
  items: T[]
}

export const accountApi = {
  getAll: async (params?: {
    pageSize?: number
    pageIndex?: number
    status?: 'Active' | 'Inactive'
    role?: 'Customer' | 'Manager' | 'Staff'
  }): Promise<PaginationResponse<AccountDto>> => {
    const queryParams = new URLSearchParams()
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params?.pageIndex) queryParams.append('pageIndex', params.pageIndex.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.role) queryParams.append('role', params.role)

    const url = `/v1/account/get-all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const { data } = await http.get<PaginationResponse<AccountDto>>(url)
    return data
  },
  getByEmail: async (email: string): Promise<AccountDto> => {
    const { data } = await http.get<AccountDto>(
      `/v1/account/get-by-email?email=${encodeURIComponent(email)}`
    )
    return data
  },
  create: async (payload: AccountFormRequest): Promise<BasicResponse> => {
    const { data } = await http.post<BasicResponse>('/v1/account/create', payload)
    return data
  },
  update: async (id: number, payload: AccountFormRequest): Promise<BasicResponse> => {
    const { data } = await http.put<BasicResponse>(`/v1/account/update/${id}`, payload)
    return data
  },
  updateStatus: async (id: number): Promise<BasicResponse> => {
    const { data } = await http.put<BasicResponse>(`/v1/account/update-status/${id}`)
    return data
  },
  updateRole: async (accountId: number, roleId: number): Promise<BasicResponse> => {
    const { data } = await http.put<BasicResponse>(
      `/v1/account/update-role?accountId=${accountId}&roleId=${roleId}`
    )
    return data
  },
  updatePassword: async (
    id: number,
    payload: { oldPassword: string; newPassword: string; confirmPassword: string }
  ): Promise<BasicResponse> => {
    const { data } = await http.put<BasicResponse>(`/v1/account/update-password?id=${id}`, payload)
    return data
  },
  updatePasswordBy: async (id: number, newPassword: string): Promise<BasicResponse> => {
    const { data } = await http.put<BasicResponse>(
      `/v1/account/update-password-by/${id}?requestPassword=${encodeURIComponent(newPassword)}`
    )
    return data
  },
}
