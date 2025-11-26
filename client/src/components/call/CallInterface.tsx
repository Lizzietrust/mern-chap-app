import React from "react";
import { useCallContext } from "../../hooks/useCallContext";
import type { ChannelCallData } from "../../contexts/call/call-context";
import type { User } from "../../types/types";

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

  const shouldShowCallInterface =
    callState.isIncomingCall || callState.isOutgoingCall || callState.isOnCall;

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
    remoteStream,
    isLocalVideoEnabled,
    isLocalAudioEnabled,
    participants,
  } = callState;

  const isChannelCall = callMode === "channel";

  const getCallerInfo = () => {
    if (!callReceiver) {
      return { name: "Unknown", avatar: "/default-avatar.png" };
    }

    if (isChannelCall) {
      const channelData = callReceiver as ChannelCallData;
      return {
        name: channelData.name || "Channel Call",
        avatar: "/channel-avatar.png",
        participants: participants.length,
      };
    } else {
      const userData = callReceiver as User;
      return {
        name: userData.name || "Unknown User",
        avatar: userData.avatar || "/default-avatar.png",
        participants: 1,
      };
    }
  };

  const callerInfo = getCallerInfo();

  const getCallStatusText = () => {
    if (isIncomingCall) return "Incoming call";
    if (isOutgoingCall) return "Calling...";
    if (isOnCall) return "On call";
    return "Call";
  };

  const getCallTypeText = () => {
    const typeText = callType === "audio" ? "Audio Call" : "Video Call";
    if (isChannelCall) {
      return `${typeText} • ${callerInfo.participants} participants`;
    }
    return typeText;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-4xl w-full">
        {/* Call Header */}
        <div className="mb-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            {callerInfo.avatar ? (
              <img
                src={callerInfo.avatar}
                alt={callerInfo.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-2xl font-semibold">
                {callerInfo.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {callerInfo.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {getCallStatusText()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {getCallTypeText()}
          </p>

          {/* Channel call participants info */}
          {isChannelCall && isOnCall && (
            <div className="mt-3">
              <p className="text-sm text-green-600 dark:text-green-400">
                {participants.length} people in call
              </p>
            </div>
          )}
        </div>

        {/* Participants List for Channel Calls */}
        {isChannelCall &&
          (isOnCall || isIncomingCall) &&
          participants.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                Participants
              </h4>
              <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto">
                {participants.slice(0, 6).map((participant) => (
                  <div
                    key={participant._id}
                    className="flex flex-col items-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                      {participant.avatar ? (
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium">
                          {participant.name?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs mt-1 text-gray-600 dark:text-gray-400 max-w-16 truncate">
                      {participant.name}
                    </span>
                  </div>
                ))}
                {participants.length > 6 && (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-500 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        +{participants.length - 6}
                      </span>
                    </div>
                    <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                      More
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Video Streams */}
        {callType === "video" && isOnCall && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Remote Video */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              {remoteStream ? (
                <video
                  autoPlay
                  playsInline
                  muted={false}
                  ref={(video) => {
                    if (video && remoteStream) {
                      video.srcObject = remoteStream;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-600 flex items-center justify-center">
                      <span className="text-2xl">
                        {callerInfo.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <p>Connecting...</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {callerInfo.name}
              </div>
            </div>

            {/* Local Video */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              {localStream ? (
                <video
                  autoPlay
                  playsInline
                  muted={true}
                  ref={(video) => {
                    if (video && localStream) {
                      video.srcObject = localStream;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-600 flex items-center justify-center">
                      <span className="text-2xl">You</span>
                    </div>
                    <p>Your camera</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You
              </div>
            </div>
          </div>
        )}

        {/* Audio Only View */}
        {callType === "audio" && isOnCall && (
          <div className="text-center mb-6">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {callerInfo.avatar ? (
                <img
                  src={callerInfo.avatar}
                  alt={callerInfo.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-4xl font-semibold rounded-full">
                  {callerInfo.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {isChannelCall
                ? "Channel audio call in progress..."
                : "Audio call in progress..."}
            </p>

            {/* Active participants for audio channel calls */}
            {isChannelCall && participants.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Active participants:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {participants.slice(0, 8).map((participant) => (
                    <div
                      key={participant._id}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
                    >
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-xs text-white">
                          {participant.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm">{participant.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Call Controls */}
        <div className="flex justify-center space-x-6">
          {/* Incoming Call */}
          {isIncomingCall && (
            <>
              <button
                onClick={acceptCall}
                className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                title="Accept Call"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                onClick={rejectCall}
                className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Reject Call"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Outgoing Call */}
          {isOutgoingCall && (
            <button
              onClick={endCall}
              className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              title="Cancel Call"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Active Call Controls */}
          {isOnCall && (
            <>
              {callType === "video" && (
                <button
                  onClick={toggleVideo}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    isLocalVideoEnabled
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  title={
                    isLocalVideoEnabled ? "Turn off camera" : "Turn on camera"
                  }
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isLocalVideoEnabled ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 001.591-.659z"
                      />
                    )}
                  </svg>
                </button>
              )}

              <button
                onClick={toggleAudio}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isLocalAudioEnabled
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                title={
                  isLocalAudioEnabled ? "Mute microphone" : "Unmute microphone"
                }
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isLocalAudioEnabled ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  )}
                </svg>
              </button>

              <button
                onClick={endCall}
                className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                title="End Call"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Join Call Button for Channel Calls */}
        {isChannelCall && isIncomingCall && (
          <div className="mt-6 text-center">
            <button
              onClick={joinCall}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              Join Channel Call
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Join the ongoing call with {callerInfo.participants} participants
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
