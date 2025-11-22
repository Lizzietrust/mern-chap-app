import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../lib/api";
import type { User, UsersResponse } from "../types/types";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export function useUsers(page?: number, limit?: number, search?: string) {
  return useQuery<UsersResponse>({
    queryKey: userKeys.list(`${page}-${limit}-${search}`),
    queryFn: () => userApi.getUsers(page, limit, search),
  });
}

// export function useUser(id: string) {
//   return useQuery({
//     queryKey: userKeys.detail(id),
//     queryFn: () => userApi.getUser(id),
//     enabled: !!id,
//   });
// }

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.createUser,
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.setQueryData(userKeys.detail(newUser._id), newUser);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, user }: { id: string; user: Partial<User> }) =>
      userApi.updateUser(id, user),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userKeys.detail(updatedUser._id), updatedUser);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: userKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
