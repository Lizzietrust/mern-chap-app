import { PlusIcon } from '@heroicons/react/24/solid'
import React, { useState } from 'react'
import { useMe } from '../../hooks/useAuth'
import { getInitials } from '../../functions'
import NewChatModal from './NewChatModal'

const Sidebar = ({ isDark, selectedChat, users, setSelectedChat, channels }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [activeTab, setActiveTab] = useState<'dms' | 'channels'>('dms')
    const { data: authUser, isLoading, isError } = useMe()
      
  return (
    <>
    <div
          className={`${
            sidebarCollapsed ? 'md:w-16' : 'md:w-80'
          } w-full flex-col border-r transition-all duration-300 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } ${selectedChat ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                    <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Messages
                    </h2>
                    <button
                      onClick={() => setShowModal(true)}
                      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      <PlusIcon className="h-6 w-6" />
                    </button>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer hidden md:block ${
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
          <div className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'hidden md:block' : ''}`}>
            {!sidebarCollapsed && (
              <>
                {activeTab === 'dms' && (
                  <div className="p-2">
                    {selectedChat?.users?.map((user) => (
                      <button
                        key={user?._id}
                        onClick={() => setSelectedChat({ type: 'user', id: user?._id })}
                        className={`w-full p-3 rounded-lg mb-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                          selectedChat?.type === 'user' && selectedChat?._id === user?._id
                            ? isDark ? 'bg-gray-700' : 'bg-gray-100'
                            : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                              {user?.image || user?.firstname?.charAt(0)}
                            </div>
                            {user.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {user?.firstName}
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

          {/* User Profile Section */}
          <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {isLoading && <div className={`${isDark ? 'text-white' : 'text-black'}`}>Loading user...</div>}
            {isError && <div className="text-red-500">Error loading user.</div>}
            {authUser && (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {authUser.user.image ? (
                    <img className="w-10 h-10 rounded-full" src={authUser.user.image} alt="Your avatar" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {getInitials(authUser.user.firstName, authUser.user.lastName)}
                    </div>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {authUser.user.firstName || ''} {authUser.user.lastName || ''}
                    </p>
                    <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {authUser.user.email}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {showModal && <NewChatModal isDark={isDark} onClose={() => setShowModal(false)} setSelectedChat={setSelectedChat} />}
        </>
  )
}

export default Sidebar
