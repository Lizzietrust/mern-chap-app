import React, { useState, useCallback, useEffect, useRef } from "react";
import { CallContext, type CallContextType } from "./call-context";
import type { CallState, ChannelCallData } from "../../types/call";
import type { User } from "../../types/types";
import { useApp } from "../appcontext/index";

interface IncomingDirectCallData {
  caller: User;
  type: "audio" | "video";
  callMode: "direct";
}

interface IncomingChannelCallData {
  caller: User;
  type: "audio" | "video";
  callMode: "channel";
  channelData: ChannelCallData;
}

interface UserJoinedChannelCallData {
  user: User;
  channelId: string;
}

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { state } = useApp();
  const { socket } = state;

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const [callState, setCallState] = useState<CallState>({
    isIncomingCall: false,
    isOutgoingCall: false,
    isOnCall: false,
    callReceiver: null,
    callType: null,
    callMode: null,
    localStream: null,
    remoteStream: null,
    isLocalVideoEnabled: true,
    isLocalAudioEnabled: true,
    isRemoteVideoEnabled: true,
    participants: [],
    callStatus: "idle",
  });

  const cleanupMediaStreams = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  }, []);

  const updateCallParticipants = useCallback((user: User) => {
    setCallState((prev) => ({
      ...prev,
      participants: [...prev.participants, user],
    }));
  }, []);

  const getLocalStream = useCallback(
    async (type: "audio" | "video"): Promise<MediaStream> => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: true,
          video:
            type === "video"
              ? {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                }
              : false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        setCallState((prev) => ({
          ...prev,
          localStream: stream,
          isLocalVideoEnabled: type === "video",
          isLocalAudioEnabled: true,
        }));

        return stream;
      } catch (error) {
        console.error("❌ Error accessing media devices:", error);
        throw error;
      }
    },
    []
  );

  const addLocalStreamToPeerConnection = useCallback((stream: MediaStream) => {
    if (!peerConnection.current) return;

    stream.getTracks().forEach((track) => {
      peerConnection.current!.addTrack(track, stream);
    });
  }, []);

  const endCall = useCallback(() => {
    console.log("📞 Ending call");

    if (socket && callState.callReceiver) {
      if (callState.callMode === "channel") {
        socket.emit("end_channel_call", {
          channelId: callState.callReceiver._id,
        });
      } else {
        socket.emit("end_call", {
          receiverId: callState.callReceiver._id,
        });
      }
    }

    cleanupMediaStreams();
    setCallState({
      isIncomingCall: false,
      isOutgoingCall: false,
      isOnCall: false,
      callReceiver: null,
      callType: null,
      callMode: null,
      localStream: null,
      remoteStream: null,
      isLocalVideoEnabled: true,
      isLocalAudioEnabled: true,
      isRemoteVideoEnabled: true,
      participants: [],
      callStatus: "ended",
    });
  }, [socket, callState.callReceiver, callState.callMode, cleanupMediaStreams]);

  const createPeerConnection = useCallback(() => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    const pc = new RTCPeerConnection(configuration);

    pc.ontrack = (event) => {
      console.log("📹 Remote track received");
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setCallState((prev) => ({
          ...prev,
          remoteStream: event.streams[0],
        }));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && callState.callReceiver) {
        console.log("❄️ Sending ICE candidate");

        if (callState.callMode === "channel") {
          socket.emit("ice-candidate-channel", {
            candidate: event.candidate,
            channelId: callState.callReceiver._id,
          });
        } else {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            receiverId: callState.callReceiver._id,
          });
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state: ${pc.connectionState}`);
      if (pc.connectionState === "connected") {
        console.log("✅ WebRTC connection established");
        setCallState((prev) => ({ ...prev, callStatus: "ongoing" }));
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        console.log("❌ WebRTC connection failed");
        endCall();
      }
    };

    return pc;
  }, [socket, callState.callReceiver, callState.callMode, endCall]);

  const startCall = useCallback(
    async (
      target: User | ChannelCallData,
      type: "audio" | "video",
      callMode: "direct" | "channel"
    ) => {
      console.log("Starting call:", { target, type, callMode });

      if (!target) {
        console.error("Invalid call target");
        return;
      }

      let participants: User[] = [];

      if (callMode === "channel") {
        const channelData = target as ChannelCallData;

        participants = channelData.participants.map((participant) => {
          if (typeof participant === "string") {
            return {
              _id: participant,
              name: "Unknown User",
              isOnline: false,
            } as User;
          }
          return participant;
        });
      } else {
        participants = [target as User];
      }

      console.log(
        "📞 Starting call to:",
        target._id,
        "Type:",
        type,
        "Mode:",
        callMode
      );

      try {
        peerConnection.current = createPeerConnection();

        const stream = await getLocalStream(type);
        addLocalStreamToPeerConnection(stream);

        setCallState({
          isIncomingCall: false,
          isOutgoingCall: true,
          isOnCall: false,
          callReceiver: target,
          callType: type,
          callMode: callMode,
          localStream: stream,
          remoteStream: null,
          isLocalVideoEnabled: type === "video",
          isLocalAudioEnabled: true,
          isRemoteVideoEnabled: true,
          participants,
          callStatus: "calling",
        });

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);

        if (socket && state.user) {
          if (callMode === "channel") {
            socket.emit("startChannelCall", {
              channelId: target._id,
              type,
              caller: state.user,
              offer: offer,
            });
          } else {
            socket.emit("start_call", {
              receiverId: target._id,
              type,
              caller: state.user,
              offer: offer,
            });
          }
        }
      } catch (error) {
        console.error("❌ Error starting call:", error);
        cleanupMediaStreams();
      }
    },
    [
      socket,
      state.user,
      createPeerConnection,
      getLocalStream,
      addLocalStreamToPeerConnection,
      cleanupMediaStreams,
    ]
  );

  const handleIncomingCall = useCallback(
    (data: {
      caller: User | ChannelCallData;
      type: "audio" | "video";
      callMode: "direct" | "channel";
      channelData?: ChannelCallData;
    }) => {
      console.log("📞 Incoming call received:", data);

      const callReceiver =
        data.callMode === "channel" ? data.channelData! : data.caller;
      const participants =
        data.callMode === "channel"
          ? (data.channelData?.participants as User[]) || []
          : [data.caller as User];

      setCallState({
        isIncomingCall: true,
        isOutgoingCall: false,
        isOnCall: false,
        callReceiver: callReceiver,
        callType: data.type,
        callMode: data.callMode,
        localStream: null,
        remoteStream: null,
        isLocalVideoEnabled: data.type === "video",
        isLocalAudioEnabled: true,
        isRemoteVideoEnabled: true,
        participants,
        callStatus: "ringing",
      });
    },
    []
  );

  const joinCall = useCallback(async () => {
    if (
      callState.isIncomingCall &&
      callState.callReceiver &&
      callState.callType
    ) {
      console.log("✅ Joining call");

      try {
        peerConnection.current = createPeerConnection();

        const stream = await getLocalStream(callState.callType);
        addLocalStreamToPeerConnection(stream);

        setCallState((prev) => ({
          ...prev,
          isIncomingCall: false,
          isOnCall: true,
          isOutgoingCall: false,
          callStatus: "ongoing",
          localStream: stream,
        }));

        if (state.socket && state.user) {
          if (callState.callMode === "channel") {
            state.socket.emit("joinChannelCall", {
              channelId: callState.callReceiver._id,
              user: state.user,
            });
          } else {
            state.socket.emit("accept_call", {
              callerId: callState.callReceiver._id,
            });
          }
        }
      } catch (error) {
        console.error("❌ Error joining call:", error);
        endCall();
      }
    }
  }, [
    callState.isIncomingCall,
    callState.callReceiver,
    callState.callType,
    callState.callMode,
    state.socket,
    state.user,
    createPeerConnection,
    getLocalStream,
    addLocalStreamToPeerConnection,
    endCall,
  ]);

  const acceptCall = useCallback(async () => {
    console.log("✅ Accepting call");

    try {
      if (!callState.callReceiver || !callState.callType) return;

      peerConnection.current = createPeerConnection();

      const stream = await getLocalStream(callState.callType);
      addLocalStreamToPeerConnection(stream);

      setCallState((prev) => ({
        ...prev,
        isIncomingCall: false,
        isOnCall: true,
        isOutgoingCall: false,
        localStream: stream,
        callStatus: "ongoing",
      }));

      if (socket && callState.callReceiver && state.user) {
        if (callState.callMode === "channel") {
          socket.emit("acceptChannelCall", {
            channelId: callState.callReceiver._id,
            user: state.user,
          });
        } else {
          socket.emit("accept_call", {
            callerId: callState.callReceiver._id,
          });
        }
      }
    } catch (error) {
      console.error("❌ Error accepting call:", error);
      endCall();
    }
  }, [
    socket,
    state.user,
    callState.callReceiver,
    callState.callType,
    callState.callMode,
    createPeerConnection,
    getLocalStream,
    addLocalStreamToPeerConnection,
    endCall,
  ]);

  const rejectCall = useCallback(() => {
    console.log("❌ Rejecting call");
    if (socket && callState.callReceiver) {
      if (callState.callMode === "channel") {
        socket.emit("rejectChannelCall", {
          channelId: callState.callReceiver._id,
        });
      } else {
        socket.emit("reject_call", {
          callerId: callState.callReceiver._id,
        });
      }
    }

    cleanupMediaStreams();
    setCallState({
      isIncomingCall: false,
      isOutgoingCall: false,
      isOnCall: false,
      callReceiver: null,
      callType: null,
      callMode: null,
      localStream: null,
      remoteStream: null,
      isLocalVideoEnabled: true,
      isLocalAudioEnabled: true,
      isRemoteVideoEnabled: true,
      participants: [],
      callStatus: "ended",
    });
  }, [socket, callState.callReceiver, callState.callMode, cleanupMediaStreams]);

  useEffect(() => {
    if (state.socket) {
      state.socket.on("incomingDirectCall", (data: IncomingDirectCallData) => {
        handleIncomingCall({
          ...data,
          callMode: "direct" as const,
        });
      });

      state.socket.on(
        "incomingChannelCall",
        (data: IncomingChannelCallData) => {
          handleIncomingCall(data);
        }
      );

      state.socket.on(
        "userJoinedChannelCall",
        (data: UserJoinedChannelCallData) => {
          updateCallParticipants(data.user);
        }
      );

      return () => {
        state.socket?.off("incomingDirectCall");
        state.socket?.off("incomingChannelCall");
        state.socket?.off("userJoinedChannelCall");
      };
    }
  }, [state.socket, handleIncomingCall, updateCallParticipants]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCallEvent = async (data: {
      caller: User;
      type: "audio" | "video";
    }) => {
      console.log("📞 Incoming direct call received:", data);

      if (!data.caller || !data.caller._id || !data.caller.name) {
        console.error("Invalid caller data in incoming call:", data.caller);
        return;
      }

      handleIncomingCall({
        caller: data.caller,
        type: data.type,
        callMode: "direct",
      });
    };

    const handleIncomingChannelCallEvent = async (data: {
      channel: ChannelCallData;
      type: "audio" | "video";
      caller: User;
    }) => {
      console.log("📞 Incoming channel call received:", data);

      handleIncomingCall({
        caller: data.caller,
        type: data.type,
        callMode: "channel",
        channelData: data.channel,
      });
    };

    const handleCallAccepted = async () => {
      console.log("✅ Call accepted");

      try {
        if (peerConnection.current) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);

          if (socket && callState.callReceiver) {
            if (callState.callMode === "channel") {
              socket.emit("channel-offer", {
                offer,
                channelId: callState.callReceiver._id,
              });
            } else {
              socket.emit("offer", {
                offer,
                receiverId: callState.callReceiver._id,
              });
            }
          }
        }

        setCallState((prev) => ({
          ...prev,
          isIncomingCall: false,
          isOutgoingCall: false,
          isOnCall: true,
          callStatus: "ongoing",
        }));
      } catch (error) {
        console.error("❌ Error creating offer:", error);
        endCall();
      }
    };

    const handleCallRejected = () => {
      console.log("❌ Call rejected");
      cleanupMediaStreams();
      setCallState({
        isIncomingCall: false,
        isOutgoingCall: false,
        isOnCall: false,
        callReceiver: null,
        callType: null,
        callMode: null,
        localStream: null,
        remoteStream: null,
        isLocalVideoEnabled: true,
        isLocalAudioEnabled: true,
        isRemoteVideoEnabled: true,
        participants: [],
        callStatus: "ended",
      });
    };

    const handleCallEnded = () => {
      console.log("📞 Call ended by other party");
      cleanupMediaStreams();
      setCallState({
        isIncomingCall: false,
        isOutgoingCall: false,
        isOnCall: false,
        callReceiver: null,
        callType: null,
        callMode: null,
        localStream: null,
        remoteStream: null,
        isLocalVideoEnabled: true,
        isLocalAudioEnabled: true,
        isRemoteVideoEnabled: true,
        participants: [],
        callStatus: "ended",
      });
    };

    const handleOffer = async (data: {
      offer: RTCSessionDescriptionInit;
      callerId: string;
    }) => {
      console.log("📨 Received offer");
      if (!peerConnection.current) return;

      try {
        await peerConnection.current.setRemoteDescription(data.offer);

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        if (socket) {
          socket.emit("answer", {
            answer,
            callerId: data.callerId,
          });
        }
      } catch (error) {
        console.error("❌ Error handling offer:", error);
      }
    };

    const handleAnswer = async (data: {
      answer: RTCSessionDescriptionInit;
    }) => {
      console.log("📨 Received answer");
      if (!peerConnection.current) return;

      try {
        await peerConnection.current.setRemoteDescription(data.answer);
      } catch (error) {
        console.error("❌ Error handling answer:", error);
      }
    };

    const handleIceCandidate = async (data: {
      candidate: RTCIceCandidateInit;
    }) => {
      console.log("❄️ Received ICE candidate");
      if (!peerConnection.current) return;

      try {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    };

    socket.on("incoming_call", handleIncomingCallEvent);
    socket.on("incoming_channel_call", handleIncomingChannelCallEvent);
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("incoming_call", handleIncomingCallEvent);
      socket.off("incoming_channel_call", handleIncomingChannelCallEvent);
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [
    socket,
    callState.callReceiver,
    callState.callMode,
    cleanupMediaStreams,
    endCall,
    handleIncomingCall,
  ]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });

      setCallState((prev) => ({
        ...prev,
        isLocalVideoEnabled: !prev.isLocalVideoEnabled,
      }));
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });

      setCallState((prev) => ({
        ...prev,
        isLocalAudioEnabled: !prev.isLocalAudioEnabled,
      }));
    }
  }, []);

  const value: CallContextType = {
    callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
    handleIncomingCall,
    joinCall,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
