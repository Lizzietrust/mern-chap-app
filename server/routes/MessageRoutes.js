import express from "express";
import {
  createChat,
  sendMessage,
  getMessages,
  getUserChats,
  uploadFile,
  markChatAsRead,
  getUnreadCounts,
  debugChats,
} from "../controllers/MessageController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import multer from "multer";
import path from "path";
import {
  cleanupChats,
  fixUnreadCounts,
} from "../controllers/CleanupChatsController.js";

const messageRoutes = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp3|mp4|wav|mpeg/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

messageRoutes.post("/create-chat", verifyToken, createChat);
messageRoutes.post("/send-message", verifyToken, sendMessage);
messageRoutes.get("/get-messages/:chatId", verifyToken, getMessages);
messageRoutes.get("/get-user-chats", verifyToken, getUserChats);
messageRoutes.post("/upload", verifyToken, upload.single("file"), uploadFile);
messageRoutes.patch("/chats/:chatId/read", verifyToken, markChatAsRead);
messageRoutes.get("/chats/unread-counts", verifyToken, getUnreadCounts);
messageRoutes.delete("/chats/cleanup", verifyToken, cleanupChats);
messageRoutes.post("/chats/fix-unread-counts", fixUnreadCounts);
messageRoutes.get("/chats/debug", debugChats);

export default messageRoutes;
