/**
 * Desktop-specific API client with local-first client engine integration.
 * Executes PDF operations directly in-process via TypeScript/WASM,
 * falling back to Tauri native HTTP client only if needed.
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { create } from "@app/services/tauriHttpClient";
import { handleHttpError } from "@app/services/httpErrorHandler";
import { setupApiInterceptors } from "@app/services/apiClientSetup";
import { getApiBaseUrl } from "@app/services/apiClientConfig";
import { handleClientApiRequest } from "@app/services/clientPdfAdapter";

// Create Tauri HTTP client with default config
const apiClient = create({
  baseURL: getApiBaseUrl(),
  responseType: "json",
  withCredentials: false,
});

// Install local-first interceptor
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // If the request can be fulfilled client-side, short-circuit
  return config;
});

// Custom adapter / response hook: handle client operations
const originalPost = apiClient.post.bind(apiClient);
apiClient.post = (async (url: string, data?: unknown, config?: InternalAxiosRequestConfig) => {
  const reqConfig: InternalAxiosRequestConfig = {
    url,
    data,
    headers: config?.headers,
    responseType: config?.responseType || "json",
    ...config,
  } as InternalAxiosRequestConfig;

  const clientResponse = await handleClientApiRequest(reqConfig);
  if (clientResponse) {
    return clientResponse;
  }
  return originalPost(url, data, config);
}) as typeof apiClient.post;

const originalGet = apiClient.get.bind(apiClient);
apiClient.get = (async (url: string, config?: InternalAxiosRequestConfig) => {
  const reqConfig: InternalAxiosRequestConfig = {
    url,
    headers: config?.headers,
    responseType: config?.responseType || "json",
    ...config,
  } as InternalAxiosRequestConfig;

  const clientResponse = await handleClientApiRequest(reqConfig);
  if (clientResponse) {
    return clientResponse;
  }
  return originalGet(url, config);
}) as typeof apiClient.get;

// Setup interceptors (desktop-specific auth and backend ready checks)
setupApiInterceptors(apiClient as unknown as AxiosInstance);

// ---------- Install error interceptor ----------
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    await handleHttpError(error);
    return Promise.reject(error);
  },
);

// ---------- Exports ----------
export default apiClient;
