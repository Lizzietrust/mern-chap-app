import type { AxiosRequestConfig, AxiosProgressEvent } from "axios";

export interface FileUploadConfig extends AxiosRequestConfig {
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void;
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

  fileUpload: (
    onProgress?: (percentage: number) => void
  ): FileUploadConfig => ({
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent: AxiosProgressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  }),

  fileDownload: (
    onProgress?: (percentage: number) => void
  ): FileUploadConfig => ({
    onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
    responseType: "blob" as const,
  }),

  withAuth: (token?: string): AxiosRequestConfig => ({
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  }),

  withTimeout: (timeout: number): AxiosRequestConfig => ({
    timeout,
  }),

  noCache: {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  } as AxiosRequestConfig,
};
