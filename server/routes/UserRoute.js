import express from "express";
import { fetchAllUsers } from "../controllers/UserController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const userRoutes = express.Router();

userRoutes.get("/fetch-all-users", verifyToken, fetchAllUsers);

export default userRoutes;