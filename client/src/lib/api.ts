import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import type {
  Chat,
  User as ApiUser,
  AuthResponse as ApiAuthResponse,
  UsersResponse,
  UserChat,
  ChannelChat,
  CreateChannelData,
  UpdateChannelData,
} from "../types/types";
import type {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileData,
} from "../types/auth";

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

      if (status === 401) {
        console.error("Unauthorized access - please login again");
      }

      throw new Error(message);
    } else if (error.request) {
      throw new Error("Network error: No response received");
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
);

const adaptUser = (user: ApiUser): User => ({
  _id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  name: user.name,
  image: user.image,
  bio: user.bio,
  phone: user.phone,
  location: user.location,
  website: user.website,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  profileSetup: user.profileSetup,
  avatar: user.avatar,
});

const adaptAuthResponse = (response: ApiAuthResponse): AuthResponse => ({
  user: adaptUser(response.user),
  token: response.token,
  message: response.message,
});

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
  getUser: (id: string) => apiClient.get<ApiUser>(`/users/${id}`),
  createUser: (user: Omit<ApiUser, "_id">) =>
    apiClient.post<ApiUser>("/users", user),
  updateUser: (id: string, user: Partial<ApiUser>) =>
    apiClient.put<ApiUser>(`/users/${id}`, user),
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

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiAuthResponse>(
      "/api/auth/register",
      data
    );
    return adaptAuthResponse(response);
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiAuthResponse>(
      "/api/auth/login",
      data
    );
    return adaptAuthResponse(response);
  },

  logout: (): Promise<void> => apiClient.post<void>("/api/auth/logout"),

  me: async (): Promise<User> => {
    const response = await apiClient.get<ApiAuthResponse>(
      "/api/auth/user-info"
    );
    return adaptUser(response.user);
  },

  updateProfile: async (data: UpdateProfileData): Promise<AuthResponse> => {
    const response = await apiClient.put<ApiAuthResponse>(
      "/api/auth/update-profile",
      data
    );
    return adaptAuthResponse(response);
  },
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

  markAsRead: (chatId: string) =>
    apiClient.patch(`/api/messages/chats/${chatId}/read`),

  getUnreadCounts: () => apiClient.get("/api/messages/chats/unread-counts"),
};

export const channelApi = {
  createChannel: (channelData: CreateChannelData): Promise<ChannelChat> =>
    apiClient.post<ChannelChat>("/api/channels/create", channelData),

  updateChannel: (
    channelId: string,
    data: UpdateChannelData
  ): Promise<ChannelChat> =>
    apiClient.put<ChannelChat>(`/api/channels/${channelId}`, data),

  getUserChannels: (): Promise<ChannelChat[]> =>
    apiClient.get<ChannelChat[]>("/api/channels/user-channels"),

  getChannelMembers: (channelId: string): Promise<ApiUser[]> =>
    apiClient.get<ApiUser[]>(`/api/channels/${channelId}/members`),

  addChannelMember: (channelId: string, userId: string): Promise<ChannelChat> =>
    apiClient.post<ChannelChat>(`/api/channels/${channelId}/members`, {
      userId,
    }),

  removeChannelMember: (
    channelId: string,
    userId: string
  ): Promise<ChannelChat> =>
    apiClient.delete<ChannelChat>(
      `/api/channels/${channelId}/members/${userId}`
    ),

  updateChannelAdmin: (
    channelId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<ChannelChat> =>
    apiClient.put<ChannelChat>(`/api/channels/${channelId}/admins`, {
      userId,
      isAdmin,
    }),
};

export { axiosInstance };
