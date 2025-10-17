import React from "react";
import type { CreateChannelModalProps } from "../../types/CreateChannelModal.types";
import { useCreateChannelModal } from "./useCreateChannelModal";
import { Modal } from "../modals/Modal";
import { CreateChannelSteps } from "./CreateChannelSteps";

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isDark,
  onClose,
  onChannelCreated,
}) => {
  const {
    step,
    setStep,
    formData,
    updateFormData,
    toggleMember,
    handleCreateChannel,
    availableUsers,
    isCreating,
  } = useCreateChannelModal(onClose, onChannelCreated);

  return (
    <Modal isDark={isDark} onClose={onClose} title="Create Channel" size="md">
      <CreateChannelSteps
        step={step}
        formData={formData}
        availableUsers={availableUsers}
        isCreating={isCreating}
        onStepChange={setStep}
        onFormDataChange={updateFormData}
        onToggleMember={toggleMember}
        onCreateChannel={handleCreateChannel}
        onClose={onClose}
        isDark={isDark}
      />
    </Modal>
  );
};

export default React.memo(CreateChannelModal);
