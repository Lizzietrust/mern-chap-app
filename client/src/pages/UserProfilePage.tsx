import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../contexts/appcontext/index";
import { useTheme } from "../contexts/theme";
import { Layout } from "../components/Layout";
import {
  useUpdateUserProfileCache,
  useUserProfile,
} from "../hooks/users/useUserProfile";
import type { User, Message, FileMessage, ChannelChat } from "../types/types";
import { isFileMessage } from "../types/types";
import { useSharedMedia } from "../hooks/chats/useSharedMedia";
import { useCommonChannels } from "../hooks/channels/useCommonChannels";
import { useChatLogic } from "../hooks/chats";
import { useChatContext } from "../hooks/useChatContext";

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { state } = useApp();
  const { socket } = state;
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { updateUserProfileCache } = useUpdateUserProfileCache();

  const {
    data: userProfile,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useUserProfile(userId);

  const { data: sharedMedia, isLoading: sharedMediaLoading } = useSharedMedia(
    userId,
    state.user?._id
  );

  console.log({ sharedMedia });

  const { data: commonChannels, isLoading: commonChannelsLoading } =
    useCommonChannels(state.user?._id || "", userId || "");

  console.log({ commonChannels });

  const enhancedUserProfile = useMemo(() => {
    if (!userProfile || !state.onlineUsers) return userProfile;

    const onlineUser = state.onlineUsers.find((user) => user._id === userId);

    return {
      ...userProfile,
      isOnline: onlineUser?.isOnline || userProfile.isOnline || false,
      lastSeen: onlineUser?.lastSeen || userProfile.lastSeen,
    };
  }, [userProfile, state.onlineUsers, userId]);

  const isCurrentUser = useMemo(() => {
    return userId === state.user?._id;
  }, [userId, state.user]);

  const groupedMedia = useMemo(() => {
    if (!sharedMedia) return { images: [], videos: [], files: [], audio: [] };

    const fileMessages = sharedMedia.filter(isFileMessage);

    return {
      images: fileMessages.filter(
        (msg) => msg.messageType === "image" && !msg.isDeleted
      ),
      videos: fileMessages.filter(
        (msg) => msg.messageType === "video" && !msg.isDeleted
      ),
      files: fileMessages.filter(
        (msg) => msg.messageType === "file" && !msg.isDeleted
      ),
      audio: fileMessages.filter(
        (msg) => msg.messageType === "audio" && !msg.isDeleted
      ),
    };
  }, [sharedMedia]);

  const [selectedMedia, setSelectedMedia] = useState<Message | null>(null);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);

  useEffect(() => {
    if (!socket || !userId) return;

    console.log("🔌 Setting up profile_updated listener for user:", userId);

    const handleProfileUpdate = (data: {
      userId: string;
      updates: Partial<User>;
    }) => {
      console.log("📢 Received profile_updated event:", data);

      if (data.userId === userId) {
        console.log(
          "🔄 Updating profile cache for user:",
          userId,
          data.updates
        );

        updateUserProfileCache(userId, data.updates);
        refetch();
      }
    };

    const handleUserOnline = (data: { userId: string; isOnline: boolean }) => {
      if (data.userId === userId) {
        console.log("🟢 User online status updated:", data);
        refetch();
      }
    };

    socket.on("profile_updated", handleProfileUpdate);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOnline);

    return () => {
      console.log("🧹 Cleaning up profile_updated listener for user:", userId);
      socket.off("profile_updated", handleProfileUpdate);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOnline);
    };
  }, [socket, userId, updateUserProfileCache, refetch]);

  useEffect(() => {
    console.log("🔄 UserProfile data changed:", userProfile);
  }, [userProfile]);

  const handleRefresh = () => {
    refetch();
  };

  const handleSendMessage = () => {
    if (enhancedUserProfile) {
      navigate(`/chat?userId=${enhancedUserProfile._id}`);
    }
  };

  const handleBackToChat = () => {
    navigate(-1);
  };

  const handleMediaClick = (media: Message) => {
    setSelectedMedia(media);
    setMediaViewerOpen(true);
  };

  const handleDownloadMedia = async (media: Message) => {
    if (!isFileMessage(media)) return;

    const fileUrl = media.fileUrl;
    const fileName = media.fileName || `file-${media._id}`;

    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const { setSelectedChat } = useChatLogic();
  const { setActiveTab } = useChatContext();

  const handleChannelClick = (channel: ChannelChat) => {
    navigate("/chat");
    setSelectedChat(channel);
    setActiveTab("channels");
  };

  const renderCommonChannels = () => {
    if (commonChannelsLoading) {
      return (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className={isDark ? "text-gray-400" : "text-gray-500"}>
            Loading common channels...
          </p>
        </div>
      );
    }

    if (!commonChannels || commonChannels.length === 0) {
      return (
        <div className="text-center py-6">
          <div className="text-4xl mb-4">👥</div>
          <p className={isDark ? "text-gray-400" : "text-gray-500"}>
            No common channels yet
          </p>
          <p
            className={`text-sm mt-2 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            You're not in any channels with this user
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {commonChannels.map((channel) => (
          <div
            key={channel._id}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => handleChannelClick(channel)}
            title={`Go to ${channel.name}`}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
              {/* {channel.image ? (
                <img
                  src={channel.image}
                  alt={channel.name}
                  className="w-full h-full object-cover"
                />
              ) : ( */}
              <div
                className={`w-full h-full flex items-center justify-center ${
                  isDark ? "bg-blue-600" : "bg-blue-500"
                } text-white font-semibold text-sm`}
              >
                {channel.name?.charAt(0)?.toUpperCase() || "G"}
              </div>
              {/* )} */}
            </div>

            <div className="flex-1">
              <h4
                className={`font-medium ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {channel.name}
              </h4>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {channel.members?.length || 0} members
                {channel.description && ` • ${channel.description}`}
              </p>
            </div>

            <div className="flex items-center space-x-1">
              <span
                className={`text-xs ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`}
              >
                View
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
          </div>
        ))}
      </div>
    );
  };

  const renderMediaSection = (
    title: string,
    media: Message[],
    icon: string,
    type: string
  ) => {
    const fileMedia = media.filter(
      (msg): msg is FileMessage =>
        isFileMessage(msg) && msg.messageType === type && !msg.isDeleted
    );

    if (fileMedia.length === 0) return null;

    return (
      <div className="mb-6">
        <h3
          className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          <span>{icon}</span>
          {title} ({fileMedia.length})
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {fileMedia.slice(0, 12).map((item) => (
            <div
              key={item._id}
              className={`relative channel cursor-pointer rounded-lg overflow-hidden ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
              onClick={() => handleMediaClick(item)}
            >
              {type === "image" && (
                <img
                  src={item.fileUrl}
                  alt="Shared media"
                  className="w-full h-20 object-cover hover:scale-105 transition-transform duration-200"
                />
              )}
              {type === "video" && (
                <div className="relative w-full h-20">
                  <video className="w-full h-20 object-cover">
                    <source src={item.fileUrl} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
              {(type === "file" || type === "audio") && (
                <div className="w-full h-20 flex flex-col items-center justify-center p-2">
                  <svg
                    className="w-8 h-8 text-gray-400 mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={
                        type === "file"
                          ? "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          : "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                      }
                    />
                  </svg>
                  <span className="text-xs text-center truncate w-full">
                    {item.fileName || "File"}
                  </span>
                </div>
              )}

              {/* Overlay with download button */}
              <div
                className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadMedia(item);
                  }}
                  className="p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {fileMedia.length > 12 && (
            <div
              className={`flex items-center justify-center rounded-lg ${
                isDark ? "bg-gray-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`text-sm ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                +{fileMedia.length - 12} more
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div
          className={`min-h-screen flex items-center justify-center ${
            isDark ? "bg-gray-900" : "bg-gray-50"
          }`}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={isDark ? "text-gray-300" : "text-gray-600"}>
              Loading profile...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !enhancedUserProfile) {
    return (
      <Layout>
        <div
          className={`min-h-screen flex items-center justify-center ${
            isDark ? "bg-gray-900" : "bg-gray-50"
          }`}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2
              className={`text-2xl font-bold mb-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Profile Not Found
            </h2>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              The user profile you're looking for doesn't exist or you don't
              have permission to view it.
            </p>
            <button
              onClick={handleBackToChat}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Back to Chat
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefetching}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isDark
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              } cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRefetching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const safeAvatar =
    enhancedUserProfile.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      enhancedUserProfile.name || enhancedUserProfile.email || "User"
    )}`;

  const safeName = enhancedUserProfile.name || "Unknown User";
  const safeEmail = enhancedUserProfile.email || "No email";
  const safeBio = enhancedUserProfile.bio;
  const safeLocation = enhancedUserProfile.location;
  const safeWebsite = enhancedUserProfile.website;
  const safePhone = enhancedUserProfile.phone;
  const safeJoinedDate = enhancedUserProfile.joinedDate;
  const safeLastSeen = enhancedUserProfile.lastSeen;

  return (
    <Layout>
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={handleBackToChat}
            className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg ${
              isDark
                ? "text-gray-300 hover:bg-gray-800"
                : "text-gray-600 hover:bg-gray-100"
            } cursor-pointer`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Chat
          </button>

          {/* Profile Card */}
          <div
            className={`rounded-2xl shadow-lg overflow-hidden ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Cover Photo */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
              {/* {enhancedUserProfile.coverPhoto && (
                <img
                  src={enhancedUserProfile.coverPhoto}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              )} */}
            </div>

            {/* Profile Content */}
            <div className="px-6 pb-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 mb-6">
                <div className="relative">
                  <img
                    src={safeAvatar}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover"
                  />
                  {enhancedUserProfile.isOnline && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                      <h1
                        className={`text-3xl font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {safeName}
                      </h1>
                      <p
                        className={`text-lg ${
                          isDark ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {safeEmail}
                      </p>
                    </div>

                    {!isCurrentUser && (
                      <div className="flex gap-3">
                        <button
                          onClick={handleSendMessage}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
                        >
                          Message
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio and Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-6">
                {/* Left Column - Bio */}
                <div className="lg:col-span-2">
                  <h2
                    className={`text-xl font-semibold mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    About
                  </h2>
                  {safeBio ? (
                    <p
                      className={`leading-relaxed ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {safeBio}
                    </p>
                  ) : (
                    <p
                      className={`italic ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      No bio provided yet.
                    </p>
                  )}

                  {/* Additional Info */}
                  <div className="mt-6 space-y-3">
                    {safeLocation && (
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span
                          className={isDark ? "text-gray-300" : "text-gray-600"}
                        >
                          {safeLocation}
                        </span>
                      </div>
                    )}

                    {safeWebsite && (
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                        <a
                          href={safeWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`hover:underline ${
                            isDark ? "text-blue-400" : "text-blue-600"
                          }`}
                        >
                          {safeWebsite.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}

                    {safeJoinedDate && (
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span
                          className={isDark ? "text-gray-300" : "text-gray-600"}
                        >
                          Joined {new Date(safeJoinedDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Additional Info */}
                <div className="space-y-6">
                  <div>
                    <h3
                      className={`font-semibold mb-3 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Contact Information
                    </h3>
                    <div className="space-y-2">
                      {safePhone && (
                        <div>
                          <div
                            className={`text-sm font-medium ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Phone
                          </div>
                          <div
                            className={
                              isDark ? "text-gray-300" : "text-gray-600"
                            }
                          >
                            {safePhone}
                          </div>
                        </div>
                      )}
                      <div>
                        <div
                          className={`text-sm font-medium ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Email
                        </div>
                        <div
                          className={isDark ? "text-gray-300" : "text-gray-600"}
                        >
                          {safeEmail}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3
                      className={`font-semibold mb-3 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Status
                    </h3>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          enhancedUserProfile.isOnline
                            ? "bg-green-500 animate-pulse"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      <span
                        className={isDark ? "text-gray-300" : "text-gray-600"}
                      >
                        {enhancedUserProfile.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                    {safeLastSeen && !enhancedUserProfile.isOnline && (
                      <div
                        className={`text-sm mt-1 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Last seen {new Date(safeLastSeen).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Common Channels Section - Only show for other users */}
              {!isCurrentUser && (
                <div className="px-0 pb-0 border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                  <h2
                    className={`text-xl font-semibold mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Common Channels
                  </h2>
                  {renderCommonChannels()}
                </div>
              )}

              {/* Shared Media Section - Only show for other users */}
              {!isCurrentUser && (
                <div className="px-0 pb-0 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h2
                    className={`text-xl font-semibold mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Shared Media
                  </h2>

                  {sharedMediaLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                        Loading shared media...
                      </p>
                    </div>
                  ) : sharedMedia && sharedMedia.length > 0 ? (
                    <div className="space-y-6">
                      {renderMediaSection(
                        "Photos",
                        groupedMedia.images,
                        "🖼️",
                        "image"
                      )}
                      {renderMediaSection(
                        "Videos",
                        groupedMedia.videos,
                        "🎬",
                        "video"
                      )}
                      {renderMediaSection(
                        "Files",
                        groupedMedia.files,
                        "📎",
                        "file"
                      )}
                      {renderMediaSection(
                        "Audio",
                        groupedMedia.audio,
                        "🎵",
                        "audio"
                      )}

                      <div
                        className={`text-center pt-4 border-t ${
                          isDark ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <p
                          className={isDark ? "text-gray-400" : "text-gray-500"}
                        >
                          Total {sharedMedia.length} shared items
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📁</div>
                      <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                        No shared media yet
                      </p>
                      <p
                        className={`text-sm mt-2 ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        Start a conversation to share photos, videos, and files
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Media Viewer Modal */}
      {mediaViewerOpen && selectedMedia && isFileMessage(selectedMedia) && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setMediaViewerOpen(false)}
              className="absolute top-4 right-4 text-white text-2xl z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
            >
              ✕
            </button>

            {selectedMedia.messageType === "image" && (
              <img
                src={selectedMedia.fileUrl}
                alt="Shared media"
                className="max-w-full max-h-full object-contain"
              />
            )}

            {selectedMedia.messageType === "video" && (
              <video controls autoPlay className="max-w-full max-h-full">
                <source src={selectedMedia.fileUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}

            {(selectedMedia.messageType === "file" ||
              selectedMedia.messageType === "audio") && (
              <div
                className={`p-8 rounded-lg max-w-md ${
                  isDark ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={
                        selectedMedia.messageType === "file"
                          ? "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          : "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                      }
                    />
                  </svg>
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {selectedMedia.fileName || "File"}
                  </h3>
                  {selectedMedia.fileSize && (
                    <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                      {(selectedMedia.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                  <button
                    onClick={() => handleDownloadMedia(selectedMedia)}
                    className={`mt-4 px-6 py-2 rounded-lg font-medium ${
                      isDark
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    } cursor-pointer`}
                  >
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
