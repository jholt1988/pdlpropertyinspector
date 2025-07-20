import { Room, ChecklistItem } from '../types';

export const ROOM_TEMPLATES: Record<string, ChecklistItem[]> = {
  // EXTERIOR TEMPLATES
  exterior_building: [
    {
      id: 'ext_foundation',
      category: 'Foundation',
      item: 'Foundation condition and integrity',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ext_exterior_walls',
      category: 'Exterior Walls',
      item: 'Siding, brick, or stucco condition',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ext_roof',
      category: 'Roofing',
      item: 'Roof condition and gutters',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ext_windows_doors',
      category: 'Windows & Doors',
      item: 'Exterior windows and doors condition',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ext_walkways',
      category: 'Walkways',
      item: 'Sidewalks, driveways, and pathways',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
  ],
  exterior_landscaping: [
    {
      id: 'ext_lawn',
      category: 'Landscaping',
      item: 'Lawn and garden areas',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ext_trees',
      category: 'Trees & Plants',
      item: 'Trees, shrubs, and plant health',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ext_drainage',
      category: 'Drainage',
      item: 'Yard drainage and water flow',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ext_fencing',
      category: 'Fencing',
      item: 'Fence condition and gates',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
  ],
  exterior_parking: [
    {
      id: 'ext_driveway',
      category: 'Driveway',
      item: 'Driveway surface condition',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ext_garage',
      category: 'Garage',
      item: 'Garage structure and doors',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ext_parking_area',
      category: 'Parking',
      item: 'Parking area condition',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
  ],
  // INTERIOR TEMPLATES
  bedroom: [
    {
      id: 'br_walls',
      category: 'Walls & Ceiling',
      item: 'Paint condition and wall integrity',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'br_flooring',
      category: 'Flooring',
      item: 'Carpet/hardwood/tile condition',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'br_windows',
      category: 'Windows',
      item: 'Window functionality and treatments',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'br_closet',
      category: 'Storage',
      item: 'Closet doors, shelving, and organization',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'br_outlets',
      category: 'Electrical',
      item: 'Outlets, switches, and light fixtures',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'br_ceiling_fan',
      category: 'Ventilation',
      item: 'Ceiling fan functionality',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
  ],
  bathroom: [
    {
      id: 'bt_plumbing',
      category: 'Plumbing',
      item: 'Sink, toilet, shower/tub functionality',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'bt_tiles',
      category: 'Surfaces',
      item: 'Tile, grout, and caulking condition',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'bt_ventilation',
      category: 'Ventilation',
      item: 'Exhaust fan functionality and venting',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'bt_fixtures',
      category: 'Fixtures',
      item: 'Towel bars, toilet paper holder, hooks',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'bt_mirror',
      category: 'Accessories',
      item: 'Mirror and medicine cabinet condition',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'bt_lighting',
      category: 'Electrical',
      item: 'Light fixtures and GFCI outlets',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
  ],
  kitchen: [
    {
      id: 'kt_appliances',
      category: 'Appliances',
      item: 'Refrigerator, stove, dishwasher, microwave',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'kt_counters',
      category: 'Surfaces',
      item: 'Countertop condition and cleanliness',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'kt_cabinets',
      category: 'Storage',
      item: 'Cabinet doors, drawers, and hardware',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'kt_sink',
      category: 'Plumbing',
      item: 'Sink, faucet, and garbage disposal',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'kt_backsplash',
      category: 'Surfaces',
      item: 'Backsplash and wall condition',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'kt_ventilation',
      category: 'Ventilation',
      item: 'Range hood and ventilation system',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
  ],
  living_room: [
    {
      id: 'lr_walls',
      category: 'Walls & Ceiling',
      item: 'Paint condition and wall integrity',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'lr_flooring',
      category: 'Flooring',
      item: 'Carpet/hardwood/tile condition',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'lr_windows',
      category: 'Windows',
      item: 'Window functionality and treatments',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'lr_lighting',
      category: 'Electrical',
      item: 'Light fixtures, outlets, and switches',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'lr_fireplace',
      category: 'Fireplace',
      item: 'Fireplace condition and functionality',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
  ],
  dining_room: [
    {
      id: 'dr_walls',
      category: 'Walls & Ceiling',
      item: 'Paint condition and wall integrity',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'dr_flooring',
      category: 'Flooring',
      item: 'Flooring condition and cleanliness',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'dr_lighting',
      category: 'Electrical',
      item: 'Chandelier/light fixtures condition',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'dr_windows',
      category: 'Windows',
      item: 'Window functionality and treatments',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
  ],
  utility_room: [
    {
      id: 'ut_washer_dryer',
      category: 'Appliances',
      item: 'Washer/dryer connections and hookups',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ut_water_heater',
      category: 'Systems',
      item: 'Water heater condition and venting',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ut_hvac',
      category: 'HVAC',
      item: 'Heating/cooling system components',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ut_electrical',
      category: 'Electrical',
      item: 'Circuit breaker panel and wiring',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ut_storage',
      category: 'Storage',
      item: 'Shelving and storage systems',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
  ],
  // COMMON AREAS (for multi-unit properties)
  common_hallways: [
    {
      id: 'ch_lighting',
      category: 'Lighting',
      item: 'Hallway lighting and emergency lighting',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ch_flooring',
      category: 'Flooring',
      item: 'Carpet/tile condition in hallways',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ch_walls',
      category: 'Walls',
      item: 'Paint and wall condition',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'ch_safety',
      category: 'Safety',
      item: 'Fire extinguishers and exit signs',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
  ],
  common_laundry: [
    {
      id: 'cl_machines',
      category: 'Equipment',
      item: 'Washers and dryers functionality',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'cl_ventilation',
      category: 'Ventilation',
      item: 'Ventilation and air circulation',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'cl_plumbing',
      category: 'Plumbing',
      item: 'Water connections and drainage',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'cl_cleanliness',
      category: 'Maintenance',
      item: 'Overall cleanliness and organization',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
  ],
  common_lobby: [
    {
      id: 'cl_entrance',
      category: 'Entrance',
      item: 'Main entrance doors and hardware',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'cl_mailboxes',
      category: 'Mailboxes',
      item: 'Mailbox condition and security',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'cl_intercom',
      category: 'Communication',
      item: 'Intercom system functionality',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
    {
      id: 'cl_lighting',
      category: 'Lighting',
      item: 'Lobby lighting and ambiance',
      condition: null,
      notes: '',
      photos: [],
      requiresAction: false,
    },
  ],
};

export const SECTION_TEMPLATES = {
  exterior: {
    name: 'Exterior',
    defaultRooms: [
      { name: 'Building Exterior', type: 'exterior_building' },
      { name: 'Landscaping', type: 'exterior_landscaping' },
      { name: 'Parking & Garage', type: 'exterior_parking' },
    ]
  },
  interior: {
    name: 'Interior',
    defaultRooms: [
      { name: 'Living Room', type: 'living_room' },
      { name: 'Kitchen', type: 'kitchen' },
      { name: 'Master Bedroom', type: 'bedroom' },
      { name: 'Master Bathroom', type: 'bathroom' },
      { name: 'Guest Bedroom', type: 'bedroom' },
      { name: 'Guest Bathroom', type: 'bathroom' },
      { name: 'Utility Room', type: 'utility_room' },
    ]
  },
  common_areas: {
    name: 'Common Areas',
    defaultRooms: [
      { name: 'Hallways', type: 'common_hallways' },
      { name: 'Laundry Room', type: 'common_laundry' },
      { name: 'Lobby/Entrance', type: 'common_lobby' },
    ]
  }
};

export const ROOM_TYPE_OPTIONS = [
  // Interior rooms
  { value: 'bedroom', label: 'Bedroom', section: 'interior' },
  { value: 'bathroom', label: 'Bathroom', section: 'interior' },
  { value: 'kitchen', label: 'Kitchen', section: 'interior' },
  { value: 'living_room', label: 'Living Room', section: 'interior' },
  { value: 'dining_room', label: 'Dining Room', section: 'interior' },
  { value: 'utility_room', label: 'Utility Room', section: 'interior' },
  
  // Exterior areas
  { value: 'exterior_building', label: 'Building Exterior', section: 'exterior' },
  { value: 'exterior_landscaping', label: 'Landscaping', section: 'exterior' },
  { value: 'exterior_parking', label: 'Parking & Garage', section: 'exterior' },
  
  // Common areas
  { value: 'common_hallways', label: 'Hallways', section: 'common' },
  { value: 'common_laundry', label: 'Laundry Room', section: 'common' },
  { value: 'common_lobby', label: 'Lobby/Entrance', section: 'common' },
];

export function generateRoomTemplate(roomType: string, roomName: string): Room {
  const checklistItems = ROOM_TEMPLATES[roomType] || ROOM_TEMPLATES.living_room;
  
  return {
    id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: roomName,
    type: roomType as any,
    checklistItems: checklistItems.map(item => ({
      ...item,
      id: `${item.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    })),
  };
}

export function generateInspectionStructure(includeCommonAreas: boolean = false) {
  const sections = [];
  
  // Always include exterior and interior
  sections.push({
    section: 'exterior',
    rooms: SECTION_TEMPLATES.exterior.defaultRooms.map(room => 
      generateRoomTemplate(room.type, room.name)
    )
  });
  
  sections.push({
    section: 'interior', 
    rooms: SECTION_TEMPLATES.interior.defaultRooms.map(room =>
      generateRoomTemplate(room.type, room.name)
    )
  });
  
  // Include common areas if requested (for multi-unit properties)
  if (includeCommonAreas) {
    sections.push({
      section: 'common_areas',
      rooms: SECTION_TEMPLATES.common_areas.defaultRooms.map(room =>
        generateRoomTemplate(room.type, room.name)
      )
    });
  }
  
  return sections.flatMap(section => section.rooms);
}

// Legacy support - keep existing default rooms for backward compatibility
export const DEFAULT_ROOMS = SECTION_TEMPLATES.interior.defaultRooms;