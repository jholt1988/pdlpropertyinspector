import React, { createContext, useContext, useState, useEffect } from 'react';
import { Inspection, Property, Report, RepairPlan } from '../types';
import { generateInspectionStructure } from '../utils/inspectionTemplates';
import { generateInspectionId } from '../utils/idGenerator';

interface StorageContextType {
  inspections: Inspection[];
  properties: Property[];
  reports: Report[];
  repairPlans: RepairPlan[];
  saveInspection: (inspection: Inspection) => Promise<void>;
  getInspection: (id: string) => Inspection | null;
  deleteInspection: (id: string) => Promise<void>;
  saveProperty: (property: Property) => Promise<void>;
  getProperties: () => Property[];
  saveRepairPlan: (plan: RepairPlan) => Promise<void>;
  getRepairPlans: () => RepairPlan[];
  loadData: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [repairPlans, setRepairPlans] = useState<RepairPlan[]>([]);

  const loadData = async () => {
    try {
      const storedInspections = localStorage.getItem('inspections');
      const storedProperties = localStorage.getItem('properties');
      const storedReports = localStorage.getItem('reports');
      const storedPlans = localStorage.getItem('repairPlans');

      if (storedInspections) {
        setInspections(JSON.parse(storedInspections));
      }
      if (storedProperties) {
        setProperties(JSON.parse(storedProperties));
      }
      if (storedReports) {
        setReports(JSON.parse(storedReports));
      }
      if (storedPlans) {
        setRepairPlans(JSON.parse(storedPlans));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveInspection = async (inspection: Inspection) => {
    const updated = inspections.filter(i => i.id !== inspection.id);
    updated.push(inspection);
    setInspections(updated);
    localStorage.setItem('inspections', JSON.stringify(updated));
  };

  const getInspection = (id: string) => {
    return inspections.find(i => i.id === id) || null;
  };

  const deleteInspection = async (id: string) => {
    const filtered = inspections.filter(i => i.id !== id);
    setInspections(filtered);
    localStorage.setItem('inspections', JSON.stringify(filtered));
  };

  const saveProperty = async (property: Property) => {
    const updated = properties.filter(p => p.id !== property.id);
    updated.push(property);
    setProperties(updated);
    localStorage.setItem('properties', JSON.stringify(updated));
    
    // Auto-generate inspections for the new property
    await generateInspectionsForProperty(property);
  };

  const generateInspectionsForProperty = async (property: Property) => {
    const inspectionsToCreate = [];
    
    if (property.isMultiUnit && property.units && property.units > 1) {
      // Multi-unit property: create inspection for each unit
      for (let unitNumber = 1; unitNumber <= property.units; unitNumber++) {
        const inspectionId = generateInspectionId(property.id);
        const includeCommonAreas = unitNumber === 1; // Only first unit gets common areas
        const rooms = generateInspectionStructure(includeCommonAreas);
        
        const inspection: Inspection = {
          id: inspectionId,
          propertyId: property.id,
          unitNumber: unitNumber,
          type: 'move-in',
          status: 'in-progress',
          createdAt: new Date().toISOString(),
          inspector: {
            id: 'auto_generated',
            name: 'Auto Generated',
            email: 'system@example.com',
            role: 'property_manager',
          },
          rooms,
          generalNotes: '',
          signatures: [],
          reportGenerated: false,
          syncStatus: 'offline',
        };
        
        inspectionsToCreate.push(inspection);
      }
    } else {
      // Single-family home: create one inspection
      const inspectionId = generateInspectionId(property.id);
      const rooms = generateInspectionStructure(false);
      
      const inspection: Inspection = {
        id: inspectionId,
        propertyId: property.id,
        unitNumber: 1,
        type: 'move-in',
        status: 'in-progress',
        createdAt: new Date().toISOString(),
        inspector: {
          id: 'auto_generated',
          name: 'Auto Generated',
          email: 'system@example.com',
          role: 'property_manager',
        },
        rooms,
        generalNotes: '',
        signatures: [],
        reportGenerated: false,
        syncStatus: 'offline',
      };
      
      inspectionsToCreate.push(inspection);
    }
    
    // Save all generated inspections
    for (const inspection of inspectionsToCreate) {
      await saveInspection(inspection);
    }
  };

  const getProperties = () => properties;

  const saveRepairPlan = async (plan: RepairPlan) => {
    const updated = repairPlans.filter(p => p.id !== plan.id);
    updated.push(plan);
    setRepairPlans(updated);
    localStorage.setItem('repairPlans', JSON.stringify(updated));
  };

  const getRepairPlans = () => repairPlans;

  return (
    <StorageContext.Provider value={{
      inspections,
      properties,
      reports,
      repairPlans,
      saveInspection,
      getInspection,
      deleteInspection,
      saveProperty,
      getProperties,
      saveRepairPlan,
      getRepairPlans,
      loadData,
    }}>
      {children}
    </StorageContext.Provider>
  );
}
