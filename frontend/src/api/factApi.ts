import type { FactGroupResponse } from "../types/factType";
import { apiRequest } from "./apiRequest";

export const fetchAllFactGroup = async (): Promise<FactGroupResponse[]> => {
  const endpoint = `${import.meta.env.VITE_FACT_BASE_URL}/groups`;

  return apiRequest<FactGroupResponse[]>(endpoint, "GET");
};

export const createSharedFact = async (factId: number): Promise<void> => {
  const endpoint = `${import.meta.env.VITE_FACT_BASE_URL}/shared-facts/${factId}`;

  return apiRequest<void>(endpoint, "POST");
};