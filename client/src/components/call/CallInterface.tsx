import React from "react";
import { useCallContext } from "../../hooks/useCallContext";
import type { ChannelCallData } from "../../types/call";
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
    callStatus,
  } = callState;

  const isChannelCall = callMode === "channel";

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

  // Updated function to get caller's name from channel data
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
        avatar: null,
        initials: getChannelInitials(channelName),
        participants: participants.length,
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

  console.log("Call Interface Debug:", {
    callReceiver,
    callMode,
    isChannelCall,
    channelData: isChannelCall ? (callReceiver as ChannelCallData) : null,
    callerInfo,
    callStatus,
  });

  // Update the getCallStatusText function
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
      // Show admin status if they started the call
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
      return `${typeText} • ${callerInfo.participants} participants`;
    }
    return typeText;
  };

  // Update the participant count logic
  const activeParticipants =
    isChannelCall && isOnCall ? participants.length + 1 : participants.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-4xl w-full">
        {/* Call Header */}
        <div className="mb-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
            {callerInfo.avatar ? (
              <img
                src={callerInfo.avatar}
                alt={callerInfo.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                {callerInfo.initials}
              </div>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {callerInfo.name}
            {isChannelCall && (
              <span className="ml-2 text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                Channel
              </span>
            )}
          </h3>

          {/* Show who started the channel call */}
          {isChannelCall && callerInfo.startedBy && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Started by {callerInfo.startedBy}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isChannelCall ? "bg-purple-500" : "bg-blue-500"
              }`}
            ></span>
            <p className="text-gray-600 dark:text-gray-400">
              {getCallStatusText()}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {getCallTypeText()}
          </p>

          {/* Channel call participants info */}
          {isChannelCall && isOnCall && (
            <div className="mt-3">
              <p className="text-sm text-green-600 dark:text-green-400">
                {activeParticipants} people in call (including you)
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
                {participants.slice(0, 6).map((participant) => {
                  const participantName = getUserName(participant);
                  const participantInitials = participantName
                    .charAt(0)
                    .toUpperCase();
                  return (
                    <div
                      key={participant._id}
                      className="flex flex-col items-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center overflow-hidden">
                        {participant.avatar ? (
                          <img
                            src={participant.avatar}
                            alt={participantName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium text-white">
                            {participantInitials}
                          </span>
                        )}
                      </div>
                      <span className="text-xs mt-1 text-gray-600 dark:text-gray-400 max-w-16 truncate">
                        {participantName}
                      </span>
                    </div>
                  );
                })}
                {participants.length > 6 && (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
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
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-2xl">{callerInfo.initials}</span>
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
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
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
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {callerInfo.avatar ? (
                <img
                  src={callerInfo.avatar}
                  alt={callerInfo.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold rounded-full">
                  {callerInfo.initials}
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
                  {participants.slice(0, 8).map((participant) => {
                    const participantName = getUserName(participant);
                    const participantInitials = participantName
                      .charAt(0)
                      .toUpperCase();
                    return (
                      <div
                        key={participant._id}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                          <span className="text-xs text-white">
                            {participantInitials}
                          </span>
                        </div>
                        <span className="text-sm">{participantName}</span>
                      </div>
                    );
                  })}
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
                className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg"
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
                className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
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
              className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
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
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${
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
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${
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
                className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
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
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Join Channel Call
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Join the ongoing call with {callerInfo.participants} participants
              {callerInfo.startedBy && ` started by ${callerInfo.startedBy}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
