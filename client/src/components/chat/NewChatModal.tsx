import React, { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';

const NewChatModal = ({ isDark, onClose }) => {
  const [search, setSearch] = useState('');
  const { data: users, isLoading, isError } = useUsers(1, 10, search);

  console.log({ users });
  

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
          {users && users.users.map((user) => (
            <div key={user.id} className={`p-2 rounded-lg mb-2 flex items-center space-x-3 cursor-pointer hover:bg-gray-700`}>
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {user.firstName.charAt(0)}
              </div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user.firstName} {user.lastName}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className={`mt-6 py-2 px-4 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NewChatModal;