// src/services/ApiService/types/users.ts

// Request bodies
export interface UpdatePasswordRequest {
  oldPassword: string
  newPassword: string
}

// Response bodies
export interface UserMeResponse {
  id: number
  username: string
  email: string
  roles: string[]
  // opcionalment més camps públics
}

export interface UpdatePasswordResponse {
  message: string
}

export interface PatchUserRequest {
  description?: string
  avatarUrl?: string
}

export interface PatchUserResponse {
  message: string
}
