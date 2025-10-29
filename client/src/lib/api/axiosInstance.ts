import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL;

export const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
    timeout: 30000,
    timeoutErrorMessage:
      "Request timeout - server is taking too long to respond",
  });

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("auth_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          baseURL: config.baseURL,
          timeout: config.timeout,
          withCredentials: config.withCredentials,
        }
      );

      return config;
    },
    (error) => {
      console.error("❌ Request interceptor error:", error);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log(
        `✅ API Response: ${response.status} ${response.config.url}`,
        {
          data: response.data,
        }
      );
      return response;
    },
    (error) => {
      console.error("❌ API Error:", {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response) {
        const { status, data } = error.response;
        const message = data?.message || `API Error: ${status}`;

        if (status === 401) {
          console.error("🔐 Unauthorized access - clearing auth token");
          localStorage.removeItem("auth_token");
        } else if (status >= 500) {
          console.error("🚨 Server error - please try again later");
        }

        throw new Error(message);
      } else if (error.request) {
        if (error.code === "ECONNABORTED") {
          throw new Error(
            `Request timeout after ${error.config.timeout}ms - server may be overloaded`
          );
        } else {
          throw new Error(
            "Network error: Unable to connect to server. Please check your internet connection."
          );
        }
      } else {
        throw new Error(`Request configuration error: ${error.message}`);
      }
    }
  );

  return instance;
};

export const axiosInstance = createAxiosInstance();
