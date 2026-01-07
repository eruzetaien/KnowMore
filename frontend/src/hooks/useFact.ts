import { useMutation, useQuery } from "@tanstack/react-query";
import type { CreateFactGroupRequest, CreateFactRequest, FactGroupResponse, FactResponse} from "../types/factType";
import { createFact, createFactGroup, fetchAllFactGroup } from "../api/factApi";

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

export const useCreateFact = () => {
  return useMutation<FactResponse, Error, CreateFactRequest>({
    mutationFn: createFact,
  });
};

