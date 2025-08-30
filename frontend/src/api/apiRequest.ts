export const apiRequest = async <T>(
  url: string,
  method: string,
  body: object = {},
  headers: Record<string, string> = {}
): Promise<T> => {
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

  try {
    const result = await response.json();
    return result;
  } catch {
    const message = await response.text().catch(() => "Something went wrong");
    throw new Error(`HTTP ${response.status}: ${message}`);
  }
};
