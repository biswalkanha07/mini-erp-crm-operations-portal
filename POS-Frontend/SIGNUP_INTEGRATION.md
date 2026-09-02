# Signup Integration Documentation

## Overview
This document describes the signup functionality that has been integrated into the POS frontend application.

## New Features Added

### 1. Signup API Integration
- Added new signup endpoints to `api.ts`:
  - `organizationSignup`: For organization admin signup
  - `storeSignup`: For store user signup
- Maintained backward compatibility with existing login endpoints

### 2. New Components

#### SignupSelector Component (`src/components/SignupSelector.tsx`)
- Main signup interface that allows users to choose between organization and store signup
- Beautiful UI with gradient buttons and clear account type descriptions
- Integrates with the main authentication flow

#### SignupForm Component (`src/components/SignupForm.tsx`)
- Reusable form component for both organization and store signup
- Features:
  - Dynamic organization/store selection dropdown
  - Email and password validation
  - Password confirmation
  - Real-time form validation
  - Success/error messaging
  - Auto-redirect to login after successful signup

### 3. Updated LoginSelector Component
- Added "Sign up here" link to the login form
- Integrated signup flow with existing login functionality
- Enhanced login to support both unified and legacy login endpoints

## User Flow

### Organization Signup Flow
1. User clicks "Sign up here" on login page
2. User selects "Organization Admin" option
3. User selects an organization from dropdown
4. User enters email and password
5. System creates organization admin account
6. User is redirected to login page with success message

### Store Signup Flow
1. User clicks "Sign up here" on login page
2. User selects "Store User" option
3. User selects a store from dropdown
4. User enters email and password
5. System creates store user account
6. User is redirected to login page with success message

## API Endpoints Used

### Signup Endpoints
- `POST /auth/organization/signup`
  - Body: `{ organizationId: string, email: string, password: string }`
- `POST /auth/store/signup`
  - Body: `{ storeId: string, email: string, password: string }`

### Data Loading Endpoints
- `GET /organizations` - Loads available organizations for signup
- `GET /stores` - Loads available stores for signup

## Form Validation

### Client-side Validation
- All fields are required
- Password must be at least 6 characters
- Password confirmation must match
- Organization/Store must be selected
- Email format validation

### Server-side Validation
- Email uniqueness check
- Organization/Store existence validation
- Password hashing with bcrypt

## Security Features
- Passwords are hashed on the server side
- JWT tokens are generated upon successful signup
- Form validation prevents malicious input
- CSRF protection through proper API design

## UI/UX Features
- Responsive design that works on all screen sizes
- Beautiful gradient backgrounds and modern styling
- Clear visual feedback for form states
- Loading states during API calls
- Success and error messaging
- Smooth transitions between login and signup flows

## Integration with Existing System
- Seamlessly integrates with existing authentication flow
- Maintains backward compatibility with legacy login endpoints
- Uses existing API infrastructure
- Follows established UI/UX patterns
- Preserves existing user session management

## Testing
To test the signup functionality:

1. Start the backend server with the provided auth routes
2. Start the frontend application
3. Click "Sign up here" on the login page
4. Select either organization or store signup
5. Fill out the form with valid data
6. Verify successful account creation and redirect to login

## Future Enhancements
- Email verification for new accounts
- Password strength indicator
- Account activation workflow
- Bulk user import functionality
- Advanced user role management
