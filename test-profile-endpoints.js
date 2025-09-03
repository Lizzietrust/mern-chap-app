// Test script for profile endpoints
// Run this with: node test-profile-endpoints.js

const API_BASE_URL = 'http://localhost:5000/api/auth';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123'
};

const testProfileUpdate = {
  firstName: 'John',
  lastName: 'Doe',
  bio: 'Software developer passionate about building great applications',
  phone: '+1-555-123-4567',
  location: 'San Francisco, CA',
  website: 'https://johndoe.dev'
};

let authToken = '';

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include',
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 'ERROR', data: { error: error.message } };
  }
}

// Test functions
async function testRegister() {
  console.log('\n🔐 Testing User Registration...');
  const result = await makeRequest(`${API_BASE_URL}/register`, {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 201) {
    console.log('✅ Registration successful');
  } else {
    console.log('❌ Registration failed');
  }
  
  return result;
}

async function testLogin() {
  console.log('\n🔑 Testing User Login...');
  const result = await makeRequest(`${API_BASE_URL}/login`, {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 200) {
    console.log('✅ Login successful');
    // Extract token from cookies if needed
    authToken = result.data.user._id;
  } else {
    console.log('❌ Login failed');
  }
  
  return result;
}

async function testGetUserInfo() {
  console.log('\n👤 Testing Get User Info...');
  const result = await makeRequest(`${API_BASE_URL}/user-info`);
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 200) {
    console.log('✅ Get user info successful');
  } else {
    console.log('❌ Get user info failed');
  }
  
  return result;
}

async function testUpdateProfile() {
  console.log('\n✏️ Testing Profile Update...');
  const result = await makeRequest(`${API_BASE_URL}/update-profile`, {
    method: 'PUT',
    body: JSON.stringify(testProfileUpdate)
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 200) {
    console.log('✅ Profile update successful');
  } else {
    console.log('❌ Profile update failed');
  }
  
  return result;
}

async function testGetUserInfoAfterUpdate() {
  console.log('\n👤 Testing Get User Info After Update...');
  const result = await makeRequest(`${API_BASE_URL}/user-info`);
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 200) {
    console.log('✅ Get user info after update successful');
    
    // Verify the updated fields
    const user = result.data.user;
    if (user.firstName === testProfileUpdate.firstName &&
        user.lastName === testProfileUpdate.lastName &&
        user.bio === testProfileUpdate.bio &&
        user.phone === testProfileUpdate.phone &&
        user.location === testProfileUpdate.location &&
        user.website === testProfileUpdate.website) {
      console.log('✅ All profile fields updated correctly');
    } else {
      console.log('❌ Some profile fields not updated correctly');
    }
  } else {
    console.log('❌ Get user info after update failed');
  }
  
  return result;
}

async function testLogout() {
  console.log('\n🚪 Testing User Logout...');
  const result = await makeRequest(`${API_BASE_URL}/logout`, {
    method: 'POST'
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 200) {
    console.log('✅ Logout successful');
  } else {
    console.log('❌ Logout failed');
  }
  
  return result;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Profile Endpoint Tests...');
  console.log('API Base URL:', API_BASE_URL);
  
  try {
    // Test registration
    await testRegister();
    
    // Test login
    await testLogin();
    
    // Test getting user info
    await testGetUserInfo();
    
    // Test profile update
    await testUpdateProfile();
    
    // Test getting user info after update
    await testGetUserInfoAfterUpdate();
    
    // Test logout
    await testLogout();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testRegister,
  testLogin,
  testGetUserInfo,
  testUpdateProfile,
  testGetUserInfoAfterUpdate,
  testLogout
};
