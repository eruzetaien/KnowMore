import type { CreateFactGroupRequest, CreateFactRequest, FactGroupResponse, FactResponse } from "../types/factType";
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

export const createFact = async (
  requestBody: CreateFactRequest
): Promise<FactResponse> => {
  const endpoint = `${import.meta.env.VITE_FACT_BASE_URL}/facts`;

  return apiRequest<FactResponse>(endpoint, "POST", requestBody);
};
