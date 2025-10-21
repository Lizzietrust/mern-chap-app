import type {
  User as ApiUser,
  AuthResponse as ApiAuthResponse,
} from "../../../types/types";
import type { User, AuthResponse } from "../../../types/auth";

export const adaptUser = (user: ApiUser): User => ({
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

export const adaptAuthResponse = (response: ApiAuthResponse): AuthResponse => ({
  user: adaptUser(response.user),
  token: response.token,
  message: response.message,
});
