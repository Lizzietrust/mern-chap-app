import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

// Common Axios request configurations
export const axiosConfigs = {
  // For JSON requests
  json: {
    headers: {
      "Content-Type": "application/json",
    },
  },

  // For form data
  formData: {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  },

  // For file uploads
  fileUpload: {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent: any) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      console.log("Upload progress:", percentCompleted);
    },
  },
};

// Helper function to create query functions for TanStack Query
export const createQueryFn = <T>(url: string, config?: AxiosRequestConfig) => {
  return async (): Promise<T> => {
    const response = await axios.get<T>(url, config);
    return response.data;
  };
};

// Helper function to create mutation functions for TanStack Query
export const createMutationFn = <T, D = any>(
  url: string,
  method: "post" | "put" | "patch" | "delete" = "post",
  config?: AxiosRequestConfig
) => {
  return async (data?: D): Promise<T> => {
    const response = await axios[method]<T>(url, data, config);
    return response.data;
  };
};

// Helper for handling errors in TanStack Query
export const handleQueryError = (error: any) => {
  if (axios.isAxiosError(error)) {
    // Axios error
    if (error.response) {
      // Server responded with error status
      return {
        message:
          error.response.data?.message || `Error ${error.response.status}`,
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: "Network error: No response received",
        status: 0,
      };
    }
  }

  // Generic error
  return {
    message: error.message || "An unexpected error occurred",
    status: 0,
  };
};

// Helper for retry logic
export const retryConfig = {
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
};

// Helper for optimistic updates
export const createOptimisticUpdate = <T>(
  queryClient: any,
  queryKey: any,
  updater: (oldData: T) => T
) => {
  return {
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, updater);

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (err: any, variables: any, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
  };
};
