import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DonationCard } from '../components/DonationCard';
import type { Donation } from '../types';

describe('DonationCard', () => {
  const mockDonation: Donation = {
    id: 'don-1',
    donor_id: 'u-1',
    title: 'Hyderabadi Dum Biryani & Mirchi Salan',
    description: 'Freshly prepared surplus from lunch corporate banquet.',
    category: 'COOKED_MEALS',
    quantity: 50,
    reserved_quantity: 10,
    collected_quantity: 0,
    remaining_quantity: 40,
    unit: 'portions',
    allergens: ['Dairy', 'Gluten'],
    storage_condition: 'HOT_HOLDING',
    is_perishable: true,
    collection_address: '42 MG Road, Bangalore',
    latitude: 12.9716,
    longitude: 77.5946,
    available_from: new Date().toISOString(),
    collection_deadline: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    status: 'PUBLISHED',
    donor_contact_phone: '+91 98765 43210',
    donor_contact_email: 'chef@taj.demo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    donor_organization: {
      id: 'org-1',
      name: 'Taj West End Kitchen',
      org_type: 'HOTEL',
      verification_status: 'VERIFIED',
      address_line: 'MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      postal_code: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      contact_person: 'Head Chef',
      contact_phone: '+91 98765 43210',
      contact_email: 'chef@taj.demo',
      created_at: new Date().toISOString(),
    },
    distance_km: 2.4,
  };

  it('renders food title, category, donor name, and portions bar correctly', () => {
    render(
      <BrowserRouter>
        <DonationCard donation={mockDonation} />
      </BrowserRouter>
    );

    expect(screen.getByText('Hyderabadi Dum Biryani & Mirchi Salan')).toBeInTheDocument();
    expect(screen.getByText('Taj West End Kitchen')).toBeInTheDocument();
    expect(screen.getAllByText('Cooked Meals').length).toBeGreaterThan(0);
    expect(screen.getByText(/40 \/ 50 portions/i)).toBeInTheDocument();
    expect(screen.getByText(/2.4 km away/i)).toBeInTheDocument();
    expect(screen.getByText(/Allergens:\s*Dairy,\s*Gluten/i)).toBeInTheDocument();
  });
});
