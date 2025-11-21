import { apiClient } from "../ApiClient";
import type { User, UsersResponse } from "../../../types/types";

export const userApi = {
  getUsers: (
    page?: number,
    limit?: number,
    search?: string
  ): Promise<UsersResponse> => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (search) params.append("search", search);
    return apiClient.get<UsersResponse>(
      `/api/user/fetch-all-users?${params.toString()}`
    );
  },

  getUserProfile: (userId: string): Promise<User> =>
    apiClient.get<User>(`/api/user/${userId}/profile`),

  createUser: (user: Omit<User, "_id">) =>
    apiClient.post<User>("/api/users", user),

  updateUser: (id: string, user: Partial<User>) =>
    apiClient.put<User>(`/api/users/${id}`, user),

  deleteUser: (id: string) => apiClient.delete(`/api/users/${id}`),
};
