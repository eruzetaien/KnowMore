import { useMutation, useQuery } from "@tanstack/react-query";
import type { FactGroupResponse } from "../types/factType";
import { createSharedFact, fetchAllFactGroup } from "../api/factApi";

export const useAllUserFactQuery = () => {
  return useQuery<FactGroupResponse[]>({
    queryKey: ["userProfile"],
    queryFn: fetchAllFactGroup,
  });
};

export const useCreateSharedFact = () => {
  return useMutation<void, Error, number>({
    mutationFn: createSharedFact,
  });
};