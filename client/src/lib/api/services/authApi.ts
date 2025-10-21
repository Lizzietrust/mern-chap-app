import { apiClient } from "../ApiClient";
import { adaptAuthResponse, adaptUser } from "../adapters/authAdapter";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileData,
  User,
} from "../../../types/auth";
import type { ApiAuthResponse } from "../../../types/types";

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
