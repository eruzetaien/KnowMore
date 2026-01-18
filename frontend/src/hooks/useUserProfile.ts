import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchUserProfile, updateProfile } from "../api/userApi";
import type { UpdateProfileRequest, UserResponse } from "../types/userType";
import toast from "react-hot-toast";
import type { ApiResponse } from "../types/apiType";

export const useProfileQuery = () => {
  return useQuery<ApiResponse<UserResponse>>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });
};

export const useUpdateProfile = () => {
  return useMutation<ApiResponse<UserResponse>, Error, UpdateProfileRequest>({
    mutationFn: updateProfile,

    onMutate: () => {
      toast.loading("Updating profile...", { id: "update-profile" });
    },

    onSuccess: (apiResponse) => {
      toast.success(apiResponse.message, {
        id: "update-profile",
      });
    },

    onError: (error) => {
      toast.error(error.message || "Failed to update profile", {
        id: "update-profile",
      });
    },
  });
};