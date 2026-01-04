import { useQuery } from "@tanstack/react-query";
import type { FactGroupResponse } from "../types/factType";
import { fetchAllFactGroup } from "../api/factApi";

export const useAllUserFactQuery = () => {
  return useQuery<FactGroupResponse[]>({
    queryKey: ["userFact"],
    queryFn: fetchAllFactGroup,
  });
};
