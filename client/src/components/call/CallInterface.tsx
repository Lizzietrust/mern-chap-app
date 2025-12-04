import React, { useState, useEffect } from "react";
import { useCallContext } from "../../hooks/useCallContext";
import type { ChannelCallData } from "../../types/call";
import type { User } from "../../types/types";
import {
  // Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  UserPlus,
  Users,
  // MessageCircle,
  Maximize2,
  Minimize2,
  Settings,
  X,
  Check,
  ChevronDown,
  Volume2,
  Bell,
  Shield,
  Crown,
} from "lucide-react";

const getCurrentUserId = (): string => {
  const userData =
    localStorage.getItem("user") || sessionStorage.getItem("user");
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user._id || user.id || "";
    } catch (e) {
      console.log({ e });
      return "";
    }
  }
  return "";
};

export const CallInterface: React.FC = () => {
  const {
    callState,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
    joinCall,
  } = useCallContext();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [audioLevel, setAudioLevel] = useState(50);
  const [callDuration, setCallDuration] = useState(0);

  const shouldShowCallInterface =
    callState.isIncomingCall || callState.isOutgoingCall || callState.isOnCall;

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState.isOnCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callState.isOnCall]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (!shouldShowCallInterface) {
    return null;
  }

  const {
    callReceiver,
    callType,
    callMode,
    isIncomingCall,
    isOutgoingCall,
    isOnCall,
    localStream,
    // remoteStream,
    isLocalVideoEnabled,
    isLocalAudioEnabled,
    participants,
    callStatus,
  } = callState;

  const isChannelCall = callMode === "channel";
  const currentUserId = getCurrentUserId();

  // Function to get initials from channel name
  const getChannelInitials = (channelName: string): string => {
    return channelName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Helper function to extract name from User object
  const getUserName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.name) return user.name;
    if (user.firstName) return user.firstName;
    return "Unknown";
  };

  const getCallerName = (channelData: ChannelCallData): string => {
    if (channelData.caller) {
      return getUserName(channelData.caller);
    }

    // Check admins array as fallback
    if (channelData.admins && Array.isArray(channelData.admins)) {
      for (const admin of channelData.admins) {
        if (
          typeof admin === "object" &&
          admin !== null &&
          "firstName" in admin
        ) {
          return getUserName(admin as User);
        }
      }
    }

    // Check createdBy as final fallback
    if (channelData.createdBy && typeof channelData.createdBy === "object") {
      if ("firstName" in channelData.createdBy) {
        return getUserName(channelData.createdBy as User);
      }
    }

    // Fallback to "Admin"
    return "Admin";
  };

  // Filter out current user from participants
  const filteredParticipants = participants.filter(
    (participant) => participant._id !== currentUserId
  );

  const getCallerInfo = () => {
    if (!callReceiver) {
      return {
        name: "Unknown",
        avatar: null,
        initials: "U",
        isChannel: false,
      };
    }

    if (isChannelCall) {
      const channelData = callReceiver as ChannelCallData;
      const channelName = channelData.name || "Channel Call";

      // Get the actual caller's name
      const startedBy = getCallerName(channelData);

      return {
        name: channelName,
        avatar: channelData.avatar || null,
        initials: getChannelInitials(channelName),
        participants: filteredParticipants.length,
        isChannel: true,
        startedBy,
      };
    } else {
      const userData = callReceiver as User;
      const userName = getUserName(userData);
      return {
        name: userName,
        avatar: userData.avatar || null,
        initials: userName.charAt(0).toUpperCase(),
        participants: 1,
        isChannel: false,
      };
    }
  };

  const callerInfo = getCallerInfo();

  const getCallStatusText = () => {
    if (isIncomingCall) {
      return isChannelCall ? "Channel call incoming" : "Incoming call";
    }
    if (isOutgoingCall) {
      if (isChannelCall && !isOnCall) {
        return "Starting channel call...";
      }
      return "Calling...";
    }
    if (isOnCall) {
      if (isChannelCall && callStatus === "ongoing") {
        return "In call (Admin)";
      }
      return "On call";
    }
    return "Call";
  };

  const getCallTypeText = () => {
    const typeText = callType === "audio" ? "Audio Call" : "Video Call";
    if (isChannelCall) {
      return `${typeText} • ${callerInfo.participants} participant${
        callerInfo.participants !== 1 ? "s" : ""
      }`;
    }
    return typeText;
  };

  const activeParticipants =
    isChannelCall && isOnCall
      ? filteredParticipants.length + 1
      : filteredParticipants.length;

  const getGridCols = () => {
    const count = filteredParticipants.length + 1;
    if (count <= 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    return "grid-cols-4";
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isFullscreen
          ? "bg-gray-900"
          : "bg-gradient-to-br from-gray-900 via-gray-800 to-black"
      }`}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {callerInfo.avatar ? (
                <img
                  src={callerInfo.avatar}
                  alt={callerInfo.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold">
                  {callerInfo.initials}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">
                {callerInfo.name}
              </h2>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isChannelCall ? "bg-purple-500" : "bg-green-500"
                  } animate-pulse`}
                />
                <span className="text-gray-300 text-sm">
                  {getCallStatusText()}
                </span>
                {isOnCall && (
                  <span className="text-gray-400 text-sm">
                    • {formatDuration(callDuration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOnCall && (
              <>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg bg-gray-800 bg-opacity-50 hover:bg-gray-700 transition-colors"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5 text-gray-300" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-gray-300" />
                  )}
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg bg-gray-800 bg-opacity-50 hover:bg-gray-700 transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5 text-gray-300" />
                </button>
              </>
            )}
            <button
              onClick={endCall}
              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
              title="Leave call"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-30 bg-gray-800 rounded-lg p-4 w-64 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm mb-2 block">
                Microphone
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAudio}
                  className={`p-2 rounded-lg ${
                    isLocalAudioEnabled
                      ? "bg-green-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {isLocalAudioEnabled ? (
                    <Mic className="w-4 h-4 text-white" />
                  ) : (
                    <MicOff className="w-4 h-4 text-white" />
                  )}
                </button>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioLevel}
                    onChange={(e) => setAudioLevel(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <Volume2 className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Camera</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleVideo}
                  className={`p-2 rounded-lg ${
                    isLocalVideoEnabled
                      ? "bg-green-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {isLocalVideoEnabled ? (
                    <Video className="w-4 h-4 text-white" />
                  ) : (
                    <VideoOff className="w-4 h-4 text-white" />
                  )}
                </button>
                <select className="flex-1 bg-gray-700 text-white rounded-lg p-2 text-sm">
                  <option>Default Camera</option>
                  <option>Front Camera</option>
                  <option>Back Camera</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="absolute inset-0 pt-20 pb-32 px-4 overflow-hidden">
        {/* Video/Audio Content */}
        {callType === "video" && isOnCall ? (
          <div className="h-full flex flex-col">
            {/* Remote Participants Grid */}
            <div className={`grid ${getGridCols()} gap-4 flex-1`}>
              {/* Remote Streams */}
              {filteredParticipants.map((participant) => {
                const participantName = getUserName(participant);
                const participantInitials = participantName
                  .charAt(0)
                  .toUpperCase();
                return (
                  <div
                    key={participant._id}
                    className="relative bg-gray-800 rounded-xl overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                        <span className="text-3xl text-white font-bold">
                          {participantInitials}
                        </span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">
                          {participantName}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-xs text-gray-300">Live</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Local Video */}
              <div className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-blue-500">
                {localStream && isLocalVideoEnabled ? (
                  <video
                    autoPlay
                    playsInline
                    muted
                    ref={(video) => {
                      if (video && localStream) {
                        video.srcObject = localStream;
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl text-white font-bold">
                          You
                        </span>
                      </div>
                      <p className="text-gray-400">
                        {isLocalVideoEnabled ? "Camera is on" : "Camera is off"}
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                  <span className="text-white text-sm">You</span>
                </div>
              </div>
            </div>

            {/* Participants Sidebar */}
            {isChannelCall && showParticipants && (
              <div className="absolute top-4 left-4 w-64 bg-gray-900/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    <h3 className="text-white font-semibold">Participants</h3>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {activeParticipants}
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-xs text-white font-semibold">
                        You
                      </span>
                    </div>
                    <span className="text-white text-sm">You (Host)</span>
                    <Crown className="w-4 h-4 text-yellow-500 ml-auto" />
                  </div>
                  {filteredParticipants.map((participant) => {
                    const participantName = getUserName(participant);
                    const participantInitials = participantName
                      .charAt(0)
                      .toUpperCase();
                    return (
                      <div
                        key={participant._id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                          <span className="text-xs text-white font-semibold">
                            {participantInitials}
                          </span>
                        </div>
                        <span className="text-gray-300 text-sm">
                          {participantName}
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <Mic className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : isOnCall ? (
          // Audio Call View
          <div className="h-full flex flex-col items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full" />
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
                {callerInfo.avatar ? (
                  <img
                    src={callerInfo.avatar}
                    alt={callerInfo.name}
                    className="w-44 h-44 rounded-full object-cover border-4 border-gray-900"
                  />
                ) : (
                  <span className="text-6xl text-white font-bold">
                    {callerInfo.initials}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-6 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                {callerInfo.name}
              </h2>
              <p className="text-gray-400">
                {isChannelCall
                  ? `Channel audio call with ${activeParticipants} people`
                  : "Audio call in progress"}
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Live</span>
                </div>
                <span>•</span>
                <span>{formatDuration(callDuration)}</span>
              </div>
            </div>

            {/* Audio Visualization */}
            <div className="mt-4 flex items-center gap-1">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 40 + 10}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          // Incoming/Outgoing Call View
          <div className="h-full flex flex-col items-center justify-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 animate-ping bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full" />
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
                {callerInfo.avatar ? (
                  <img
                    src={callerInfo.avatar}
                    alt={callerInfo.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-gray-900"
                  />
                ) : (
                  <span className="text-4xl text-white font-bold">
                    {callerInfo.initials}
                  </span>
                )}
              </div>
              {isIncomingCall && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center animate-bounce">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>

            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-3">
                {callerInfo.name}
              </h2>
              <p className="text-gray-400 text-lg mb-1">
                {isChannelCall ? "Channel Call" : getCallTypeText()}
              </p>
              {isChannelCall && (
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{activeParticipants} participants</span>
                  {callerInfo.startedBy && (
                    <>
                      <span>•</span>
                      <span>Started by {callerInfo.startedBy}</span>
                    </>
                  )}
                </div>
              )}
              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                    isIncomingCall
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isIncomingCall ? "bg-yellow-500" : "bg-blue-500"
                    } animate-pulse`}
                  />
                  {getCallStatusText()}
                </span>
              </div>
            </div>

            {/* Channel Call Participants Preview */}
            {isChannelCall && filteredParticipants.length > 0 && (
              <div className="mb-8">
                <p className="text-gray-400 text-center mb-3">
                  Currently in call:
                </p>
                <div className="flex justify-center gap-2">
                  {filteredParticipants.slice(0, 5).map((participant) => {
                    const participantName = getUserName(participant);
                    const participantInitials = participantName
                      .charAt(0)
                      .toUpperCase();
                    return (
                      <div
                        key={participant._id}
                        className="flex flex-col items-center group"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center relative">
                          <span className="text-white font-semibold">
                            {participantInitials}
                          </span>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-gray-900" />
                        </div>
                        <span className="text-xs text-gray-400 mt-1 max-w-16 truncate">
                          {participantName}
                        </span>
                      </div>
                    );
                  })}
                  {filteredParticipants.length > 5 && (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{filteredParticipants.length - 5}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 mt-1">More</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
        <div className="max-w-4xl mx-auto">
          {/* Primary Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {isIncomingCall ? (
              <>
                <button
                  onClick={acceptCall}
                  className="group relative p-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
                  title="Accept Call"
                >
                  <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
                  <Check className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={rejectCall}
                  className="group relative p-5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
                  title="Reject Call"
                >
                  <X className="w-8 h-8 text-white" />
                </button>
              </>
            ) : isOutgoingCall ? (
              <button
                onClick={endCall}
                className="group relative p-5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 animate-pulse"
                title="Cancel Call"
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </button>
            ) : (
              <>
                <button
                  onClick={toggleAudio}
                  className={`group p-4 rounded-xl transition-all duration-300 ${
                    isLocalAudioEnabled
                      ? "bg-gray-800 hover:bg-gray-700"
                      : "bg-red-600/20 hover:bg-red-600/30 text-red-400"
                  }`}
                  title={
                    isLocalAudioEnabled
                      ? "Mute microphone"
                      : "Unmute microphone"
                  }
                >
                  {isLocalAudioEnabled ? (
                    <Mic className="w-6 h-6" />
                  ) : (
                    <MicOff className="w-6 h-6" />
                  )}
                </button>

                {callType === "video" && (
                  <button
                    onClick={toggleVideo}
                    className={`group p-4 rounded-xl transition-all duration-300 ${
                      isLocalVideoEnabled
                        ? "bg-gray-800 hover:bg-gray-700"
                        : "bg-red-600/20 hover:bg-red-600/30 text-red-400"
                    }`}
                    title={
                      isLocalVideoEnabled ? "Turn off camera" : "Turn on camera"
                    }
                  >
                    {isLocalVideoEnabled ? (
                      <Video className="w-6 h-6" />
                    ) : (
                      <VideoOff className="w-6 h-6" />
                    )}
                  </button>
                )}

                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                  title={
                    showParticipants ? "Hide participants" : "Show participants"
                  }
                >
                  <Users className="w-6 h-6" />
                </button>

                <button
                  onClick={endCall}
                  className="group relative p-5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
                  title="End Call"
                >
                  <PhoneOff className="w-8 h-8 text-white" />
                </button>

                <button
                  className="p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                  title="More options"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Join Channel Call Button */}
          {isChannelCall && isIncomingCall && (
            <div className="text-center mt-4">
              <button
                onClick={joinCall}
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
              >
                <div className="absolute inset-0 rounded-full bg-white/10 animate-ping opacity-20" />
                <UserPlus className="w-6 h-6" />
                Join Channel Call
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  {activeParticipants} people
                </span>
              </button>
              <p className="text-gray-400 mt-3">
                Join the call started by{" "}
                {callerInfo.startedBy || "the channel admin"}
              </p>
            </div>
          )}

          {/* Call Status Bar */}
          <div className="text-center mt-6">
            <div className="inline-flex items-center gap-4 bg-gray-900/50 backdrop-blur-sm rounded-full px-6 py-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isChannelCall ? "bg-purple-500" : "bg-green-500"
                  } animate-pulse`}
                />
                <span className="text-gray-300 text-sm">
                  {getCallTypeText()}
                </span>
              </div>
              {isChannelCall && (
                <>
                  <div className="w-px h-4 bg-gray-700" />
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300 text-sm">
                      End-to-end encrypted
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
