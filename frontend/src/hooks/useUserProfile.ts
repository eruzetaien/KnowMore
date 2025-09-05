import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "../api/userApi";
import type { UserResponse } from "../types/userType";

export const useProfileQuery = () => {
  return useQuery<UserResponse>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });
};
