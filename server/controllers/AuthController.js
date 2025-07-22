import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = ({ email, userId }) => {
  // Check if JWT_KEY is set
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }

    const user = await User.create({ email, password });

    res.cookie("jwt", createToken({ email, userId: user._id }), {
      //   httpOnly: true,
      secure: true,
      maxAge,
      sameSite: "None",
    });
    
    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        // firstName: user.firstName,
        // lastName: user.lastName,
        // image: user.image,
        // color: user.color,
        profileSetup: user.profileSetup
      },
    });
  } catch (error) {
    console.log({ error });
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "User with this email already exists" 
      });
    }
    
    // Handle JWT errors
    if (error.message === "JWT_KEY environment variable is not set") {
      return res.status(500).json({ 
        message: "Server configuration error. Please contact administrator." 
      });
    }
    
    next(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
