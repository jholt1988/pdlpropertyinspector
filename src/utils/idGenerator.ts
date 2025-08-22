// Utility functions for generating unique IDs
import { getNextSequence } from './sequenceGenerator'; // Assuming the sequence generator is in the same directory

export const generatePropertyId = () => {
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  const sequence = getNextSequence('property').toString().padStart(7, '0');
  return `PROP${sequence}${randomPart.slice(0, 3)}`;
};

export const generateInspectionId = (propertyId: string) => {
  const sequence = getNextSequence('inspection');
  const paddedSequence = sequence.toString().padStart(7, '0');
  return `INSP-${propertyId}-${paddedSequence}`;
};

export const generateItemId = (inspectionId: string) => {
  const sequence = getNextSequence('item');
  const paddedSequence = sequence.toString().padStart(7, '0');
  return `ITEM-${inspectionId}-${paddedSequence}`;
};