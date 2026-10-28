export type UserRole = 'DONOR' | 'RECEIVER' | 'ADMIN';

export type OrganizationType = 
  | 'RESTAURANT'
  | 'HOTEL'
  | 'BAKERY'
  | 'CATERER'
  | 'SUPERMARKET'
  | 'CORPORATE_CAFETERIA'
  | 'EVENT_ORGANIZER'
  | 'SHELTER'
  | 'COMMUNITY_KITCHEN'
  | 'FOOD_BANK'
  | 'CHARITABLE_TRUST'
  | 'OTHER';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export type DonationStatus = 'DRAFT' | 'PUBLISHED' | 'RESERVED' | 'COLLECTED' | 'COMPLETED' | 'WITHDRAWN' | 'EXPIRED';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export type FoodCategory = 
  | 'COOKED_MEALS'
  | 'BAKERY_AND_BREAD'
  | 'FRESH_PRODUCE'
  | 'PACKAGED_GOODS'
  | 'DAIRY_PRODUCTS'
  | 'BEVERAGES'
  | 'RAW_MEAT_OR_SEAFOOD'
  | 'FROZEN_ITEMS'
  | 'OTHER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: string;
  organization?: Organization;
}

export interface Organization {
  id: string;
  name: string;
  org_type: OrganizationType;
  verification_status: VerificationStatus;
  fssai_license_number?: string;
  registration_number?: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  verified_at?: string;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  donor_org_id?: string;
  title: string;
  description: string;
  category: FoodCategory;
  quantity: number;
  reserved_quantity: number;
  collected_quantity: number;
  remaining_quantity: number;
  unit: string;
  image_url?: string;
  cooked_or_prepared_at?: string;
  packaging_time?: string;
  allergens: string[];
  storage_condition: string;
  storage_temperature_celsius?: number;
  is_perishable: boolean;
  collection_address: string;
  latitude: number;
  longitude: number;
  available_from: string;
  collection_deadline: string;
  special_handling_instructions?: string;
  status: DonationStatus;
  donor_contact_phone: string;
  donor_contact_email: string;
  created_at: string;
  updated_at: string;
  donor_organization?: Organization;
  donor_user?: {
    full_name: string;
    email: string;
  };
  // Discovery match fields
  match_score?: number;
  match_reasons?: string[];
  distance_km?: number;
}

export interface DonationRequest {
  id: string;
  donation_id: string;
  receiver_id: string;
  receiver_org_id?: string;
  requested_quantity: number;
  status: RequestStatus;
  pickup_code?: string;
  pickup_estimated_time?: string;
  requester_notes?: string;
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
  donation?: Donation;
  receiver_organization?: Organization;
  receiver_user?: {
    full_name: string;
    email: string;
    phone?: string;
  };
  pickup_record?: PickupRecord;
}

export interface PickupRecord {
  id: string;
  request_id: string;
  donation_id: string;
  collector_name: string;
  collector_phone: string;
  collected_at: string;
  quantity_collected: number;
  pickup_temperature_celsius?: number;
  safety_checklist_confirmed: boolean;
  notes?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  related_entity_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface SafetyReport {
  id: string;
  donation_id: string;
  reporter_id: string;
  reason: string;
  details: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  action_taken?: string;
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
  donation?: Donation;
  reporter?: {
    full_name: string;
    email: string;
  };
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
  user?: {
    email: string;
    full_name: string;
    role: string;
  };
}

export interface ImpactAnalytics {
  total_quantity_donated: number;
  total_quantity_collected: number;
  completed_donations_count: number;
  active_listings_count: number;
  total_receivers_served: number;
  estimated_meals_distributed: number;
  estimated_co2_kg_diverted: number;
  categories_distribution: Record<string, number>;
  monthly_trends: Array<{
    month: string;
    completed_rescues: number;
    portions_collected: number;
  }>;
}
