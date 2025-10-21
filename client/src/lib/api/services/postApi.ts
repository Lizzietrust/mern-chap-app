import { apiClient } from "../ApiClient";

export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
}

export const postApi = {
  getPosts: () => apiClient.get<Post[]>("/api/posts"),
  getPost: (id: number) => apiClient.get<Post>(`/api/posts/${id}`),
  getPostsByUser: (userId: number) =>
    apiClient.get<Post[]>(`/api/users/${userId}/posts`),
  createPost: (post: Omit<Post, "id">) =>
    apiClient.post<Post>("/api/posts", post),
  updatePost: (id: number, post: Partial<Post>) =>
    apiClient.put<Post>(`/api/posts/${id}`, post),
  deletePost: (id: number) => apiClient.delete<void>(`/api/posts/${id}`),
};
