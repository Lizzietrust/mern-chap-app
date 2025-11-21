import Users from "../models/UserModel.js";
import jwt from "jsonwebtoken";

const maxAge = 1 * 24 * 60 * 60 * 1000;

const createToken = ({ email, userId }) => {
  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY environment variable is not set");
  }

  return jwt.sign({ email, userId }, process.env.JWT_KEY, {
    expiresIn: maxAge,
  });
};

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }

    const user = await Users.create({ email, password });

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("jwt", createToken({ email, userId: user._id }), {
      httpOnly: true,
      secure: isProd,
      maxAge,
      sameSite: isProd ? "None" : "Lax",
    });

    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        bio: user.bio,
        phone: user.phone,
        location: user.location,
        website: user.website,
        profileSetup: user.profileSetup,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.log({ error });

    if (error.code === 11000) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    if (error.message === "JWT_KEY environment variable is not set") {
      return res.status(500).json({
        message: "Server configuration error. Please contact administrator.",
      });
    }

    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const existingUser = await Users.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const authenticated = await existingUser.comparePassword(password);

    if (!authenticated) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("jwt", createToken({ email, userId: existingUser._id }), {
      httpOnly: true,
      secure: isProd,
      maxAge,
      sameSite: isProd ? "None" : "Lax",
    });

    res.status(200).json({
      user: {
        _id: existingUser._id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        image: existingUser.image,
        bio: existingUser.bio,
        phone: existingUser.phone,
        location: existingUser.location,
        website: existingUser.website,
        profileSetup: existingUser.profileSetup,
        createdAt: existingUser.createdAt,
        updatedAt: existingUser.updatedAt,
      },
    });
  } catch (error) {
    console.log({ error });

    if (error.message === "JWT_KEY environment variable is not set") {
      return res.status(500).json({
        message: "Server configuration error. Please contact administrator.",
      });
    }

    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.userId;

    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
    });

    await Users.findByIdAndUpdate(userId, {
      isOnline: false,
      lastSeen: new Date(),
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log({ error });
    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserInfo = async (req, res, next) => {
  try {
    const userData = await Users.findById(req.userId);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        _id: userData._id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        image: userData.image,
        bio: userData.bio,
        phone: userData.phone,
        location: userData.location,
        website: userData.website,
        profileSetup: userData.profileSetup,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
    });
  } catch (error) {
    console.log({ error });

    if (error.message === "JWT_KEY environment variable is not set") {
      return res.status(500).json({
        message: "Server configuration error. Please contact administrator.",
      });
    }

    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, image, bio, phone, location, website } =
      req.body;
    const userId = req.userId;

    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (image !== undefined) updateData.image = image;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "At least one field is required for update",
      });
    }

    if (updateData.firstName && updateData.lastName) {
      updateData.profileSetup = true;
    }

    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -refreshToken -__v");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const io = req.app.get("io");

    io.emit("profile_updated", {
      userId: updatedUser._id.toString(),
      updates: {
        _id: updatedUser._id.toString(),
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        image: updatedUser.image,
        bio: updatedUser.bio,
        phone: updatedUser.phone,
        location: updatedUser.location,
        website: updatedUser.website,
        profileSetup: updatedUser.profileSetup,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        image: updatedUser.image,
        bio: updatedUser.bio,
        phone: updatedUser.phone,
        location: updatedUser.location,
        website: updatedUser.website,
        profileSetup: updatedUser.profileSetup,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.log({ error });
    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
