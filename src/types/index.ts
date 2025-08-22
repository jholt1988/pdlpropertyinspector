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
  /**
   * Approximate age of the inspected item in years. This replaces the old
   * damageEstimate cost field so the inspection can track lifecycle instead of
   * price.
   */
  estimatedAge?: number;
  /** Optional list of sub-items for grouped checklist entries */
  subItems?: ChecklistSubItem[];
  requiresAction: boolean;
}

/**
 * Represents an individual item inside a grouped checklist entry. Each
 * sub-item tracks its own condition and age.
 */
export interface ChecklistSubItem {
  id: string;
  name: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | null;
  estimatedAge?: number;
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

export interface EstimateLine {
  item_description: string;
  location: string;
  issue_type: string;
  estimated_labor_cost: number;
  estimated_material_cost: number;
  item_total_cost: number;
  repair_instructions: string[];
  notes?: string;
}

export interface EstimateResult {
  overall_project_estimate: number;
  estimate_summary: {
    total_labor_cost: number;
    total_material_cost: number;
    total_project_cost: number;
    items_to_repair: number;
    items_to_replace: number;
  };
  itemized_breakdown: EstimateLine[];
  metadata: {
    creation_date: string;
    currency: string;
    disclaimer: string;
  };
}

export interface RepairPlan {
  id: string;
  propertyId: string;
  unitNumber?: number;
  inspectionId?: string;
  inventoryData: InventoryItem[];
  analysisResults: AnalysisResult;
  estimate?: EstimateResult;
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

// types.ts
export interface UserLocation {
  city: string;
  region: string;
  country: string;
  type: 'approximate';
}

export interface EstimateLineItem {
  itemId: string;
  itemName: string;
  category: string;
  currentCondition: string;
  location?: string;
  fix?: {
    laborHours: number;
    laborRate: number;
    partsCost: number;
    totalCost: number;
    citations?: Array<{
      description: string;
      source: string;
    }>;
  };
  replace?: {
    laborHours?: number;
    laborRate?: number;
    partsCost?: number;
    totalCost: number;
    areaSqFt?: number;
    laborCostPerSqFt?: number;
    materialCostPerSqFt?: number;
    removalCostPerSqFt?: number;
    citations?: Array<{
      description: string;
      source: string;
    }>;
  };
  recommendedAction: 'Fix' | 'Replace';
  instructions?: {
    fix?: string[];
    replace?: string[];
  };
}

export interface DetailedEstimate {
  line_items: EstimateLineItem[];
  summary: {
    totalFixCost: number;
    totalReplaceCost: number;
    totalRecommendedCost: number;
    overallRecommendation: string;
    total_labor_cost: number;
    total_material_cost: number;
    total_project_cost: number;
    items_to_repair: number;
    items_to_replace: number;
  };
  metadata: {
    user_location: UserLocation;
    currency: string;
    generated_date: string;
    disclaimer: string;
    creationDate?: string;
    location?: string;
  };
}

export interface EnhancedEstimateLineItem {
  itemId: string;
  itemName: string;
  category: string;
  currentCondition: string;
  location?: string;
  originalCost: number;
  currentAge: number;
  depreciatedValue: number;
  adjustedValue: number;
  conditionPenalty: number;
  expectedLifetime: number;
  annualDepreciationRate: number;
  laborRate: number;
  fix?: {
    laborHours: number;
    laborRate: number;
    partsCost: number;
    totalCost: number;
  };
  replace?: {
    laborHours: number;
    laborRate: number;
    partsCost: number;
    totalCost: number;
  };
  recommendedAction: 'Fix' | 'Replace';
  reclassificationReason?: string;
  instructions?: {
    fix?: string[];
    replace?: string[];
  };
}

export interface EnhancedDetailedEstimate {
  line_items: EnhancedEstimateLineItem[];
  summary: {
    totalOriginalCost: number;
    totalDepreciatedValue: number;
    totalAdjustedValue: number;
    totalFixCost: number;
    totalReplaceCost: number;
    totalRecommendedCost: number;
    overallRecommendation: string;
    total_labor_cost: number;
    total_material_cost: number;
    total_project_cost: number;
    items_to_repair: number;
    items_to_replace: number;
    reclassifiedItems: number;
  };
  metadata: {
    estimateDate: string;
    currency: string;
    location: string;
    depreciationMethod: string;
    analysisSteps: string[];
    user_location: UserLocation;
    generated_date: string;
    disclaimer: string;
  };
}

