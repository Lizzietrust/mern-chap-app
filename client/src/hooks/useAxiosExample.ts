import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosProgressEvent } from "axios";
import {
  createQueryFn,
  createMutationFn,
  handleQueryError,
} from "../lib/utils";
import { retryConfig } from "../lib/utils/tanstack-query-utils";

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

export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
};

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

export function useTodosWithHelper() {
  return useQuery({
    queryKey: todoKeys.lists(),
    queryFn: createQueryFn<Todo[]>(
      "https://jsonplaceholder.typicode.com/todos"
    ),
    ...retryConfig,
  });
}

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
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });

      queryClient.setQueryData(todoKeys.detail(newTodo.id), newTodo);
    },
    onError: (error) => {
      const errorInfo = handleQueryError(error);
      console.error("Failed to create todo:", errorInfo.message);
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMutationFn<Todo, { id: number; data: UpdateTodoRequest }>(
      "https://jsonplaceholder.typicode.com/todos",
      "put"
    ),
    onSuccess: (updatedTodo) => {
      queryClient.setQueryData(todoKeys.detail(updatedTodo.id), updatedTodo);

      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

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
      await queryClient.cancelQueries({ queryKey: todoKeys.detail(id) });

      const previousTodo = queryClient.getQueryData<Todo>(todoKeys.detail(id));

      if (previousTodo) {
        queryClient.setQueryData(todoKeys.detail(id), {
          ...previousTodo,
          ...data,
        });
      }

      return { previousTodo };
    },
    onError: (err, variables, context) => {
      console.log(err);

      if (context?.previousTodo) {
        queryClient.setQueryData(
          todoKeys.detail(variables.id),
          context.previousTodo
        );
      }
    },
    onSettled: (data, error, variables) => {
      console.log(data);
      console.log(error);

      queryClient.invalidateQueries({
        queryKey: todoKeys.detail(variables.id),
      });
    },
  });
}

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
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total !== undefined && progressEvent.total > 0) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log("Upload progress:", percentCompleted);
            } else {
              console.log(
                "Upload progress:",
                progressEvent.loaded,
                "bytes loaded"
              );
            }
          },
        }
      );

      return response.data;
    },
  });
}

export function useFileUploadWithProgress() {
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
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const { loaded, total } = progressEvent;

            if (total !== undefined && total > 0) {
              const percentCompleted = Math.round((loaded * 100) / total);
              console.log(`Upload progress: ${percentCompleted}%`);
            } else if (loaded > 0) {
              console.log(`Uploaded: ${loaded} bytes`);
            }
          },
        }
      );

      return response.data;
    },
  });
}

interface UploadProgressCallback {
  (progress: { loaded: number; total?: number; percentage?: number }): void;
}

export function useFileUploadWithCallback(onProgress?: UploadProgressCallback) {
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
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const { loaded, total } = progressEvent;

            if (onProgress) {
              const progressData = {
                loaded,
                total,
                percentage:
                  total && total > 0
                    ? Math.round((loaded * 100) / total)
                    : undefined,
              };
              onProgress(progressData);
            }
          },
        }
      );

      return response.data;
    },
  });
}

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
