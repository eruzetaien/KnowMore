import type { ApiResponse } from "../types/apiType";
import { redirectIfNotOn } from "../utils/redirect";

export const apiRequest = async <T>(
  url: string,
  method: string,
  body: object = {},
  headers: Record<string, string> = {}
): Promise<ApiResponse<T>> => {
  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
  };

  if (method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (response.status === 401) {
    redirectIfNotOn("/login");
   
    throw new Error("Unauthorized - redirecting to login");
  }

  try {
    const result = await response.json();
    return result;
  } catch {
    const message = await response.text().catch(() => "Something went wrong");
    throw new Error(`HTTP ${response.status}: ${message}`);
  }
};
