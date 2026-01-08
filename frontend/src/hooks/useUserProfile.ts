import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchUserProfile, updateProfile } from "../api/userApi";
import type { UpdateProfileRequest, UserResponse } from "../types/userType";
import toast from "react-hot-toast";

export const useProfileQuery = () => {
  return useQuery<UserResponse>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });
};

export const useUpdateProfile = () => {
  return useMutation<UserResponse, Error, UpdateProfileRequest>({
    mutationFn: updateProfile,

    onMutate: () => {
      toast.loading("Updating profile...", { id: "update-profile" });
    },

    onSuccess: () => {
      toast.success("Profile updated successfully!", {
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