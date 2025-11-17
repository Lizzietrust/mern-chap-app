import React, { useState } from "react";
import type { ChannelChat, User } from "../../../types/types";
import { MemberItem } from "./MemberItem";
import { AddMemberModal } from "./AddMemberModal";

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

  const isCurrentUser = (memberId: string): boolean => {
    return memberId === channel.createdBy;
  };

  return (
    <div className="space-y-4">
      {isCurrentUserAdmin && (
        <div className="flex justify-between items-center">
          <h3
            className={`text-lg font-medium ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Members ({members?.length || 0})
          </h3>
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

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {members?.map((member) => {
          const isAdmin = isMemberAdmin(member._id);
          const isCurrentUserMember = isCurrentUser(member._id);

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

        {(!members || members.length === 0) && (
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
          isDark={isDark}
          onClose={() => setShowAddMemberModal(false)}
          onAddMember={handleAddMember}
          existingMembers={members || []}
          isAdding={isUpdating}
        />
      )}
    </div>
  );
};
