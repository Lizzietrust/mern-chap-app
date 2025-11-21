import express from "express";
import { fetchAllUsers, getUserProfile } from "../controllers/UserController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const userRoutes = express.Router();

userRoutes.get("/fetch-all-users", verifyToken, fetchAllUsers);
userRoutes.get("/:userId/profile", getUserProfile);

export default userRoutes;