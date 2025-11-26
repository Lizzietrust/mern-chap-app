import { createContext } from "react";
import type { User } from "../../types/types";

export interface ChannelCallData {
  _id: string;
  name: string;
  type: "channel";
  participants: (User | string)[];
  isPrivate: boolean;
  admins: (User | string)[];
}

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
}

export interface CallContextType {
  callState: CallState;
  startCall: (
    target: User | ChannelCallData,
    type: "audio" | "video",
    callMode: "direct" | "channel"
  ) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  handleIncomingCall: (data: {
    caller: User | ChannelCallData;
    type: "audio" | "video";
    callMode: "direct" | "channel";
    channelData?: ChannelCallData;
  }) => void;
  joinCall: () => void;
}

export const CallContext = createContext<CallContextType | undefined>(
  undefined
);
