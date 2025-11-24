import express from "express";
import {
  createChannel,
  updateChannel,
  getChannelMembers,
  addChannelMember,
  removeChannelMember,
  updateChannelAdmin,
  getUserChannels,
  getChannelMessages,
  getCommonChannels,
} from "../controllers/ChannelController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const channelRoutes = express.Router();

channelRoutes.post("/create", verifyToken, createChannel);
channelRoutes.put("/:channelId", verifyToken, updateChannel);
channelRoutes.get("/user-channels", verifyToken, getUserChannels);

channelRoutes.get("/:channelId/members", verifyToken, getChannelMembers);
channelRoutes.post("/:channelId/members", verifyToken, addChannelMember);
channelRoutes.delete(
  "/:channelId/members/:userId",
  verifyToken,
  removeChannelMember
);

channelRoutes.put("/:channelId/admin", verifyToken, updateChannelAdmin);

channelRoutes.get("/:channelId/messages", verifyToken, getChannelMessages);
channelRoutes.get("/common-channels/:userId1/:userId2", getCommonChannels);

export default channelRoutes;
