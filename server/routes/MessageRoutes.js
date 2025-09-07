import express from "express";
import { createChat } from "../controllers/MessageController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const messageRoutes = express.Router();

messageRoutes.post("/create-chat", verifyToken, createChat);

export default messageRoutes;
