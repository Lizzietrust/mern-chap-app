import type { User as ApiUser } from "../../types/types";
import type { User } from "../../types/auth";

export const transformUserData = (apiUser: ApiUser): User => ({
  _id: apiUser._id,
  name:
    apiUser.firstName && apiUser.lastName
      ? `${apiUser.firstName} ${apiUser.lastName}`
      : apiUser.name || "",
  email: apiUser.email,
  profileSetup: apiUser.profileSetup ?? false,
  avatar: apiUser.avatar || apiUser.image,
  bio: apiUser.bio,
  phone: apiUser.phone,
  location: apiUser.location,
  website: apiUser.website,
  image: apiUser.image,
  firstName: apiUser.firstName,
  lastName: apiUser.lastName,
  createdAt: apiUser.createdAt,
  updatedAt: apiUser.updatedAt,
});

export const hasProfileSetup = (user: User): boolean => {
  return user.profileSetup && !!user.name && !!user.email;
};
