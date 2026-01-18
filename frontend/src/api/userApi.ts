import type { ApiResponse } from "../types/apiType";
import type { UpdateProfileRequest, UserResponse } from "../types/userType";
import { apiRequest } from "./apiRequest";

export const fetchUserProfile = async (): Promise<ApiResponse<UserResponse>> => {
  const endpoint = `${import.meta.env.VITE_AUTH_BASE_URL}/me`;

  return apiRequest<UserResponse>(endpoint, "GET");
};

export const updateProfile = async (
  requestBody: UpdateProfileRequest
): Promise<ApiResponse<UserResponse>> => {
  const endpoint = `${import.meta.env.VITE_AUTH_BASE_URL}/update`;

  return apiRequest<UserResponse>(endpoint, "PATCH", requestBody);
};

