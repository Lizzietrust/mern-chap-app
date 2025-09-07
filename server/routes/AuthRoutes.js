import express from "express";
import { register, login, logout, getUserInfo, updateProfile } from "../controllers/AuthController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const authRoutes = express.Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/user-info", verifyToken, getUserInfo);
authRoutes.put("/update-profile", verifyToken, updateProfile);

export default authRoutes;