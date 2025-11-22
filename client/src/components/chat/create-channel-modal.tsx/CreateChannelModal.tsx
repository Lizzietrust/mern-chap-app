import React from "react";
import type { CreateChannelModalProps } from "../../../types/CreateChannelModal.types";
import { useCreateChannelModal } from "./useCreateChannelModal";
import { Modal } from "../../modals/Modal";
import { CreateChannelSteps } from "./CreateChannelSteps";
export { UserItem } from "../../shared/user-item/UserItem";

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
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
    <Modal isOpen={isOpen} isDark={isDark} onClose={onClose} title="Create Channel" size="md">
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
