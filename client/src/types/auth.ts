
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

export interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string; 
  image?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  permissions?: string[];
  roles?: string[];
  createdAt: string;
  updatedAt: string;
  profileSetup: boolean;
  avatar?: string;
}

export interface UseLogoutOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  image?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}


export type LoginMutation = UseMutationResult<
  AuthResponse,
  Error,
  LoginRequest
>;
export type RegisterMutation = UseMutationResult<
  AuthResponse,
  Error,
  RegisterRequest
>;
export type LogoutMutation = UseMutationResult<void, Error, void>;
export type UpdateProfileMutation = UseMutationResult<
  AuthResponse,
  Error,
  UpdateProfileData
>;
export type MeQuery = UseQueryResult<User, Error>;

export interface AuthHooks extends AuthState {
  register: RegisterMutation;
  login: LoginMutation;
  logout: LogoutMutation;
  updateProfile: UpdateProfileMutation;
  meQuery: MeQuery;
}
