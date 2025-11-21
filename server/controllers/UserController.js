import Users from "../models/UserModel.js";
import mongoose from "mongoose";

export const fetchAllUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query = {
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ],
      };
    }

    const users = await Users.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalUsers = await Users.countDocuments(query);

    res.status(200).json({ users, totalUsers });
  } catch (error) {
    console.log({ error });
    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await Users.findById(userId)
      .select("-password -refreshToken -__v") 
      .lean(); 

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    
    const userProfile = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.image,
      avatar: user.image, 
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      ...(user.bio && { bio: user.bio }),
      ...(user.location && { location: user.location }),
      ...(user.website && { website: user.website }),
      ...(user.phone && { phone: user.phone }),
      ...(user.title && { title: user.title }),
      ...(user.coverPhoto && { coverPhoto: user.coverPhoto }),
      followers: user.followers || [],
      following: user.following || [],
      postsCount: user.postsCount || 0,
      groupsCount: user.groupsCount || 0,
      joinedDate: user.createdAt,
      name: `${user.firstName} ${user.lastName}`.trim(),
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    next(error);
  }
};
