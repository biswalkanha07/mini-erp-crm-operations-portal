# Signup Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Login Page                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Email: [________________]                              │   │
│  │  Password: [____________]                               │   │
│  │  [Sign In] [Sign up here] ←                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Signup Selector                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Choose Account Type:                                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐              │   │
│  │  │ Organization    │  │ Store User      │              │   │
│  │  │ Admin           │  │                 │              │   │
│  │  │ 🏢              │  │ 🏪              │              │   │
│  │  └─────────────────┘  └─────────────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Signup Form                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Select Organization/Store: [Dropdown ▼]                │   │
│  │  Email: [________________]                              │   │
│  │  Password: [____________]                               │   │
│  │  Confirm Password: [____]                               │   │
│  │  [Create Account]                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Call                                     │
│  POST /auth/organization/signup                                 │
│  POST /auth/store/signup                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Body: {                                                │   │
│  │    organizationId/storeId: "id",                        │   │
│  │    email: "user@example.com",                           │   │
│  │    password: "hashed_password"                          │   │
│  │  }                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Success Response                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Status: 201 Created                                    │   │
│  │  Body: {                                                │   │
│  │    status: "success",                                   │   │
│  │    message: "Signup successful",                        │   │
│  │    data: {                                              │   │
│  │      user: { id, name, email, userType, role },         │   │
│  │      token: "jwt_token"                                 │   │
│  │    }                                                    │   │
│  │  }                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Success Message                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✅ Organization/Store signup successful!               │   │
│  │     You can now login.                                  │   │
│  │                                                         │   │
│  │  [Auto-redirect to login in 3 seconds...]              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Back to Login                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  User can now login with their new credentials          │   │
│  │  and access the POS system                              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features of the Flow:

1. **Seamless Integration**: Signup is accessible directly from the login page
2. **Type Selection**: Users can choose between Organization Admin and Store User accounts
3. **Dynamic Data Loading**: Organizations and stores are loaded from the API
4. **Form Validation**: Client-side validation ensures data quality
5. **API Integration**: Uses the new signup endpoints from your backend
6. **Success Handling**: Clear feedback and automatic redirect to login
7. **Error Handling**: Comprehensive error messages for various failure scenarios

## User Experience:
- **Intuitive**: Clear visual hierarchy and familiar form patterns
- **Responsive**: Works on all device sizes
- **Fast**: Optimized API calls and smooth transitions
- **Secure**: Proper validation and error handling
- **Accessible**: Clear labels and keyboard navigation support
