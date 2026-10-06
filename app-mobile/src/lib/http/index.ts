import { env } from "@/config/env";
import { getTokenStorage } from "@/lib/storage";
import { ApiClient } from "./ApiClient";

let instance: ApiClient | null = null;

export function getApiClient(): ApiClient {
  instance ??= new ApiClient({
    baseUrl: env.apiUrl,
    getToken: () => getTokenStorage().get(),
  });
  return instance;
}

export { ApiError } from "./ApiError";
