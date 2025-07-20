// Utility functions for generating unique IDs

export function generatePropertyId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `PROP${timestamp.toString().slice(-6)}${random}`;
}

export function generateInspectionId(propertyId: string, unitNumber: number): string {
  const unitStr = unitNumber.toString().padStart(2, '0');
  return `${propertyId}-UNIT${unitStr}`;
}

export function generateUniqueId(prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}_${random}`;
}