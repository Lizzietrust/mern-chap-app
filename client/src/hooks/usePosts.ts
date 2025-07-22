import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postApi } from '../lib/api'
import type { Post } from '../lib/api'

// Query keys for posts
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: string) => [...postKeys.lists(), { filters }] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: number) => [...postKeys.details(), id] as const,
  byUser: (userId: number) => [...postKeys.all, 'user', userId] as const,
}

// Hook to get all posts
export function usePosts() {
  return useQuery({
    queryKey: postKeys.lists(),
    queryFn: postApi.getPosts,
  })
}

// Hook to get a single post
export function usePost(id: number) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postApi.getPost(id),
    enabled: !!id,
  })
}

// Hook to get posts by user
export function usePostsByUser(userId: number) {
  return useQuery({
    queryKey: postKeys.byUser(userId),
    queryFn: () => postApi.getPostsByUser(userId),
    enabled: !!userId,
  })
}

// Hook to create a post
export function useCreatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: postApi.createPost,
    onSuccess: (newPost) => {
      // Invalidate and refetch posts list
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      
      // Invalidate user's posts
      queryClient.invalidateQueries({ queryKey: postKeys.byUser(newPost.userId) })
      
      // Add the new post to the cache
      queryClient.setQueryData(postKeys.detail(newPost.id), newPost)
    },
  })
}

// Hook to update a post
export function useUpdatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, post }: { id: number; post: Partial<Post> }) =>
      postApi.updatePost(id, post),
    onSuccess: (updatedPost) => {
      // Update the post in the cache
      queryClient.setQueryData(postKeys.detail(updatedPost.id), updatedPost)
      
      // Invalidate posts list to reflect changes
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      
      // Invalidate user's posts
      queryClient.invalidateQueries({ queryKey: postKeys.byUser(updatedPost.userId) })
    },
  })
}

// Hook to delete a post
export function useDeletePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: postApi.deletePost,
    onSuccess: (_, deletedId) => {
      // Remove the post from the cache
      queryClient.removeQueries({ queryKey: postKeys.detail(deletedId) })
      
      // Invalidate posts list to reflect changes
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
} 