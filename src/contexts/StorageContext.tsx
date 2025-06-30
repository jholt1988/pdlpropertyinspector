import React, { createContext, useContext, useState, useEffect } from 'react';
import { Inspection, Property, Report } from '../types';

interface StorageContextType {
  inspections: Inspection[];
  properties: Property[];
  reports: Report[];
  saveInspection: (inspection: Inspection) => Promise<void>;
  getInspection: (id: string) => Inspection | null;
  deleteInspection: (id: string) => Promise<void>;
  saveProperty: (property: Property) => Promise<void>;
  getProperties: () => Property[];
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

  const loadData = async () => {
    try {
      const storedInspections = localStorage.getItem('inspections');
      const storedProperties = localStorage.getItem('properties');
      const storedReports = localStorage.getItem('reports');

      if (storedInspections) {
        setInspections(JSON.parse(storedInspections));
      }
      if (storedProperties) {
        setProperties(JSON.parse(storedProperties));
      }
      if (storedReports) {
        setReports(JSON.parse(storedReports));
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
  };

  const getProperties = () => properties;

  return (
    <StorageContext.Provider value={{
      inspections,
      properties,
      reports,
      saveInspection,
      getInspection,
      deleteInspection,
      saveProperty,
      getProperties,
      loadData,
    }}>
      {children}
    </StorageContext.Provider>
  );
}