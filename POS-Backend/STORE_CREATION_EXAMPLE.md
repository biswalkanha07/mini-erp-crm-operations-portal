# Store Creation Enhancement - Usage Example

## Overview
The `createStore` endpoint has been enhanced with the following features:
1. Auto-generation of unique storeId (STORE0001, STORE0002, etc.)
2. Automatic creation of a pending user account
3. Email notification with signup link

## API Endpoint
```
POST /api/stores
```

## Request Body
```json
{
  "storeName": "Suguna Chicken Store - Downtown",
  "storeLocation": "Downtown Mall",
  "storeAddress": "123 Main Street, Downtown, City 12345",
  "contactPersonName": "John Smith",
  "contactNumber": "9876543210",
  "email": "john.smith@sugunachicken.com",
  "storePicture": "https://example.com/store-image.jpg",
  "organizationId": "ORG001"
}
```

## Response
```json
{
  "success": true,
  "message": "Store created successfully. Signup email sent to store contact.",
  "store": {
    "storeId": "STORE0001",
    "storeName": "Suguna Chicken Store - Downtown",
    "storeLocation": "Downtown Mall",
    "contactPersonName": "John Smith",
    "email": "john.smith@sugunachicken.com",
    "status": "active"
  },
  "user": {
    "userId": "USER_STORE0001_1703123456789",
    "name": "John Smith",
    "email": "john.smith@sugunachicken.com",
    "status": "pending",
    "role": "manager"
  },
  "signupLink": "http://localhost:3000/signup?storeId=STORE0001",
  "emailSent": true
}
```

## Environment Variables Required
```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL for signup links
FRONTEND_URL=http://localhost:3000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/pos_backend
```

## Features

### 1. Auto-generated StoreId
- Format: `STORE` + 4-digit number (e.g., STORE0001, STORE0002)
- Automatically increments from the last created store
- Thread-safe with race condition protection

### 2. Pending User Creation
- Creates a user account with `status: 'pending'`
- User type: `store`
- Role: `manager` (for the contact person)
- Temporary password until signup completion

### 3. Email Notification
- Professional HTML email template
- Contains store information and signup link
- Branded for Suguna Chicken
- Responsive design

### 4. Error Handling
- Comprehensive error handling for all scenarios
- Validation error details
- Duplicate key error handling
- Email failure doesn't break store creation

## Testing

### Run the test script:
```bash
node test_store_creation.js
```

### Manual testing with curl:
```bash
curl -X POST http://localhost:3000/api/stores \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "Test Store",
    "storeLocation": "Test Location",
    "storeAddress": "123 Test Street",
    "contactPersonName": "Test User",
    "contactNumber": "1234567890",
    "email": "test@example.com",
    "organizationId": "ORG001"
  }'
```

## Next Steps for Frontend Integration

1. **Signup Page**: Create a signup page that accepts `storeId` parameter
2. **Password Setup**: Allow users to set their password using the storeId
3. **User Activation**: Update user status from 'pending' to 'active' after password setup
4. **Login Flow**: Implement login for store users

## Database Schema Updates

### Store Model
- No changes required (already supports auto-generated storeId)

### User Model
- Added `'pending'` to status enum values
- Supports store user creation with proper relationships

## Security Considerations

1. **Temporary Passwords**: Users with pending status have temporary passwords
2. **Signup Link Security**: Links are unique per store and should be time-limited
3. **Email Validation**: Ensure email addresses are valid before sending
4. **Rate Limiting**: Consider rate limiting for store creation endpoint
