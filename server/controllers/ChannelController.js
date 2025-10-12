import Chat from "../models/ChatModel.js";
import User from "../models/UserModel.js";

export const createChannel = async (req, res, next) => {
  try {
    const { name, description, isPrivate, memberIds } = req.body;
    const createdBy = req.userId;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Channel name is required" });
    }

    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ message: "Member IDs array is required" });
    }

    const existingChannel = await Chat.findOne({
      name: name.trim(),
      type: "channel",
    });

    if (existingChannel) {
      return res.status(400).json({ message: "Channel name already exists" });
    }

    const members = await User.find({ _id: { $in: memberIds } });
    if (members.length !== memberIds.length) {
      return res
        .status(400)
        .json({ message: "One or more member IDs are invalid" });
    }

    const allMemberIds = [...new Set([createdBy, ...memberIds])];

    const newChannel = new Chat({
      type: "channel",
      name: name.trim(),
      description: description?.trim() || "",
      isPrivate: Boolean(isPrivate),
      createdBy,
      admins: [createdBy],
      members: allMemberIds,
    });

    const savedChannel = await newChannel.save();

    const populatedChannel = await Chat.findById(savedChannel._id)
      .populate(
        "members",
        "_id firstName lastName email image isOnline lastSeen"
      )
      .populate("admins", "_id firstName lastName email image")
      .populate("createdBy", "_id firstName lastName email image");

    res.status(201).json(populatedChannel);
  } catch (error) {
    console.error("Error in createChannel:", error);
    next(error);
  }
};

export const updateChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { name, description, isPrivate } = req.body;
    const userId = req.userId;

    const channel = await Chat.findOne({
      _id: channelId,
      type: "channel",
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (!channel.admins.includes(userId)) {
      return res
        .status(403)
        .json({ message: "Only admins can update channel" });
    }

    if (name?.trim()) {
      const existingChannel = await Chat.findOne({
        name: name.trim(),
        type: "channel",
        _id: { $ne: channelId },
      });

      if (existingChannel) {
        return res.status(400).json({ message: "Channel name already exists" });
      }
      channel.name = name.trim();
    }

    if (description !== undefined) {
      channel.description = description?.trim() || "";
    }

    if (isPrivate !== undefined) {
      channel.isPrivate = Boolean(isPrivate);
    }

    const updatedChannel = await channel.save();

    const populatedChannel = await Chat.findById(updatedChannel._id)
      .populate(
        "members",
        "_id firstName lastName email image isOnline lastSeen"
      )
      .populate("admins", "_id firstName lastName email image")
      .populate("createdBy", "_id firstName lastName email image");

    res.status(200).json(populatedChannel);
  } catch (error) {
    console.error("Error in updateChannel:", error);
    next(error);
  }
};

export const getChannelMembers = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;

    const channel = await Chat.findOne({
      _id: channelId,
      type: "channel",
      members: userId,
    }).populate(
      "members",
      "_id firstName lastName email image isOnline lastSeen"
    );

    if (!channel) {
      return res
        .status(404)
        .json({ message: "Channel not found or you are not a member" });
    }

    res.status(200).json(channel.members);
  } catch (error) {
    console.error("Error in getChannelMembers:", error);
    next(error);
  }
};

export const addChannelMember = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { userId: newMemberId } = req.body;
    const adminId = req.userId;

    const channel = await Chat.findOne({
      _id: channelId,
      type: "channel",
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (!channel.admins.includes(adminId)) {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    const newMember = await User.findById(newMemberId);
    if (!newMember) {
      return res.status(404).json({ message: "User not found" });
    }

    if (channel.members.includes(newMemberId)) {
      return res
        .status(400)
        .json({ message: "User is already a member of this channel" });
    }

    channel.members.push(newMemberId);
    await channel.save();

    const populatedChannel = await Chat.findById(channelId)
      .populate(
        "members",
        "_id firstName lastName email image isOnline lastSeen"
      )
      .populate("admins", "_id firstName lastName email image");

    res.status(200).json(populatedChannel);
  } catch (error) {
    console.error("Error in addChannelMember:", error);
    next(error);
  }
};

export const removeChannelMember = async (req, res, next) => {
  try {
    const { channelId, userId: memberIdToRemove } = req.params;
    const adminId = req.userId;

    const channel = await Chat.findOne({
      _id: channelId,
      type: "channel",
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (!channel.admins.includes(adminId)) {
      return res
        .status(403)
        .json({ message: "Only admins can remove members" });
    }

    if (memberIdToRemove === adminId && channel.admins.length === 1) {
      return res
        .status(400)
        .json({ message: "Cannot remove yourself as the only admin" });
    }

    channel.members = channel.members.filter(
      (member) => member.toString() !== memberIdToRemove
    );

    channel.admins = channel.admins.filter(
      (admin) => admin.toString() !== memberIdToRemove
    );

    await channel.save();

    const populatedChannel = await Chat.findById(channelId)
      .populate(
        "members",
        "_id firstName lastName email image isOnline lastSeen"
      )
      .populate("admins", "_id firstName lastName email image");

    res.status(200).json(populatedChannel);
  } catch (error) {
    console.error("Error in removeChannelMember:", error);
    next(error);
  }
};

export const updateChannelAdmin = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { userId, isAdmin } = req.body;
    const adminId = req.userId;

    const channel = await Chat.findOne({
      _id: channelId,
      type: "channel",
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (!channel.admins.includes(adminId)) {
      return res
        .status(403)
        .json({ message: "Only admins can update admin status" });
    }

    if (!channel.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User is not a member of this channel" });
    }

    if (isAdmin) {
      if (!channel.admins.includes(userId)) {
        channel.admins.push(userId);
      }
    } else {
      if (
        channel.admins.length === 1 &&
        channel.admins[0].toString() === userId
      ) {
        return res
          .status(400)
          .json({ message: "Cannot remove the only admin" });
      }
      channel.admins = channel.admins.filter(
        (admin) => admin.toString() !== userId
      );
    }

    await channel.save();

    const populatedChannel = await Chat.findById(channelId)
      .populate(
        "members",
        "_id firstName lastName email image isOnline lastSeen"
      )
      .populate("admins", "_id firstName lastName email image");

    res.status(200).json(populatedChannel);
  } catch (error) {
    console.error("Error in updateChannelAdmin:", error);
    next(error);
  }
};

export const getUserChannels = async (req, res, next) => {
  try {
    const userId = req.userId;

    const channels = await Chat.find({
      type: "channel",
      $or: [{ isPrivate: false }, { members: userId }],
    })
      .populate(
        "members",
        "_id firstName lastName email image isOnline lastSeen"
      )
      .populate("admins", "_id firstName lastName email image")
      .populate("createdBy", "_id firstName lastName email image")
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 },
        populate: {
          path: "sender",
          select: "_id firstName lastName",
        },
      })
      .sort({ updatedAt: -1 });

    const transformedChannels = channels.map((channel) => {
      const channelObj = channel.toObject();
      const lastMessage =
        channelObj.messages && channelObj.messages.length > 0
          ? channelObj.messages[0]
          : null;

      return {
        ...channelObj,
        lastMessage: lastMessage ? lastMessage.content : null,
        lastMessageTime: lastMessage ? lastMessage.createdAt : null,
        lastMessageSender: lastMessage ? lastMessage.sender : null,
      };
    });

    res.status(200).json(transformedChannels || []);
  } catch (error) {
    console.error("Error in getUserChannels:", error);

    res.status(200).json([]);
  }
};
