
import React, 'react';
import { Chat } from '../types';

type SelectedChatContextType = {
    selectedChat: Chat | null;
    setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
};

export const SelectedChatContext = React.createContext<SelectedChatContextType | null>(null);

export const SelectedChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedChat, setSelectedChat] = React.useState<Chat | null>(null);

    return (
        <SelectedChatContext.Provider value={{ selectedChat, setSelectedChat }}>
            {children}
        </SelectedChatContext.Provider>
    );
};
