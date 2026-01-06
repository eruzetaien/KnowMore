import { useMutation, useQuery } from "@tanstack/react-query";
import type { CreateFactGroupRequest, FactGroupResponse} from "../types/factType";
import { createFactGroup, fetchAllFactGroup } from "../api/factApi";

export const useAllUserFactQuery = () => {
  return useQuery<FactGroupResponse[]>({
    queryKey: ["userFact"],
    queryFn: fetchAllFactGroup,
  });
};

export const useCreateFactGroup = () => {
  return useMutation<FactGroupResponse, Error, CreateFactGroupRequest>({
    mutationFn: createFactGroup,
  });
};
