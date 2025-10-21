import type { AxiosRequestConfig } from "axios";
import type { QueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../api/axiosInstance";

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

export const createOptimisticUpdate = <T, V = unknown>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updater: (oldData: T, variables: V) => T
) => {
  return {
    onMutate: async (variables: V) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<T>(queryKey);

      queryClient.setQueryData<T>(queryKey, (old: T | undefined) =>
        old ? updater(old, variables) : old
      );

      return { previousData };
    },
    onError: (
      //   err: unknown,
      //   variables: V,
      context: { previousData?: T } | undefined
    ) => {
      if (context?.previousData) {
        queryClient.setQueryData<T>(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  };
};

export const createOptimisticMutation = <T, D = unknown>(
  url: string,
  method: "post" | "put" | "patch" | "delete" = "post",
  config: {
    queryClient: QueryClient;
    queryKey: unknown[];
    updater: (oldData: T, variables: D) => T;
    mutationConfig?: AxiosRequestConfig;
  }
) => {
  const mutationFn = createMutationFn<T, D>(url, method, config.mutationConfig);
  const optimisticConfig = createOptimisticUpdate<T, D>(
    config.queryClient,
    config.queryKey,
    config.updater
  );

  return {
    mutationFn,
    ...optimisticConfig,
  };
};

export const createMutationWithHandlers = <T, D = unknown, E = unknown>(
  url: string,
  method: "post" | "put" | "patch" | "delete" = "post",
  config?: AxiosRequestConfig & {
    onSuccess?: (data: T, variables: D) => void;
    onError?: (error: E, variables: D) => void;
    onSettled?: (data: T | undefined, error: E | null, variables: D) => void;
  }
) => {
  const mutationFn = createMutationFn<T, D>(url, method, config);

  return {
    mutationFn,
    onSuccess: config?.onSuccess,
    onError: config?.onError,
    onSettled: config?.onSettled,
  };
};
