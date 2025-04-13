// Update the User interface
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  // Add these properties
  position?: string;
  language?: string;
  company?: string;
}