# Axios + TanStack Query Setup

This guide explains how to use Axios for API requests alongside TanStack Query in your MERN chat application.

## Overview

Your project now has both a custom fetch-based API client and an Axios-based implementation. The Axios setup provides:

- **Better error handling** with automatic error parsing
- **Request/response interceptors** for global configuration
- **Progress tracking** for file uploads
- **Automatic request cancellation** when components unmount
- **Built-in retry logic** and timeout handling

## Current Setup

### 1. Axios Instance Configuration (`src/lib/api`)

The main Axios instance is configured with:

```typescript
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // For handling cookies/sessions
});
```

### 2. Request Interceptors

Automatically adds authentication tokens and handles common headers:

```typescript
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

### 3. Response Interceptors

Handles common error scenarios:

```typescript
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server error
      throw new Error(
        error.response.data?.message || `API Error: ${error.response.status}`
      );
    } else if (error.request) {
      // Network error
      throw new Error("Network error: No response received");
    } else {
      // Other error
      throw new Error(`Request error: ${error.message}`);
    }
  }
);
```

## Usage Patterns

### Pattern 1: Using the Existing API Client (Recommended)

Your existing hooks continue to work unchanged:

```typescript
// This still works exactly the same
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: userApi.getUsers, // Uses Axios under the hood
  });
}
```

### Pattern 2: Direct Axios with TanStack Query

```typescript
import axios from "axios";

export function useTodos() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await axios.get<Todo[]>("/api/todos");
      return response.data;
    },
  });
}
```

### Pattern 3: Using Helper Functions

```typescript
import { createQueryFn, createMutationFn } from "../lib/axios-utils";

export function useTodos() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: createQueryFn<Todo[]>("/api/todos"),
  });
}

export function useCreateTodo() {
  return useMutation({
    mutationFn: createMutationFn<Todo, CreateTodoRequest>("/api/todos", "post"),
  });
}
```

## Advanced Features

### 1. File Uploads

```typescript
export function useFileUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post<{ url: string }>(
        "/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log("Upload progress:", percentCompleted);
          },
        }
      );

      return response.data;
    },
  });
}
```

### 2. Optimistic Updates

```typescript
export function useOptimisticUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.put<Todo>(`/api/todos/${id}`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["todos", id] });

      // Snapshot previous value
      const previousTodo = queryClient.getQueryData(["todos", id]);

      // Optimistically update
      queryClient.setQueryData(["todos", id], {
        ...previousTodo,
        ...data,
      });

      return { previousTodo };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTodo) {
        queryClient.setQueryData(["todos", variables.id], context.previousTodo);
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch
      queryClient.invalidateQueries({ queryKey: ["todos", variables.id] });
    },
  });
}
```

### 3. Custom Axios Instances

For different APIs or configurations:

```typescript
const externalApi = axios.create({
  baseURL: "https://api.external.com",
  timeout: 5000,
  headers: {
    "X-API-Key": process.env.EXTERNAL_API_KEY,
  },
});

export function useExternalData() {
  return useQuery({
    queryKey: ["external-data"],
    queryFn: async () => {
      const response = await externalApi.get("/data");
      return response.data;
    },
  });
}
```

## Error Handling

### Global Error Handling

The response interceptor handles common errors automatically. For specific error handling:

```typescript
export function useTodosWithErrorHandling() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      try {
        const response = await axios.get<Todo[]>("/api/todos");
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            // Handle unauthorized
            throw new Error("Please login to continue");
          } else if (error.response?.status === 404) {
            // Handle not found
            throw new Error("Todos not found");
          }
        }
        throw error;
      }
    },
  });
}
```

### Using Error Helpers

```typescript
import { handleQueryError } from "../lib/axios-utils";

export function useTodosWithHelper() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      try {
        const response = await axios.get<Todo[]>("/api/todos");
        return response.data;
      } catch (error) {
        const errorInfo = handleQueryError(error);
        throw new Error(errorInfo.message);
      }
    },
  });
}
```

## Best Practices

### 1. Query Keys

Use consistent query key patterns:

```typescript
export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
};
```

### 2. Retry Logic

```typescript
import { retryConfig } from "../lib/axios-utils";

export function useTodos() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await axios.get<Todo[]>("/api/todos");
      return response.data;
    },
    ...retryConfig, // 3 retries with exponential backoff
  });
}
```

### 3. Loading States

```typescript
export function useTodos() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await axios.get<Todo[]>("/api/todos");
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return <div>{/* Render todos */}</div>;
}
```

## Migration from Fetch

If you have existing fetch-based code, you can migrate gradually:

1. **Keep existing API functions** - they work with the new Axios setup
2. **Add new endpoints** using Axios patterns
3. **Gradually replace** fetch calls with Axios where needed

## Environment Variables

Make sure your `.env` file includes:

```env
VITE_API_URL=http://localhost:5000
```

## Testing

For testing with Axios, you can mock the Axios instance:

```typescript
import axios from "axios";
import { vi } from "vitest";

vi.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

test("fetches todos", async () => {
  mockedAxios.get.mockResolvedValue({
    data: [{ id: 1, title: "Test todo" }],
  });

  // Your test code here
});
```

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure your server allows requests from your client origin
2. **Authentication**: Check that tokens are being sent correctly in request headers
3. **Timeout issues**: Adjust timeout settings in the Axios configuration
4. **Type errors**: Make sure to import Axios types correctly

### Debug Tips

1. Use browser dev tools to inspect network requests
2. Add console logs in interceptors to debug request/response flow
3. Use TanStack Query DevTools to monitor query states
4. Check Axios error responses for detailed error information

This setup provides a robust foundation for handling API requests with Axios and TanStack Query in your MERN chat application.
