import type { QueryClient } from "@tanstack/react-query";

export interface QueryError {
  message: string;
  status: number;
  data?: unknown;
  code?: string;
}

export interface RetryConfig {
  retry: number;
  retryDelay: (attemptIndex: number) => number;
  retryCondition?: (error: unknown) => boolean;
}

export interface OptimisticUpdateConfig<T> {
  queryClient: QueryClient;
  queryKey: unknown[];
  updater: (oldData: T, variables: unknown) => T;
}

export interface MutationConfig<T, V = unknown> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: QueryError, variables: V) => void;
  onSettled?: (
    data: T | undefined,
    error: QueryError | null,
    variables: V
  ) => void;
}

export interface QueryConfig {
  staleTime?: number;
  gcTime?: number;
  retry?: boolean | number;
  retryDelay?: number | ((attemptIndex: number) => number);
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  refetchOnReconnect?: boolean;
}
