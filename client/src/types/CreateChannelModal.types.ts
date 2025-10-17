import type { ChannelChat, User } from "./types";

export interface CreateChannelModalProps {
  isDark: boolean;
  onClose: () => void;
  onChannelCreated: (channel: ChannelChat) => void;
}

export interface ChannelFormData {
  name: string;
  description: string;
  isPrivate: boolean;
  selectedMembers: string[];
}

export interface CreateChannelStepsProps {
  step: "details" | "members";
  formData: ChannelFormData;
  availableUsers: User[];
  isCreating: boolean;
  onStepChange: (step: "details" | "members") => void;
  onFormDataChange: (updates: Partial<ChannelFormData>) => void;
  onToggleMember: (userId: string) => void;
  onCreateChannel: () => void;
  onClose: () => void;
  isDark: boolean;
}

export interface DetailsStepProps {
  formData: ChannelFormData;
  onFormDataChange: (updates: Partial<ChannelFormData>) => void;
  onNext: () => void;
  onClose: () => void;
  isDark: boolean;
}

export interface MembersStepProps {
  formData: ChannelFormData;
  availableUsers: User[];
  selectedMembers: string[];
  isCreating: boolean;
  onBack: () => void;
  onToggleMember: (userId: string) => void;
  onCreateChannel: () => void;
  onClose: () => void;
  isDark: boolean;
}
