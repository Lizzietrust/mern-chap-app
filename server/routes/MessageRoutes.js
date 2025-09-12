import express from "express";
import { createChat, sendMessage, getMessages, getUserChats } from "../controllers/MessageController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const messageRoutes = express.Router();

messageRoutes.post("/create-chat", verifyToken, createChat);
messageRoutes.post("/send-message", verifyToken, sendMessage);
messageRoutes.get("/get-messages/:chatId", verifyToken, getMessages);
messageRoutes.get("/get-user-chats", verifyToken, getUserChats);

export default messageRoutes;
