import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchUserProfile, updateProfile } from "../api/userApi";
import type { UpdateProfileRequest, UserResponse } from "../types/userType";

export const useProfileQuery = () => {
  return useQuery<UserResponse>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });
};

export const useUpdateProfile = () => {
  return useMutation<UserResponse, Error, UpdateProfileRequest>({
    mutationFn: updateProfile,
  });
};