import { createContext } from "react";
import type { User } from "../../types/types";
import type { ChannelCallData, CallState } from "../../types/call";

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
