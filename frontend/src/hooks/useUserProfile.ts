import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "../api/user";
import type { UserResponse } from "../types/userType";

export const useUserProfile = () => {
  return useQuery<UserResponse>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });
};
