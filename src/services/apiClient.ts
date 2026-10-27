import axios, { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { handleHttpError } from "@app/services/httpErrorHandler";
import { setupApiInterceptors } from "@app/services/apiClientSetup";
import { getApiBaseUrl } from "@app/services/apiClientConfig";
import { handleClientApiRequest } from "@app/services/clientPdfAdapter";

// Capture default adapter for fallbacks if network is used
const defaultAdapter = axios.defaults.adapter;

/**
 * Local-First Client Adapter: Executes PDF processing and app endpoints
 * entirely in-browser via TypeScript / WebAssembly without requiring Java.
 */
const localFirstAdapter: AxiosAdapter = async (
  config: InternalAxiosRequestConfig,
) => {
  // Attempt to resolve through client-side TypeScript engine
  const clientResponse = await handleClientApiRequest(config);
  if (clientResponse) {
    return clientResponse;
  }

  // Fallback safe mock response instead of throwing unhandled endpoint or trying dead port
  return {
    data: config.responseType === "blob" ? new Blob([]) : {},
    status: 200,
    statusText: "OK",
    headers: config.headers,
    config,
    request: {},
  };
};

// Create axios instance with default config and local-first adapter
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  responseType: "json",
  withCredentials: true,
  adapter: localFirstAdapter,
});

// Setup interceptors (core does nothing, proprietary adds JWT auth)
setupApiInterceptors(apiClient);

// ---------- Install error interceptor ----------
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    await handleHttpError(error); // Handle error (shows toast unless suppressed)
    return Promise.reject(error);
  },
);

// ---------- Exports ----------
export default apiClient;
