import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create Axios instance with default configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // For handling cookies/sessions
});

// Request interceptor for adding auth tokens
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message = data?.message || `API Error: ${status}`;
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error("Network error: No response received");
    } else {
      // Something else happened
      throw new Error(`Request error: ${error.message}`);
    }
  }
);

// Generic API client using Axios
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
    data?: any,
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
    data?: any,
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
    data?: any,
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

// Example API functions
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
}

// User API functions
export const userApi = {
  getUsers: (page?: number, limit?: number, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    return apiClient.get<User[]>(`/api/user/fetch-all-users?${params.toString()}`);
  },
  getUser: (id: number) => apiClient.get<User>(`/users/${id}`),
  createUser: (user: Omit<User, "id">) => apiClient.post<User>("/users", user),
  updateUser: (id: number, user: Partial<User>) =>
    apiClient.put<User>(`/users/${id}`, user),
  deleteUser: (id: number) => apiClient.delete(`/users/${id}`),
};

// Post API functions
export const postApi = {
  getPosts: () => apiClient.get<Post[]>("/posts"),
  getPost: (id: number) => apiClient.get<Post>(`/posts/${id}`),
  getPostsByUser: (userId: number) =>
    apiClient.get<Post[]>(`/users/${userId}/posts`),
  createPost: (post: Omit<Post, "id">) => apiClient.post<Post>("/posts", post),
  updatePost: (id: number, post: Partial<Post>) =>
    apiClient.put<Post>(`/posts/${id}`, post),
  deletePost: (id: number) => apiClient.delete(`/posts/${id}`),
};

// Auth API interfaces
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    image?: string;
    bio?: string;
    phone?: string;
    location?: string;
    website?: string;
    profileSetup: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
}

// Auth API functions
export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>("/api/auth/register", data),
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>("/api/auth/login", data),
  logout: () => apiClient.post("/api/auth/logout"),
  me: () => apiClient.get<AuthResponse>("/api/auth/user-info"),
  updateProfile: (data: { 
    firstName?: string; 
    lastName?: string; 
    image?: string;
    bio?: string;
    phone?: string;
    location?: string;
    website?: string;
  }) =>
    apiClient.put<AuthResponse>("/api/auth/update-profile", data),
};

// Export axios instance for direct use if needed
export { axiosInstance };