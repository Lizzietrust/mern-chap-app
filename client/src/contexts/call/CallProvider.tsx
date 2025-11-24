import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  CallContext,
  type CallState,
  type CallContextType,
} from "./call-context";
import type { User } from "../../types/types";
import { useApp } from "../appcontext/index";

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
    localStream: null,
    remoteStream: null,
    isLocalVideoEnabled: true,
    isLocalAudioEnabled: true,
    isRemoteVideoEnabled: true,
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

  const getLocalStream = useCallback(async (type: "audio" | "video") => {
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
  }, []);

  const addLocalStreamToPeerConnection = useCallback((stream: MediaStream) => {
    if (!peerConnection.current) return;

    stream.getTracks().forEach((track) => {
      peerConnection.current!.addTrack(track, stream);
    });
  }, []);

  const endCall = useCallback(() => {
    console.log("📞 Ending call");
    if (socket && callState.callReceiver) {
      socket.emit("end_call", {
        receiverId: callState.callReceiver._id,
      });
    }

    cleanupMediaStreams();
    setCallState({
      isIncomingCall: false,
      isOutgoingCall: false,
      isOnCall: false,
      callReceiver: null,
      callType: null,
      localStream: null,
      remoteStream: null,
      isLocalVideoEnabled: true,
      isLocalAudioEnabled: true,
      isRemoteVideoEnabled: true,
    });
  }, [socket, callState.callReceiver, cleanupMediaStreams]);

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
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          receiverId: callState.callReceiver._id,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state: ${pc.connectionState}`);
      if (pc.connectionState === "connected") {
        console.log("✅ WebRTC connection established");
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        console.log("❌ WebRTC connection failed");
        endCall();
      }
    };

    return pc;
  }, [socket, callState.callReceiver, endCall]);

  const startCall = useCallback(
    async (user: User, type: "audio" | "video") => {
      console.log("📞 Starting call to:", user._id, "Type:", type);

      try {
        peerConnection.current = createPeerConnection();

        const stream = await getLocalStream(type);
        addLocalStreamToPeerConnection(stream);

        setCallState({
          isIncomingCall: false,
          isOutgoingCall: true,
          isOnCall: false,
          callReceiver: user,
          callType: type,
          localStream: stream,
          remoteStream: null,
          isLocalVideoEnabled: type === "video",
          isLocalAudioEnabled: true,
          isRemoteVideoEnabled: true,
        });

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);

        if (socket && state.user) {
          socket.emit("start_call", {
            receiverId: user._id,
            type,
            caller: state.user,
            offer: offer,
          });
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
        localStream: stream,
      }));

      if (socket && callState.callReceiver) {
        socket.emit("accept_call", { callerId: callState.callReceiver._id });
      }
    } catch (error) {
      console.error("❌ Error accepting call:", error);
      endCall();
    }
  }, [
    socket,
    callState.callReceiver,
    callState.callType,
    createPeerConnection,
    getLocalStream,
    addLocalStreamToPeerConnection,
    endCall,
  ]);

  const rejectCall = useCallback(() => {
    console.log("❌ Rejecting call");
    if (socket && callState.callReceiver) {
      socket.emit("reject_call", { callerId: callState.callReceiver._id });
    }

    cleanupMediaStreams();
    setCallState({
      isIncomingCall: false,
      isOutgoingCall: false,
      isOnCall: false,
      callReceiver: null,
      callType: null,
      localStream: null,
      remoteStream: null,
      isLocalVideoEnabled: true,
      isLocalAudioEnabled: true,
      isRemoteVideoEnabled: true,
    });
  }, [socket, callState.callReceiver, cleanupMediaStreams]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = async (data: {
      caller: User;
      type: "audio" | "video";
    }) => {
      console.log("📞 Incoming call received:", data);
      setCallState({
        isIncomingCall: true,
        isOutgoingCall: false,
        isOnCall: false,
        callReceiver: data.caller,
        callType: data.type,
        localStream: null,
        remoteStream: null,
        isLocalVideoEnabled: data.type === "video",
        isLocalAudioEnabled: true,
        isRemoteVideoEnabled: true,
      });
    };

    const handleCallAccepted = async () => {
      console.log("✅ Call accepted");

      try {
        if (peerConnection.current) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);

          if (socket && callState.callReceiver) {
            socket.emit("offer", {
              offer,
              receiverId: callState.callReceiver._id,
            });
          }
        }

        setCallState((prev) => ({
          ...prev,
          isIncomingCall: false,
          isOutgoingCall: false,
          isOnCall: true,
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
        localStream: null,
        remoteStream: null,
        isLocalVideoEnabled: true,
        isLocalAudioEnabled: true,
        isRemoteVideoEnabled: true,
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
        localStream: null,
        remoteStream: null,
        isLocalVideoEnabled: true,
        isLocalAudioEnabled: true,
        isRemoteVideoEnabled: true,
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

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [socket, callState.callReceiver, cleanupMediaStreams, endCall]);

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
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
