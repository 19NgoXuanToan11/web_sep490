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
