import { useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../contexts/appcontext/index";
import { useTheme } from "../contexts/theme";
import { Layout } from "../components/Layout";
import {
  useUpdateUserProfileCache,
  useUserProfile,
} from "../hooks/users/useUserProfile";
import type { User } from "../types/types";

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { state } = useApp();
  const socket = state.socket;
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

  const isCurrentUser = useMemo(() => {
    return userId === state.user?._id;
  }, [userId, state.user]);

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

    socket.on("profile_updated", handleProfileUpdate);

    return () => {
      console.log("🧹 Cleaning up profile_updated listener for user:", userId);
      socket.off("profile_updated", handleProfileUpdate);
    };
  }, [socket, userId, updateUserProfileCache, refetch]);

  useEffect(() => {
    console.log("🔄 UserProfile data changed:", userProfile);
  }, [userProfile]);

  const handleRefresh = () => {
    refetch();
  };

  // const handleFollowToggle = async () => {
  //   // Implement follow/unfollow logic here
  //   setIsFollowing(!isFollowing);
  //   // You would call your follow/unfollow API here
  // };

  const handleSendMessage = () => {
    if (userProfile) {
      navigate(`/chat?userId=${userProfile._id}`);
    }
  };

  const handleBackToChat = () => {
    navigate(-1);
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

  if (error || !userProfile) {
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
              {/* {userProfile.coverPhoto && (
                <img
                  src={userProfile.coverPhoto}
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
                    src={
                      userProfile.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        userProfile.name || userProfile.email
                      )}`
                    }
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover"
                  />
                  {userProfile.isOnline && (
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
                        {userProfile.name}
                      </h1>
                      <p
                        className={`text-lg ${
                          isDark ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {userProfile.email}
                      </p>
                    </div>

                    {!isCurrentUser && (
                      <div className="flex gap-3">
                        {/* <button
                          onClick={handleFollowToggle}
                          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            isFollowing
                              ? "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          } cursor-pointer`}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </button> */}
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

              {/* Stats */}
              {/* <div
                className={`grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y ${
                  isDark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {userProfile.followers?.length || 0}
                  </div>
                  <div
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Followers
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {userProfile.following?.length || 0}
                  </div>
                  <div
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Following
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {userProfile.postsCount || 0}
                  </div>
                  <div
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Posts
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {userProfile.groupsCount || 0}
                  </div>
                  <div
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Groups
                  </div>
                </div>
              </div> */}

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
                  {userProfile.bio ? (
                    <p
                      className={`leading-relaxed ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {userProfile.bio}
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
                    {userProfile.location && (
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
                          {userProfile.location}
                        </span>
                      </div>
                    )}

                    {userProfile.website && (
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
                          href={userProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`hover:underline ${
                            isDark ? "text-blue-400" : "text-blue-600"
                          }`}
                        >
                          {userProfile.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}

                    {userProfile.joinedDate && (
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
                          Joined{" "}
                          {new Date(
                            userProfile.joinedDate
                          ).toLocaleDateString()}
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
                      {userProfile.phone && (
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
                            {userProfile.phone}
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
                          {userProfile.email}
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
                          userProfile.isOnline
                            ? "bg-green-500 animate-pulse"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      <span
                        className={isDark ? "text-gray-300" : "text-gray-600"}
                      >
                        {userProfile.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                    {userProfile.lastSeen && !userProfile.isOnline && (
                      <div
                        className={`text-sm mt-1 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Last seen{" "}
                        {new Date(userProfile.lastSeen).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
