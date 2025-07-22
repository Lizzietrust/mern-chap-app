import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../lib/api'
import type { User } from '../lib/api'

// Query keys for users
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
}

// Hook to get all users
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: userApi.getUsers,
  })
}

// Hook to get a single user
export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userApi.getUser(id),
    enabled: !!id,
  })
}

// Hook to create a user
export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: userApi.createUser,
    onSuccess: (newUser) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      
      // Add the new user to the cache
      queryClient.setQueryData(userKeys.detail(newUser.id), newUser)
    },
  })
}

// Hook to update a user
export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, user }: { id: number; user: Partial<User> }) =>
      userApi.updateUser(id, user),
    onSuccess: (updatedUser) => {
      // Update the user in the cache
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser)
      
      // Invalidate users list to reflect changes
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

// Hook to delete a user
export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: (_, deletedId) => {
      // Remove the user from the cache
      queryClient.removeQueries({ queryKey: userKeys.detail(deletedId) })
      
      // Invalidate users list to reflect changes
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
} 