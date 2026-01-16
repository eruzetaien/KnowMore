import type { ApiResponse } from "../types/apiType";
import type { CreateFactGroupRequest, CreateFactRequest, FactGroupResponse, FactResponse, UpdateFactGroupRequest, UpdateFactRequest } from "../types/factType";
import { apiRequest } from "./apiRequest";

export const fetchAllFactGroup = async (): Promise<ApiResponse<FactGroupResponse[]>> => {
  const endpoint = `${import.meta.env.VITE_FACT_BASE_URL}/groups`;

  return apiRequest<FactGroupResponse[]>(endpoint, "GET");
};

export const createFactGroup = async (
  requestBody: CreateFactGroupRequest
): Promise<ApiResponse<FactGroupResponse>> => {
  const endpoint = `${import.meta.env.VITE_FACT_BASE_URL}/groups`;

  return apiRequest<FactGroupResponse>(endpoint, "POST", requestBody);
};

export const createFact = async (
  requestBody: CreateFactRequest
): Promise<ApiResponse<FactResponse>> => {
  const endpoint = `${import.meta.env.VITE_FACT_BASE_URL}/facts`;

  return apiRequest<FactResponse>(endpoint, "POST", requestBody);
};

export const updateFactGroup = async (
  requestBody: UpdateFactGroupRequest
): Promise<ApiResponse<FactGroupResponse>> => {
  const endpoint = `${import.meta.env.VITE_FACT_BASE_URL}/groups/${requestBody.factGroupId}`;

  return apiRequest<FactGroupResponse>(endpoint, "PUT", {name:requestBody.name});
};

export const updateFact = async (
  requestBody: UpdateFactRequest
): Promise<ApiResponse<FactResponse>> => {
  const endpoint = `${import.meta.env.VITE_FACT_BASE_URL}/facts/${requestBody.factId}`;

  return apiRequest<FactResponse>(endpoint, "PUT", {description:requestBody.description});
};