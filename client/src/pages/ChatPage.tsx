import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useTheme } from '../contexts/ThemeContext'
import { Layout } from '../components/Layout'
import { useMe } from '../hooks/useAuth'
import Sidebar from '../components/chat/Sidebar'
import ChatContainer from '../components/chat/ChatContainer'

interface Message {
  id: string
  text: string
  sender: 'user' | 'other'
  timestamp: Date
  isTyping?: boolean
}

interface User {
  id: string
  name: string
  avatar?: string
  isOnline: boolean
  lastMessage?: string
  unreadCount?: number
  lastSeen?: Date
}

interface Channel {
  id: string
  name: string
  description?: string
  memberCount: number
  unreadCount?: number
  isPrivate?: boolean
}

export function ChatPage() {
  const { state } = useApp()
  const { success } = useNotifications()
  const { isDark } = useTheme()

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [selectedChat, setSelectedChat] = useState<{ type: 'user' | 'channel', id: string } | null>(null)

  // Mock data
  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      avatar: '👩‍💻',
      isOnline: true,
      lastMessage: 'Hey, how are you doing?',
      unreadCount: 2,
    },
    {
      id: '2',
      name: 'Bob Smith',
      avatar: '👨‍🎨',
      isOnline: false,
      lastMessage: 'Thanks for your help earlier!',
      lastSeen: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      name: 'Carol Davis',
      avatar: '👩‍🔬',
      isOnline: true,
      lastMessage: "Let's schedule that meeting",
      unreadCount: 1,
    },
  ])

  const [channels] = useState<Channel[]>([
    {
      id: 'general',
      name: 'general',
      description: 'General discussion',
      memberCount: 156,
      unreadCount: 5,
    },
    {
      id: 'random',
      name: 'random',
      description: 'Random conversations',
      memberCount: 89,
    },
    {
      id: 'dev-team',
      name: 'dev-team',
      description: 'Development discussions',
      memberCount: 12,
      isPrivate: true,
      unreadCount: 3,
    },
  ])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! Welcome to the chat. How can I help you today?',
      sender: 'other',
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: '2',
      text: 'Hi! Thanks for the welcome message.',
      sender: 'user',
      timestamp: new Date(Date.now() - 30000),
    },
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileMessage: Message = {
      id: Date.now().toString(),
      text: `File selected: ${file.name}`,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, fileMessage])
    success(`You selected ${file.name}`)
    if (e.target) {
      e.target.value = ''
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  useEffect(() => {
    if (selectedChat) {
      const welcomeText = selectedChat.type === 'user' 
        ? `You are now chatting with ${getChatTitle()}.`
        : `You have joined the #${getChatTitle()} channel.`
      
      setMessages([
        {
          id: 'welcome',
          text: welcomeText,
          sender: 'other',
          timestamp: new Date()
        }
      ])
    }
  }, [selectedChat])


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')

    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Thanks for your message: "${newMessage}". This is a demo response.`,
        sender: 'other',
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, botMessage])
    }, 1500)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getChatTitle = () => {
    if (!selectedChat) return 'Select a chat'
    
    if (selectedChat.type === 'user') {
      const user = users.find(u => u.id === selectedChat.id)
      return user?.name || 'Unknown User'
    } else {
      const channel = channels.find(c => c.id === selectedChat.id)
      return channel?.name || 'unknown'
    }
  }

  const getChatSubtitle = () => {
    if (!selectedChat) return ''
    
    if (selectedChat.type === 'user') {
      const user = users.find(u => u.id === selectedChat.id)
      if (user?.isOnline) return 'Online'
      if (user?.lastSeen) return `Last seen ${formatTime(user.lastSeen)}`
      return 'Offline'
    } else {
      const channel = channels.find(c => c.id === selectedChat.id)
      return `${channel?.memberCount || 0} members`
    }
  }

  if (!state.user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Please log in to access the chat
          </h2>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className={`h-screen flex overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Sidebar */}
        <Sidebar isDark={isDark} selectedChat={selectedChat} users={users} setSelectedChat={setSelectedChat} channels={channels} />

        {/* Main Chat Area */}
        <ChatContainer selectedChat={selectedChat} isDark={isDark} setSelectedChat={setSelectedChat} getChatTitle={getChatTitle} getChatSubtitle={getChatSubtitle} messages={messages} formatTime={formatTime} isTyping={isTyping} messagesEndRef={messagesEndRef} handleSendMessage={handleSendMessage} handleFileSelect={handleFileSelect} newMessage={newMessage} setNewMessage={setNewMessage}  />
      </div>
    </Layout>
  )
}
