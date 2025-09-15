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
  me: async (): Promise<{ accountId: number; email: string; role: string }> => {
    const { data } = await http.get<{ accountId: number; email: string; role: string }>(
      '/v1/account-profile/profile'
    )
    return data
  },
}

// Account and AccountProfile APIs
export interface AccountDto {
  id: number
  email: string
  role: 'Admin' | 'Manager' | 'Staff'
  status: 'Active' | 'Inactive'
}

export interface CreateAccountRequest {
  email: string
  password: string
  role: 'Admin' | 'Manager' | 'Staff'
}

export interface UpdateAccountRequest {
  email?: string
  role?: 'Admin' | 'Manager' | 'Staff'
}

export interface UpdateStatusRequest {
  status: 'Active' | 'Inactive'
}

export interface UpdateRoleRequest {
  email: string
  role: 'Admin' | 'Manager' | 'Staff'
}

export interface UpdatePasswordRequest {
  email: string
  oldPassword?: string
  newPassword: string
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

export const accountApi = {
  getAll: async (): Promise<AccountDto[]> => {
    const { data } = await http.get<AccountDto[]>('/v1/account/get-all')
    return data
  },
  getByEmail: async (email: string): Promise<AccountDto> => {
    const { data } = await http.get<AccountDto>(
      `/v1/account/get-by-email?email=${encodeURIComponent(email)}`
    )
    return data
  },
  create: async (payload: CreateAccountRequest): Promise<BasicResponse> => {
    const { data } = await http.post<BasicResponse>('/v1/account/create', payload)
    return data
  },
  update: async (id: number, payload: UpdateAccountRequest): Promise<BasicResponse> => {
    const { data } = await http.put<BasicResponse>(`/v1/account/update/${id}`, payload)
    return data
  },
  updateStatus: async (id: number, payload: UpdateStatusRequest): Promise<BasicResponse> => {
    const { data } = await http.put<BasicResponse>(`/v1/account/update-status/${id}`, payload)
    return data
  },
  updateRole: async (payload: UpdateRoleRequest): Promise<BasicResponse> => {
    const { data } = await http.put<BasicResponse>('/v1/account/update-role', payload)
    return data
  },
  updatePassword: async (payload: UpdatePasswordRequest): Promise<BasicResponse> => {
    const { data } = await http.put<BasicResponse>('/v1/account/update-password', payload)
    return data
  },
}

export const profileApi = {
  getProfile: async (): Promise<ProfileDto> => {
    const { data } = await http.get<ProfileDto>('/v1/account-profile/profile')
    return data
  },
  updateProfile: async (payload: UpdateProfileRequest): Promise<BasicResponse> => {
    const { data } = await http.put<BasicResponse>('/v1/account-profile/update', payload)
    return data
  },
}
