import React from 'react';
import type { Chat } from '../types';

type SelectedChatContextType = {
    selectedChat: Chat | null;
    setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
};

export const SelectedChatContext = React.createContext<SelectedChatContextType | null>(null);

export const SelectedChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedChat, setSelectedChat] = React.useState<Chat | null>(() => {
        const storedChat = localStorage.getItem('selectedChat');
        return storedChat ? JSON.parse(storedChat) : null;
    });

    React.useEffect(() => {
        if (selectedChat) {
            localStorage.setItem('selectedChat', JSON.stringify(selectedChat));
        } else {
            localStorage.removeItem('selectedChat');
        }
    }, [selectedChat]);

    return (
        <SelectedChatContext.Provider value={{ selectedChat, setSelectedChat }}>
            {children}
        </SelectedChatContext.Provider>
    );
};