import type { AxiosRequestConfig } from "axios";
import { axiosInstance } from "../../api/axiosInstance";
import type { QueryConfig } from "../../../types/tanstack.types";

export const defaultQueryOptions: QueryConfig = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  refetchOnReconnect: true,
};

export const createQueryFn = <T>(url: string, config?: AxiosRequestConfig) => {
  return async (): Promise<T> => {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  };
};

export const createQueryFnWithParams = <T, P = Record<string, unknown>>(
  url: string | ((params: P) => string),
  config?: AxiosRequestConfig
) => {
  return async ({ queryKey }: { queryKey: [string, P] }): Promise<T> => {
    const [, params] = queryKey;
    const endpoint = typeof url === "function" ? url(params) : url;

    const response = await axiosInstance.get<T>(endpoint, {
      ...config,
      params,
    });

    return response.data;
  };
};

export const createInfiniteQueryFn = <T, P = Record<string, unknown>>(
  url: string | ((params: P) => string),
  config?: AxiosRequestConfig
) => {
  return async ({
    pageParam,
    queryKey,
  }: {
    pageParam?: unknown;
    queryKey: [string, P];
  }): Promise<T> => {
    const [, baseParams] = queryKey;
    const endpoint = typeof url === "function" ? url(baseParams) : url;

    const params = {
      ...baseParams,
      ...(pageParam && typeof pageParam === "object" ? pageParam : {}),
    };

    const response = await axiosInstance.get<T>(endpoint, {
      ...config,
      params,
    });

    return response.data;
  };
};
