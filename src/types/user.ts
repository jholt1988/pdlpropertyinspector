export interface User {
  id: string;
  email: string;
  name: string;
  role: 'property_manager' | 'landlord' | 'tenant' | 'maintenance';
  company?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  emailVerified: boolean;
  provider: 'email' | 'google' | 'microsoft' | 'apple';
}
