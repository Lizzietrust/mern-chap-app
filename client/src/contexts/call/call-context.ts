import { createContext } from "react";
import type { User } from "../../types/types";

export interface CallState {
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  isOnCall: boolean;
  callReceiver: User | null;
  callType: "audio" | "video" | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isLocalVideoEnabled: boolean;
  isLocalAudioEnabled: boolean;
  isRemoteVideoEnabled: boolean;
}

export interface CallContextType {
  callState: CallState;
  startCall: (user: User, type: "audio" | "video") => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
}

export const CallContext = createContext<CallContextType | undefined>(
  undefined
);
