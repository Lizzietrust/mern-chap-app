import type { QueryError } from "../../../types/tanstack.types";

const isAxiosError = (
  error: unknown
): error is {
  isAxiosError: boolean;
  response?: {
    status: number;
    data?: { message?: string; error?: string };
  };
  request?: unknown;
  message: string;
  code?: string;
} => {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
};

const isNetworkError = (error: unknown): boolean => {
  if (isAxiosError(error)) {
    return !error.response && !!error.request;
  }
  return false;
};

const isTimeoutError = (error: unknown): boolean => {
  if (isAxiosError(error)) {
    return error.code === "ECONNABORTED";
  }
  return false;
};

export const handleQueryError = (error: unknown): QueryError => {
  if (isAxiosError(error)) {
    if (error.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        `Request failed with status ${error.response.status}`;

      return {
        message,
        status: error.response.status,
        data: error.response.data,
        code: error.code,
      };
    } else if (isTimeoutError(error)) {
      return {
        message: "Request timeout - please try again",
        status: 0,
        code: "TIMEOUT",
      };
    } else if (isNetworkError(error)) {
      return {
        message: "Network error: Unable to connect to server",
        status: 0,
        code: "NETWORK_ERROR",
      };
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      status: 0,
      code: "UNKNOWN_ERROR",
    };
  }

  return {
    message: "An unexpected error occurred",
    status: 0,
    code: "UNKNOWN_ERROR",
  };
};

export const shouldRetry = (error: QueryError, attempt: number): boolean => {
  if (attempt >= 3) return false;

  if (error.status >= 400 && error.status < 500) return false;

  return (
    error.code === "NETWORK_ERROR" ||
    error.code === "TIMEOUT" ||
    (error.status >= 500 && error.status < 600)
  );
};
