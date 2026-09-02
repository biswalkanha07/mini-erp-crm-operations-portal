export interface Store {
  _id?: string;
  storeId?: string; // Optional since it's auto-generated
  storeName: string;
  storeLocation: string;
  latitude?: number | null;
  longitude?: number | null;
  // New structured address
  address?: {
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  contactPersonName: string;
  contactNumber: string;
  email: string;
  storePicture?: string | null;
  status: 'active' | 'inactive';
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
  discountRate?: number;
  theme?: 'light' | 'dark';
  // Bank details
  bankDetails?: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    upiId?: string;
  };
}

// New interface for the enhanced store creation response
export interface StoreCreationResponse {
  success: boolean;
  message: string;
  store: {
    storeId: string;
    storeName: string;
    storeLocation: string;
    contactPersonName: string;
    email: string;
    status: string;
  };
  user: {
    userId: string;
    name: string;
    email: string;
    status: string;
    role: string;
  };
  signupLink: string;
  emailSent: boolean;
}
