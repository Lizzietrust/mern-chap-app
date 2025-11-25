import React, { useState } from "react";
import type { ChannelChat, User } from "../../../types/types";
import { MemberItem } from "./MemberItem";
import { AddMemberModal } from "./AddMemberModal";
import { useApp } from "../../../contexts/appcontext/index";

interface MembersTabProps {
  members: User[];
  channel: ChannelChat;
  isCurrentUserAdmin: boolean;
  onRemoveMember: (memberId: string) => void;
  onToggleAdmin: (memberId: string, isAdmin: boolean) => void;
  onAddMember: (userId: string) => Promise<void>;
  isUpdating: boolean;
  isDark: boolean;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  channel,
  isCurrentUserAdmin,
  onRemoveMember,
  onToggleAdmin,
  onAddMember,
  isUpdating,
  isDark,
}) => {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const { state } = useApp();

  const handleAddMember = async (userId: string) => {
    await onAddMember(userId);
    setShowAddMemberModal(false);
  };

  const isMemberAdmin = (memberId: string): boolean => {
    return channel.admins.some((admin) => {
      if (typeof admin === "string") {
        return admin === memberId;
      } else {
        return admin._id === memberId;
      }
    });
  };

  const enhancedMembers = members?.map((member) => {
    const onlineUser = state.onlineUsers?.find(
      (user) => user._id === member._id
    );

    const isCurrentUser = state.user?._id === member._id;

    const lastSeen = onlineUser?.lastSeen || member.lastSeen;
    const lastSeenString =
      lastSeen instanceof Date ? lastSeen.toISOString() : lastSeen;

    return {
      ...member,
      isOnline: isCurrentUser
        ? true
        : onlineUser?.isOnline || member.isOnline || false,
      lastSeen: lastSeenString,
    };
  });

  const onlineMembersCount =
    enhancedMembers?.filter((member) => member.isOnline).length || 0;

  const totalMembersCount = enhancedMembers?.length || 0;

  return (
    <div className="space-y-4">
      {isCurrentUserAdmin && (
        <div className="flex justify-between items-center">
          <div>
            <h3
              className={`text-lg font-medium ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Members ({totalMembersCount})
            </h3>
            {totalMembersCount > 0 && (
              <p
                className={`text-sm ${
                  isDark ? "text-green-400" : "text-green-600"
                }`}
              >
                {onlineMembersCount} online
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAddMemberModal(true)}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Add Member
          </button>
        </div>
      )}

      {/* Show online count for non-admin users as well */}
      {!isCurrentUserAdmin && (
        <div className="flex justify-between items-center">
          <h3
            className={`text-lg font-medium ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Members ({totalMembersCount})
          </h3>
          {totalMembersCount > 0 && (
            <span
              className={`text-sm px-3 py-1 rounded-full ${
                isDark
                  ? "bg-green-900/30 text-green-400"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {onlineMembersCount} online
            </span>
          )}
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {enhancedMembers?.map((member) => {
          const isAdmin = isMemberAdmin(member._id);
          const isCurrentUserMember = state.user?._id === member._id;

          return (
            <MemberItem
              key={member._id}
              member={member}
              isAdmin={isAdmin}
              isCurrentUser={isCurrentUserMember}
              isCurrentUserAdmin={isCurrentUserAdmin}
              onToggleAdmin={onToggleAdmin}
              onRemoveMember={onRemoveMember}
              isDark={isDark}
            />
          );
        })}

        {(!enhancedMembers || enhancedMembers.length === 0) && (
          <div
            className={`text-center py-8 rounded-lg ${
              isDark ? "bg-gray-700 text-gray-400" : "bg-gray-50 text-gray-500"
            }`}
          >
            No members found
          </div>
        )}
      </div>

      {showAddMemberModal && (
        <AddMemberModal
          isOpen={showAddMemberModal}
          isDark={isDark}
          onClose={() => setShowAddMemberModal(false)}
          onAddMember={handleAddMember}
          existingMembers={enhancedMembers || []}
          isAdding={isUpdating}
        />
      )}
    </div>
  );
};
