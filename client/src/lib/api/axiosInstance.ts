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
    timeout: 10000,
  });

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("auth_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
      if (error.response) {
        const { status, data } = error.response;
        const message = data?.message || `API Error: ${status}`;

        if (status === 401) {
          console.error("Unauthorized access - please login again");

          localStorage.removeItem("auth_token");
        }

        throw new Error(message);
      } else if (error.request) {
        throw new Error("Network error: No response received");
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  );

  return instance;
};

export const axiosInstance = createAxiosInstance();
