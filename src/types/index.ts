export interface Property {
  id: string;
  address: string;
  propertyType: 'apartment' | 'house' | 'condo' | 'commercial';
  units?: string;
  owner: string;
  managedBy: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'dining' | 'utility' | 'other';
  checklistItems: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | null;
  notes: string;
  photos: string[];
  damageEstimate?: number;
  requiresAction: boolean;
}

export interface Inspection {
  id: string;
  propertyId: string;
  type: 'move-in' | 'move-out' | 'routine';
  status: 'in-progress' | 'completed' | 'signed';
  createdAt: string;
  completedAt?: string;
  inspector: UserInfo;
  tenant?: UserInfo;
  landlord?: UserInfo;
  rooms: Room[];
  generalNotes: string;
  signatures: Signature[];
  reportGenerated: boolean;
  syncStatus: 'synced' | 'pending' | 'offline';
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'property_manager' | 'landlord' | 'tenant' | 'maintenance';
  phone?: string;
}

export interface Signature {
  userId: string;
  role: string;
  signatureData: string;
  timestamp: string;
  name: string;
}

export interface Report {
  id: string;
  inspectionId: string;
  type: 'summary' | 'comparison' | 'maintenance' | 'deposit_calculation';
  generatedAt: string;
  pdfPath: string;
}