export interface Organization {
  _id?: string;
  organizationId: string;
  organizationName: string;
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
  gstNumber: string;
  panNumber: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}
