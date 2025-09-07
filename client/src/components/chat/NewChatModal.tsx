import React, { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useDebounce } from '../../hooks/useDebounce';
import { useCreateChat } from '../../hooks/useChat';

const NewChatModal = ({ isDark, onClose, setSelectedChat, selectedChat }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);
  const { data: users, isLoading, isError } = useUsers(page, 10, debouncedSearch);
  const createChatMutation = useCreateChat();

  const handleUserClick = async (user) => {
    try {
      await createChatMutation.mutateAsync(user._id);
      setSelectedChat({ type: 'user', ...user });
      onClose();
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const handleClearSelection = () => {
    setSelectedChat(null);
  };

  const handleNext = () => {
    if (users && users.hasNextPage) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const handlePrevious = () => {
    setPage(prevPage => Math.max(prevPage - 1, 1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 w-full max-w-md`}>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Create New Chat</h2>

        <input
          type="text"
          placeholder="Search for users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full p-2 mb-4 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
        />

        {isLoading && <p className={`${isDark ? 'text-white' : 'text-black'}`}>Loading users...</p>}
        {isError && <p className="text-red-500">Error loading users.</p>}

        <div className="max-h-60 overflow-y-auto">
          {users && users?.users.map((user) => (
            <div key={user?._id} className={`p-2 rounded-lg mb-2 flex items-center space-x-3 cursor-pointer hover:bg-gray-700`} onClick={() => handleUserClick(user)}>
              {user?.image ? (<img src={user?.image} alt={user?.firstName || user?.email} className='w-10 h-10 rounded-full' />) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.charAt(0)}
                </div>
              )}
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user?.firstName} {user?.lastName}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={handlePrevious}
            disabled={page === 1}
            className={`py-2 px-4 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} disabled:opacity-50`}
          >
            Previous
          </button>
          <span className={`${isDark ? 'text-white' : 'text-black'}`}>Page {page}</span>
          <button
            onClick={handleNext}
            disabled={!users?.hasNextPage}
            className={`py-2 px-4 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} disabled:opacity-50`}
          >
            Next
          </button>
        </div>

        {selectedChat && (
          <button
            onClick={handleClearSelection}
            className={`mt-4 w-full py-2 px-4 rounded-lg bg-red-500 text-white`}
          >
            Clear Selection
          </button>
        )}

        <button
          onClick={onClose}
          className={`mt-6 w-full py-2 px-4 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NewChatModal;
