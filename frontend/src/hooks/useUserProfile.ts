import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "../api/user";
import type { UserResponse } from "../types/user";

export const useUserProfile = () => {
  return useQuery<UserResponse>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });
};
