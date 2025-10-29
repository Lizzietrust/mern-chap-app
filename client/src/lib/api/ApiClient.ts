import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { axiosInstance } from "./axiosInstance";

export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  private async request<T>(
    endpoint: string,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      console.log(`🔄 API Call: ${config.method} ${endpoint}`);
      const response = await this.axiosInstance.request<T>({
        url: endpoint,
        ...config,
      });
      console.log(`✅ API Success: ${config.method} ${endpoint}`);
      return response.data;
    } catch (error) {
      console.error(`❌ API Failed: ${config.method} ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "GET" });
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
