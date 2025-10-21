import type { AxiosRequestConfig } from "axios";
import {
  createQueryFn,
  createQueryFnWithParams,
  defaultQueryOptions,
} from "./query-factories";
import type { QueryConfig } from "../../../types/tanstack.types";

interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    nextCursor?: string | number | null;
    hasNextPage?: boolean;
    nextPage?: number;
    totalPages?: number;
    total?: number;
    currentPage?: number;
  };
}

const isPaginatedResponse = (
  value: unknown
): value is PaginatedResponse<unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    Array.isArray((value as PaginatedResponse<unknown>).data)
  );
};

export const createQueryHook = <T, P = unknown>(
  queryKey: string,
  url: string | ((params: P) => string),
  config?: AxiosRequestConfig & { queryConfig?: Partial<QueryConfig> }
) => {
  return (params?: P) => ({
    queryKey: params ? [queryKey, params] : [queryKey],
    queryFn: params
      ? createQueryFnWithParams<T, P>(url, config)
      : createQueryFn<T>(typeof url === "string" ? url : url(params!), config),
    ...defaultQueryOptions,
    ...config?.queryConfig,
  });
};

export const createInfiniteQueryHook = <T, P = unknown>(
  queryKey: string,
  url: string | ((params: P) => string),
  config?: AxiosRequestConfig & {
    queryConfig?: Partial<QueryConfig>;
    getNextPageParam?: (
      lastPage: T,
      allPages: T[]
    ) => unknown | null | undefined;
  }
) => {
  const defaultGetNextPageParam = (lastPage: unknown): unknown | null => {
    if (isPaginatedResponse(lastPage)) {
      const { pagination } = lastPage;

      if (pagination?.nextCursor) {
        return { cursor: pagination.nextCursor };
      }
      if (pagination?.nextPage) {
        return { page: pagination.nextPage };
      }
      if (pagination?.hasNextPage && pagination.currentPage) {
        return { page: pagination.currentPage + 1 };
      }
    }

    if (Array.isArray(lastPage) && lastPage.length > 0) {
      return { page: 1 };
    }

    return null;
  };

  return (params?: P) => ({
    queryKey: params ? [queryKey, params] : [queryKey],
    queryFn: createQueryFnWithParams<T, P>(url, config),
    initialPageParam: null as unknown,
    getNextPageParam: config?.getNextPageParam || defaultGetNextPageParam,
    ...defaultQueryOptions,
    ...config?.queryConfig,
  });
};

export const createPaginatedQueryHook = <T, P = unknown>(
  queryKey: string,
  url: string | ((params: P & { page?: number; limit?: number }) => string),
  config?: AxiosRequestConfig & { queryConfig?: Partial<QueryConfig> }
) => {
  return (params?: P & { page?: number; limit?: number }) => ({
    queryKey: params ? [queryKey, params] : [queryKey],
    queryFn: params
      ? createQueryFnWithParams<T, P & { page?: number; limit?: number }>(
          url,
          config
        )
      : createQueryFn<T>(typeof url === "string" ? url : url(params!), config),
    ...defaultQueryOptions,
    ...config?.queryConfig,
  });
};

export const createFilteredQueryHook = <T, P = unknown, F = unknown>(
  queryKey: string,
  url: string | ((params: P & { filters?: F }) => string),
  config?: AxiosRequestConfig & { queryConfig?: Partial<QueryConfig> }
) => {
  return (params?: P & { filters?: F }) => ({
    queryKey: params ? [queryKey, params] : [queryKey],
    queryFn: params
      ? createQueryFnWithParams<T, P & { filters?: F }>(url, config)
      : createQueryFn<T>(typeof url === "string" ? url : url(params!), config),
    ...defaultQueryOptions,
    ...config?.queryConfig,
  });
};

export const createSortedQueryHook = <T, P = unknown, S = unknown>(
  queryKey: string,
  url: string | ((params: P & { sort?: S; order?: "asc" | "desc" }) => string),
  config?: AxiosRequestConfig & { queryConfig?: Partial<QueryConfig> }
) => {
  return (params?: P & { sort?: S; order?: "asc" | "desc" }) => ({
    queryKey: params ? [queryKey, params] : [queryKey],
    queryFn: params
      ? createQueryFnWithParams<T, P & { sort?: S; order?: "asc" | "desc" }>(
          url,
          config
        )
      : createQueryFn<T>(typeof url === "string" ? url : url(params!), config),
    ...defaultQueryOptions,
    ...config?.queryConfig,
  });
};
