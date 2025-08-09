import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  createQueryFn,
  createMutationFn,
  handleQueryError,
  retryConfig,
} from "../lib/axios-utils";

// Example interfaces
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

interface CreateTodoRequest {
  title: string;
  userId: number;
}

interface UpdateTodoRequest {
  title?: string;
  completed?: boolean;
}

// Query keys
export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
};

// Example 1: Using Axios directly with TanStack Query
export function useTodosDirect() {
  return useQuery({
    queryKey: todoKeys.lists(),
    queryFn: async () => {
      const response = await axios.get<Todo[]>(
        "https://jsonplaceholder.typicode.com/todos"
      );
      return response.data;
    },
    ...retryConfig,
  });
}

// Example 2: Using the helper function
export function useTodosWithHelper() {
  return useQuery({
    queryKey: todoKeys.lists(),
    queryFn: createQueryFn<Todo[]>(
      "https://jsonplaceholder.typicode.com/todos"
    ),
    ...retryConfig,
  });
}

// Example 3: Single todo with error handling
export function useTodo(id: number) {
  return useQuery({
    queryKey: todoKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await axios.get<Todo>(
          `https://jsonplaceholder.typicode.com/todos/${id}`
        );
        return response.data;
      } catch (error) {
        const errorInfo = handleQueryError(error);
        throw new Error(errorInfo.message);
      }
    },
    enabled: !!id,
  });
}

// Example 4: Mutation with Axios
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTodoRequest) => {
      const response = await axios.post<Todo>(
        "https://jsonplaceholder.typicode.com/todos",
        data
      );
      return response.data;
    },
    onSuccess: (newTodo) => {
      // Invalidate and refetch todos list
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });

      // Add the new todo to the cache
      queryClient.setQueryData(todoKeys.detail(newTodo.id), newTodo);
    },
    onError: (error) => {
      const errorInfo = handleQueryError(error);
      console.error("Failed to create todo:", errorInfo.message);
    },
  });
}

// Example 5: Using the helper function for mutations
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMutationFn<Todo, { id: number; data: UpdateTodoRequest }>(
      "https://jsonplaceholder.typicode.com/todos",
      "put"
    ),
    onSuccess: (updatedTodo) => {
      // Update the todo in the cache
      queryClient.setQueryData(todoKeys.detail(updatedTodo.id), updatedTodo);

      // Invalidate todos list to reflect changes
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

// Example 6: Optimistic updates with Axios
export function useOptimisticUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateTodoRequest;
    }) => {
      const response = await axios.put<Todo>(
        `https://jsonplaceholder.typicode.com/todos/${id}`,
        data
      );
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoKeys.detail(id) });

      // Snapshot the previous value
      const previousTodo = queryClient.getQueryData<Todo>(todoKeys.detail(id));

      // Optimistically update to the new value
      if (previousTodo) {
        queryClient.setQueryData(todoKeys.detail(id), {
          ...previousTodo,
          ...data,
        });
      }

      // Return a context object with the snapshotted value
      return { previousTodo };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTodo) {
        queryClient.setQueryData(
          todoKeys.detail(variables.id),
          context.previousTodo
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: todoKeys.detail(variables.id),
      });
    },
  });
}

// Example 7: File upload with Axios
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

// Example 8: Custom Axios instance for specific API
const todoApi = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function useTodosWithCustomInstance() {
  return useQuery({
    queryKey: ["todos", "custom"],
    queryFn: async () => {
      const response = await todoApi.get<Todo[]>("/todos");
      return response.data;
    },
  });
}
