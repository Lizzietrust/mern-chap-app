import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { axiosInstance, REQUEST_TIMEOUTS } from "./axiosInstance";

export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  private async request<T>(
    endpoint: string,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    const startTime = Date.now();

    try {
      console.log(`🔄 API Call: ${config.method} ${endpoint}`);
      const response = await this.axiosInstance.request<T>({
        url: endpoint,
        ...config,
      });

      const duration = Date.now() - startTime;
      console.log(
        `✅ API Success: ${config.method} ${endpoint} (${duration}ms)`
      );

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ API Failed: ${config.method} ${endpoint} (${duration}ms)`,
        error
      );
      throw error;
    }
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "GET",
      timeout: endpoint.includes("get-user-chats")
        ? REQUEST_TIMEOUTS.VERY_LONG
        : config?.timeout,
    });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      data,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      data,
    });
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      data,
    });
  }
}

export const apiClient = new ApiClient(axiosInstance);
