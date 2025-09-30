import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import type {
  Chat,
  User,
  AuthResponse,
  UsersResponse,
  UserChat,
} from "../types";

export const API_BASE_URL = import.meta.env.VITE_API_URL;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || `API Error: ${status}`;
      throw new Error(message);
    } else if (error.request) {
      throw new Error("Network error: No response received");
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
);

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  private async request<T>(
    endpoint: string,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    const response = await this.axiosInstance.request<T>({
      url: endpoint,
      ...config,
    });
    return response.data;
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      data,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      data,
    });
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      data,
    });
  }
}

export const apiClient = new ApiClient(axiosInstance);

export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
}

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
  getUser: (id: string) => apiClient.get<User>(`/users/${id}`),
  createUser: (user: Omit<User, "_id">) => apiClient.post<User>("/users", user),
  updateUser: (id: string, user: Partial<User>) =>
    apiClient.put<User>(`/users/${id}`, user),
  deleteUser: (id: string) => apiClient.delete(`/users/${id}`),
};

export const postApi = {
  getPosts: () => apiClient.get<Post[]>("/posts"),
  getPost: (id: number) => apiClient.get<Post>(`/posts/${id}`),
  getPostsByUser: (userId: number) =>
    apiClient.get<Post[]>(`/users/${userId}/posts`),
  createPost: (post: Omit<Post, "id">) => apiClient.post<Post>("/posts", post),
  updatePost: (id: number, post: Partial<Post>) =>
    apiClient.put<Post>(`/posts/${id}`, post),
  deletePost: (id: number) => apiClient.delete<void>(`/posts/${id}`),
};

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  image?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
}

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>("/api/auth/register", data),
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>("/api/auth/login", data),
  logout: () => apiClient.post<void>("/api/auth/logout"),
  me: () => apiClient.get<AuthResponse>("/api/auth/user-info"),
  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.put<AuthResponse>("/api/auth/update-profile", data),
};

export interface CreateChatRequest {
  userId: string;
}

export const chatApi = {
  createChat: (userId: string): Promise<Chat> =>
    apiClient.post<Chat>("/api/messages/create-chat", {
      userId,
    } as CreateChatRequest),
  getUserChats: (): Promise<UserChat[]> =>
    apiClient.get<UserChat[]>("/api/messages/get-user-chats"),
};

export { axiosInstance };
