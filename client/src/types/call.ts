import type { ChannelCallData, User } from "./types";

export interface CallState {
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  isOnCall: boolean;
  callReceiver: User | ChannelCallData | null;
  callType: "audio" | "video" | null;
  callMode: "direct" | "channel" | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isLocalVideoEnabled: boolean;
  isLocalAudioEnabled: boolean;
  isRemoteVideoEnabled: boolean;
  participants: User[];
  callStatus: "idle" | "calling" | "ringing" | "ongoing" | "ended";
  callerName?: string; 
}
