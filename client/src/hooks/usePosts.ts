import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postApi } from "../lib/api";
import type { Post } from "../lib/api";

export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (filters: string) => [...postKeys.lists(), { filters }] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: number) => [...postKeys.details(), id] as const,
  byUser: (userId: number) => [...postKeys.all, "user", userId] as const,
};

export function usePosts() {
  return useQuery({
    queryKey: postKeys.lists(),
    queryFn: postApi.getPosts,
  });
}

export function usePost(id: number) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postApi.getPost(id),
    enabled: !!id,
  });
}

export function usePostsByUser(userId: number) {
  return useQuery({
    queryKey: postKeys.byUser(userId),
    queryFn: () => postApi.getPostsByUser(userId),
    enabled: !!userId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postApi.createPost,
    onSuccess: (newPost) => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });

      queryClient.invalidateQueries({
        queryKey: postKeys.byUser(newPost.userId),
      });

      queryClient.setQueryData(postKeys.detail(newPost.id), newPost);
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, post }: { id: number; post: Partial<Post> }) =>
      postApi.updatePost(id, post),
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(postKeys.detail(updatedPost.id), updatedPost);

      queryClient.invalidateQueries({ queryKey: postKeys.lists() });

      queryClient.invalidateQueries({
        queryKey: postKeys.byUser(updatedPost.userId),
      });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postApi.deletePost,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: postKeys.detail(deletedId) });

      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}
