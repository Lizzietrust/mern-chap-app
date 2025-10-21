import type { AxiosRequestConfig, AxiosProgressEvent } from "axios";
import { axiosInstance } from "../api/axiosInstance";
import type { QueryClient } from "@tanstack/react-query";

export interface QueryError {
  message: string;
  status: number;
  data?: unknown;
}

export interface RetryConfig {
  retry: number;
  retryDelay: (attemptIndex: number) => number;
}

export interface OptimisticUpdateConfig<T> {
  queryClient: QueryClient;
  queryKey: unknown[];
  updater: (oldData: T, variables: unknown) => T;
}

export const axiosConfigs = {
  json: {
    headers: {
      "Content-Type": "application/json",
    },
  } as AxiosRequestConfig,

  formData: {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  } as AxiosRequestConfig,

  fileUpload: {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent: AxiosProgressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log("Upload progress:", percentCompleted);
      }
    },
  } as AxiosRequestConfig,
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

export const createMutationFn = <T, D = unknown>(
  url: string,
  method: "post" | "put" | "patch" | "delete" = "post",
  config?: AxiosRequestConfig
) => {
  return async (data?: D): Promise<T> => {
    const response = await axiosInstance[method]<T>(url, data, config);
    return response.data;
  };
};

export const createMutationFnWithParams = <T, D = unknown, P = unknown>(
  url: string | ((params: P) => string),
  method: "post" | "put" | "patch" | "delete" = "post",
  config?: AxiosRequestConfig
) => {
  return async ({ data, params }: { data?: D; params?: P }): Promise<T> => {
    const endpoint = typeof url === "function" ? url(params!) : url;
    const response = await axiosInstance[method]<T>(endpoint, data, config);
    return response.data;
  };
};

const isAxiosError = (
  error: unknown
): error is {
  isAxiosError: boolean;
  response?: { status: number; data?: { message?: string } };
  request?: unknown;
  message: string;
} => {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
};

export const handleQueryError = (error: unknown): QueryError => {
  if (isAxiosError(error)) {
    if (error.response) {
      return {
        message:
          error.response.data?.message || `Error ${error.response.status}`,
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      return {
        message: "Network error: No response received",
        status: 0,
      };
    }
  }

  return {
    message:
      error instanceof Error ? error.message : "An unexpected error occurred",
    status: 0,
  };
};

export const retryConfig: RetryConfig = {
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
};

export const createOptimisticUpdate = <T>(
  config: OptimisticUpdateConfig<T>
) => {
  return {
    onMutate: async (variables: unknown) => {
      const { queryClient, queryKey, updater } = config;

      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<T>(queryKey);

      queryClient.setQueryData<T>(queryKey, (old: T | undefined) =>
        old ? updater(old, variables) : old
      );

      return { previousData };
    },
    onError: (
      //   err: unknown,
      //   variables: unknown,
      context: { previousData?: T } | undefined
    ) => {
      const { queryClient, queryKey } = config;

      if (context?.previousData) {
        queryClient.setQueryData<T>(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      const { queryClient, queryKey } = config;

      queryClient.invalidateQueries({ queryKey });
    },
  };
};

export const defaultQueryOptions = {
  retry: retryConfig.retry,
  retryDelay: retryConfig.retryDelay,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
};

export const createQueryHook = <T, P = unknown>(
  queryKey: string,
  url: string | ((params: P) => string),
  config?: AxiosRequestConfig
) => {
  return (params?: P) => ({
    queryKey: params ? [queryKey, params] : [queryKey],
    queryFn: params
      ? createQueryFnWithParams<T, P>(url, config)
      : createQueryFn<T>(typeof url === "string" ? url : url(params!), config),
    ...defaultQueryOptions,
  });
};
