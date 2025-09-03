# Profile Editing System Setup

This document describes the comprehensive profile editing system that has been implemented for the MERN chat application.

## Overview

The profile editing system allows users to:
- Edit basic profile information (first name, last name, bio, phone, location, website)
- Upload and change profile images
- Complete profile setup during first-time use
- View and edit profile information in a user-friendly interface

## Server-Side Implementation

### 1. Enhanced User Model (`server/models/UserModel.js`)

The User model now includes additional profile fields:

```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  image: { type: String, required: false },
  bio: { type: String, required: false, maxlength: 500 },
  phone: { type: String, required: false },
  location: { type: String, required: false },
  website: { type: String, required: false },
  profileSetup: { type: Boolean, default: false },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});
```

### 2. Enhanced Auth Controller (`server/controllers/AuthController.js`)

#### `updateProfile` Function
- **Endpoint**: `PUT /api/auth/update-profile`
- **Authentication**: Required (JWT token)
- **Functionality**: Updates user profile fields
- **Validation**: At least one field must be provided
- **Response**: Returns updated user data

#### `getUserInfo` Function
- **Endpoint**: `GET /api/auth/user-info`
- **Authentication**: Required (JWT token)
- **Functionality**: Retrieves complete user profile information
- **Response**: Returns all user profile fields

### 3. API Routes (`server/routes/AuthRoutes.js`)

```javascript
authRoutes.put("/update-profile", verifyToken, updateProfile);
authRoutes.get("/user-info", verifyToken, getUserInfo);
```

## Client-Side Implementation

### 1. Enhanced API Client (`client/src/lib/api.ts`)

The `authApi.updateProfile` function now accepts all profile fields:

```typescript
updateProfile: (data: { 
  firstName?: string; 
  lastName?: string; 
  image?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
}) => apiClient.put<AuthResponse>("/api/auth/update-profile", data)
```

### 2. Enhanced User Interface (`client/src/pages/ProfilePage.tsx`)

#### Profile Setup Form (First-time users)
- First Name and Last Name fields
- Profile image upload
- Bio textarea
- Phone number input
- Location input
- Website URL input
- Theme and accent color selection

#### Profile Editing Form (Existing users)
- Full name editing
- Bio editing
- Phone number editing
- Location editing
- Website editing
- Profile image management
- Real-time validation

#### Profile Display
- Profile header with avatar and basic info
- Contact information display (phone, location, website)
- Bio text display
- Member since information

### 3. Enhanced App Context (`client/src/contexts/AppContext.tsx`)

The User interface now includes all profile fields:

```typescript
export interface User {
  id: number
  name: string
  email: string
  profileSetup: boolean
  avatar?: string
  bio?: string
  phone?: string
  location?: string
  website?: string
}
```

### 4. Enhanced Authentication Pages

Both `LoginPage.tsx` and `RegisterPage.tsx` now properly handle the new profile fields when creating user objects.

## API Endpoints

### Update Profile
- **Method**: `PUT`
- **URL**: `/api/auth/update-profile`
- **Headers**: 
  - `Content-Type: application/json`
  - `Cookie: jwt=<token>` (authentication)
- **Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Software developer",
    "phone": "+1-555-123-4567",
    "location": "New York, USA",
    "website": "https://johndoe.com"
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "_id": "user_id",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "image": "image_url",
      "bio": "Software developer",
      "phone": "+1-555-123-4567",
      "location": "New York, USA",
      "website": "https://johndoe.com",
      "profileSetup": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

### Get User Info
- **Method**: `GET`
- **URL**: `/api/auth/user-info`
- **Headers**: 
  - `Cookie: jwt=<token>` (authentication)
- **Response**: Same as above

## Features

### 1. Form Validation
- Required field validation
- URL format validation for website
- Bio character limit (500 characters)
- Real-time error display

### 2. User Experience
- Responsive design for mobile and desktop
- Dark/light theme support
- Loading states during API calls
- Success/error notifications
- Unsaved changes detection

### 3. Security
- JWT token authentication required
- Input sanitization
- Secure cookie handling
- CORS configuration

## Usage Examples

### Updating Profile Information

```typescript
import { authApi } from '../lib/api';

const updateUserProfile = async () => {
  try {
    const response = await authApi.updateProfile({
      firstName: "John",
      lastName: "Doe",
      bio: "Software developer passionate about building great applications",
      phone: "+1-555-123-4567",
      location: "San Francisco, CA",
      website: "https://johndoe.dev"
    });
    
    console.log('Profile updated:', response.user);
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
};
```

### Getting User Information

```typescript
import { authApi } from '../lib/api';

const getUserProfile = async () => {
  try {
    const response = await authApi.me();
    console.log('User profile:', response.user);
  } catch (error) {
    console.error('Failed to get user profile:', error);
  }
};
```

## Testing

To test the profile editing functionality:

1. **Start the server**: `cd server && npm start`
2. **Start the client**: `cd client && npm run dev`
3. **Register/Login** to create a user account
4. **Navigate to Profile page** to see the profile setup or editing interface
5. **Test form validation** by entering invalid data
6. **Test profile updates** by editing and saving information
7. **Verify data persistence** by refreshing the page

## Future Enhancements

Potential improvements for the profile system:

1. **Image upload to cloud storage** (AWS S3, Cloudinary)
2. **Profile privacy settings** (public/private fields)
3. **Profile verification badges**
4. **Social media links integration**
5. **Profile analytics and insights**
6. **Bulk profile import/export**
7. **Profile templates for different user types**

## Troubleshooting

### Common Issues

1. **Profile not updating**: Check JWT token validity and API endpoint
2. **Image not displaying**: Verify image URL format and accessibility
3. **Validation errors**: Check input format and character limits
4. **Authentication errors**: Ensure proper cookie handling and CORS setup

### Debug Steps

1. Check browser console for client-side errors
2. Check server console for API errors
3. Verify database connection and schema
4. Test API endpoints with Postman or similar tools
5. Check environment variables configuration
