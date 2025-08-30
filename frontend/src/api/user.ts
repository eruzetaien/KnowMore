import type { UserResponse } from "../types/user";
import { apiRequest } from "./apiRequest";

export const fetchUserProfile = async (): Promise<UserResponse> => {
  const endpoint = `${import.meta.env.VITE_AUTH_BASE_URL}/me`;

  return apiRequest<UserResponse>(endpoint, "GET");
};
