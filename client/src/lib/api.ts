// Base API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// Generic API client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `API Error: ${response.status} ${response.statusText}`
        );
      } catch (parseError) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

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
  getUsers: () => apiClient.get<User[]>("/users"),
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
    profileSetup: boolean;
  };
}

// Auth API functions
export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>("/api/auth/register", data),
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>("/api/auth/login", data),
  logout: () => apiClient.post("/api/auth/logout"),
};
