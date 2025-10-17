import React from "react";
import { DetailsStep } from "./DetailsStep";
import { MembersStep } from "./MembersStep";
import type { CreateChannelStepsProps } from "../../../types/CreateChannelModal.types";

export const CreateChannelSteps: React.FC<CreateChannelStepsProps> = ({
  step,
  formData,
  availableUsers,
  isCreating,
  onStepChange,
  onFormDataChange,
  onToggleMember,
  onCreateChannel,
  onClose,
  isDark,
}) => {
  switch (step) {
    case "details":
      return (
        <DetailsStep
          formData={formData}
          onFormDataChange={onFormDataChange}
          onNext={() => onStepChange("members")}
          onClose={onClose}
          isDark={isDark}
        />
      );
    case "members":
      return (
        <MembersStep
          formData={formData}
          availableUsers={availableUsers}
          selectedMembers={formData.selectedMembers}
          isCreating={isCreating}
          onBack={() => onStepChange("details")}
          onToggleMember={onToggleMember}
          onCreateChannel={onCreateChannel}
          onClose={onClose}
          isDark={isDark}
        />
      );
    default:
      return null;
  }
};
