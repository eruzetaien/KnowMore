import type { CreateFactGroupRequest, CreateFactRequest, FactGroupResponse, FactResponse, UpdateFactRequest } from "../types/factType";
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

export const updateFact = async (
  requestBody: UpdateFactRequest
): Promise<FactResponse> => {
  const endpoint = `${import.meta.env.VITE_FACT_BASE_URL}/facts/${requestBody.factId}`;

  return apiRequest<FactResponse>(endpoint, "PUT", {description:requestBody.description});
};