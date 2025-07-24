export interface Property {
  id: string;
  address: string;
  propertyType: 'apartment' | 'house' | 'condo' | 'commercial';
  units?: number;
  isMultiUnit: boolean;
  owner: string;
  managedBy: string;
}

export interface Room {
  id: string;
  name: string;
  type:
    | 'bedroom'
    | 'bathroom'
    | 'kitchen'
    | 'living_room'
    | 'dining_room'
    | 'utility_room'
    | 'exterior_building'
    | 'exterior_landscaping'
    | 'exterior_parking'
    | 'common_hallways'
    | 'common_laundry'
    | 'common_lobby'
    | 'other';
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
  unitNumber?: number;
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

export interface RepairPlan {
  id: string;
  propertyId: string;
  unitNumber?: number;
  inspectionId?: string;
  inventoryData: InventoryItem[];
  analysisResults: AnalysisResult;
  createdAt: string;
}

export interface InventoryItem {
  itemId: string;
  itemName: string;
  category: string;
  currentCondition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged' | 'Non-functional';
  purchaseDate: string;
  lastMaintenanceDate?: string;
  originalCost: number;
  currentMarketValue?: number;
  location?: string;
  description?: string;
}

export interface FlaggedItem extends InventoryItem {
  flagReason: 'condition' | 'lifecycle' | 'maintenance';
  flagDetails: string;
  recommendation: 'fix' | 'replace';
  estimatedRepairCost?: number;
  estimatedReplacementCost?: number;
  repairSteps?: string[];
  requiredResources?: string[];
  estimatedTimeline?: string;
  costBreakdown?: {
    labor?: number;
    parts?: number;
    disposal?: number;
    installation?: number;
  };
}

export interface AnalysisResult {
  totalItems: number;
  flaggedItems: FlaggedItem[];
  itemsToFix: FlaggedItem[];
  itemsToReplace: FlaggedItem[];
  totalEstimatedCost: number;
  generatedDate: string;
  summary: {
    conditionFlags: number;
    lifecycleFlags: number;
    maintenanceFlags: number;
  };
}

export interface SystemConfig {
  repairThreshold: number;
  laborRates: {
    general: number;
    electrical: number;
    plumbing: number;
    hvac: number;
    specialized: number;
  };
  maintenanceThresholds: {
    [category: string]: number; // months
  };
  expectedLifespans: {
    [category: string]: number; // months
  };
}
