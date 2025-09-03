import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useTheme } from '../contexts/ThemeContext'
import { Layout } from '../components/Layout'

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
  const { state, logout } = useApp()
  const { success, error } = useNotifications()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [selectedChat, setSelectedChat] = useState<{ type: 'user' | 'channel', id: string } | null>({ type: 'user', id: '1' })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'dms' | 'channels'>('dms')

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
      lastMessage: 'Let\'s schedule that meeting',
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For demonstration, we'll just show a message with the file name.
    // In a real app, you'd upload the file and get a URL.
    const fileMessage: Message = {
      id: Date.now().toString(),
      text: `File selected: ${file.name}`,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, fileMessage])
    success(`You selected ${file.name}`)
    // Reset file input
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

    // Simulate typing indicator
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
      return `#${channel?.name || 'unknown'}`
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
      <div className={`h-screen flex ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border-r flex flex-col`}>
          
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Messages
                </h2>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {sidebarCollapsed ? '→' : '←'}
              </button>
            </div>
            
            {!sidebarCollapsed && (
              <div className="mt-4">
                <div className={`flex p-1 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <button
                    onClick={() => setActiveTab('dms')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                      activeTab === 'dms'
                        ? isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                        : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Direct Messages
                  </button>
                  <button
                    onClick={() => setActiveTab('channels')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                      activeTab === 'channels'
                        ? isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                        : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Channels
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {!sidebarCollapsed && (
              <>
                {activeTab === 'dms' && (
                  <div className="p-2">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedChat({ type: 'user', id: user.id })}
                        className={`w-full p-3 rounded-lg mb-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                          selectedChat?.type === 'user' && selectedChat?.id === user.id
                            ? isDark ? 'bg-gray-700' : 'bg-gray-100'
                            : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                              {user.avatar || user.name.charAt(0)}
                            </div>
                            {user.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {user.name}
                              </p>
                              {user.unreadCount && (
                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                  {user.unreadCount}
                                </span>
                              )}
                            </div>
                            {user.lastMessage && (
                              <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {user.lastMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'channels' && (
                  <div className="p-2">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => setSelectedChat({ type: 'channel', id: channel.id })}
                        className={`w-full p-3 rounded-lg mb-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedChat?.type === 'channel' && selectedChat?.id === channel.id
                            ? isDark ? 'bg-gray-700' : 'bg-gray-100'
                            : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            channel.isPrivate ? 'bg-orange-500' : 'bg-green-500'
                          } text-white font-semibold`}>
                            {channel.isPrivate ? '🔒' : '#'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {channel.name}
                              </p>
                              {channel.unreadCount && (
                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                  {channel.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {channel.memberCount} members
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className={`border-b px-6 py-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {getChatTitle()}
                    </h1>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {getChatSubtitle()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      📞
                    </button>
                    <button className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      🎥
                    </button>
                    <button className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      ⚙️
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : isDark
                          ? 'bg-gray-700 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user'
                          ? 'text-blue-100'
                          : isDark
                          ? 'text-gray-400'
                          : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${
                      isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className={`border-t px-6 py-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <form onSubmit={handleSendMessage}>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden cursor-pointer"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}
                      aria-label="Attach file"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    <div className="flex-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${getChatTitle()}`}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className={`flex-1 flex items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                <p>Choose a chat from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}