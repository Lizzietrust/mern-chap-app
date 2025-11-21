import React, { useMemo } from "react";
import { Modal } from "../modals/Modal";
import type { UserChat, ChannelChat, User } from "../../types/types";
import { getUserId } from "../../types/types";
import { useNavigate } from "react-router-dom";

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: UserChat | ChannelChat | null;
  currentUser: User | null;
  isDark: boolean;
  onViewProfile?: (user: User) => void;
}

export const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  isOpen,
  onClose,
  chat,
  currentUser,
  isDark,
}) => {
  const navigate = useNavigate();

  const isChannel = useMemo(() => chat?.type === "channel", [chat]);

  const participants = useMemo(() => {
    if (!chat) return [];
    return isChannel
      ? (chat as ChannelChat).members
      : (chat as UserChat).participants;
  }, [chat, isChannel]);

  const otherParticipants = useMemo(() => {
    if (!participants || !currentUser) return [];

    return participants.filter((participant) => {
      const participantId = getUserId(participant);
      return participantId !== currentUser._id;
    });
  }, [participants, currentUser]);

  console.log({ participants });
  console.log({ chat });

  const getParticipantName = (participant: User | string): string => {
    if (typeof participant === "string") {
      return "Unknown User";
    }
    return `${participant.firstName} ${participant.lastName}`;
  };

  const getParticipantEmail = (participant: User | string): string => {
    if (typeof participant === "string") {
      return "Unknown email";
    }
    return participant.email || "No email";
  };

  const isCurrentUser = (participant: User | string): boolean => {
    const participantId = getUserId(participant);
    return participantId === currentUser?._id;
  };

  const isAdmin = (participant: User | string): boolean => {
    if (!isChannel || !chat) return false;
    const participantId = getUserId(participant);
    return (
      (chat as ChannelChat).admins?.some(
        (admin) => getUserId(admin) === participantId
      ) || false
    );
  };

  const handleParticipantClick = (participant: User | string) => {
    if (typeof participant === "string") {
      navigate(`/profile/${participant}`);
      onClose();
      return;
    }

    navigate(`/profile/${participant._id}`);
    onClose();
  };

  const getParticipantUser = (participant: User | string): User | null => {
    if (typeof participant === "object") {
      return participant;
    }
    return null;
  };

  if (!chat) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isChannel ? "Channel Members" : "Chat Participants"}
      size="md"
      isDark={isDark}
    >
      <div
        className={`max-h-96 overflow-y-auto ${
          isDark ? "text-gray-200" : "text-gray-800"
        }`}
      >
        {!otherParticipants || otherParticipants.length === 0 ? (
          <div className="text-center py-8">
            <p className={isDark ? "text-gray-400" : "text-gray-500"}>
              {currentUser
                ? "No other participants found"
                : "No participants found"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {otherParticipants.map((participant, index) => {
              const userObject = getParticipantUser(participant);
              const isClickable = userObject !== null;

              return (
                <div
                  key={getUserId(participant) || index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isDark ? "bg-gray-700" : "bg-gray-50"
                  } ${
                    isClickable
                      ? `cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                          isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"
                        }`
                      : ""
                  }`}
                  onClick={() =>
                    isClickable && handleParticipantClick(participant)
                  }
                  title={
                    isClickable
                      ? `View ${getParticipantName(participant)}'s profile`
                      : "Cannot view profile"
                  }
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                      {typeof participant === "object" && participant.image ? (
                        <img
                          src={participant.image}
                          alt={`${getParticipantName(participant)}'s avatar`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center ${
                            isDark ? "bg-blue-600" : "bg-blue-500"
                          } text-white font-semibold`}
                        >
                          {typeof participant === "object" &&
                          participant.firstName &&
                          participant.lastName
                            ? `${participant.firstName[0]}${participant.lastName[0]}`.toUpperCase()
                            : "UU"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-medium ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {getParticipantName(participant)}
                          {isCurrentUser(participant) && (
                            <span
                              className={`ml-2 text-xs ${
                                isDark ? "text-blue-400" : "text-blue-600"
                              }`}
                            >
                              (You)
                            </span>
                          )}
                        </span>
                        {isAdmin(participant) && (
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              isDark
                                ? "bg-yellow-600 text-yellow-100"
                                : "bg-yellow-500 text-white"
                            }`}
                          >
                            Admin
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {getParticipantEmail(participant)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {typeof participant === "object" &&
                      participant.isOnline !== undefined && (
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              participant.isOnline
                                ? "bg-green-500 animate-pulse"
                                : "bg-gray-400"
                            }`}
                            title={participant.isOnline ? "Online" : "Offline"}
                          />
                          <span
                            className={`text-xs ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {participant.isOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                      )}

                    {isClickable && (
                      <div className="flex items-center space-x-1">
                        <span
                          className={`text-xs ${
                            isDark ? "text-blue-400" : "text-blue-600"
                          }`}
                        >
                          View Profile
                        </span>
                        <svg
                          className={`w-4 h-4 ${
                            isDark ? "text-blue-400" : "text-blue-600"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isChannel && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              isDark ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            <p
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <strong>Total members:</strong> {participants?.length || 0}
            </p>
            <p
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <strong>Online:</strong>{" "}
              {participants?.filter((p) => typeof p === "object" && p.isOnline)
                .length || 0}
            </p>
            <p
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <strong>Other members shown:</strong> {otherParticipants.length}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
