import type { CreateFactGroupRequest, FactGroupResponse } from "../types/factType";
import { apiRequest } from "./apiRequest";

export const fetchAllFactGroup = async (): Promise<FactGroupResponse[]> => {
  const endpoint = `${import.meta.env.VITE_FACT_BASE_URL}/groups`;

  return apiRequest<FactGroupResponse[]>(endpoint, "GET");
};

export const createFactGroup = async (
  requestBody: CreateFactGroupRequest
): Promise<FactGroupResponse> => {
  const endpoint = `${import.meta.env.VITE_FACT_BASE_URL}/groups`;

  return apiRequest<FactGroupResponse>(endpoint, "POST", requestBody);
};
