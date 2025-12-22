export interface UserResponse {
  username: string;
  description: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface UpdateProfileRequest {
  username?: string;
  description?: string;
}
