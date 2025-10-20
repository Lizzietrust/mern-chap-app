import { channelApi } from "../../lib/api";
import type {
  ChannelChat,
  CreateChannelData,
  UpdateChannelData,
  User,
} from "../../types/channel";

export class ChannelService {
  static async getUserChannels(): Promise<ChannelChat[]> {
    return channelApi.getUserChannels();
  }

  static async createChannel(data: CreateChannelData): Promise<ChannelChat> {
    return channelApi.createChannel(data);
  }

  static async updateChannel(
    channelId: string,
    data: UpdateChannelData
  ): Promise<ChannelChat> {
    return channelApi.updateChannel(channelId, data);
  }

  static async getChannelMembers(channelId: string): Promise<User[]> {
    return channelApi.getChannelMembers(channelId);
  }

  static async addChannelMember(
    channelId: string,
    userId: string
  ): Promise<ChannelChat> {
    return channelApi.addChannelMember(channelId, userId);
  }

  static async removeChannelMember(
    channelId: string,
    userId: string
  ): Promise<ChannelChat> {
    return channelApi.removeChannelMember(channelId, userId);
  }

  static async updateChannelAdmin(
    channelId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<ChannelChat> {
    return channelApi.updateChannelAdmin(channelId, userId, isAdmin);
  }
}
