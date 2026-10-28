import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';

vi.mock('../api/client', () => ({
  donationApi: {
    getDiscover: vi.fn().mockResolvedValue({
      data: {
        donations: [
          {
            id: 'don-demo-1',
            title: 'Fresh Paneer Tikka & Naan',
            category: 'COOKED_MEALS',
            quantity: 30,
            remaining_quantity: 30,
            unit: 'portions',
            collection_deadline: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
            status: 'PUBLISHED',
            allergens: ['Dairy', 'Gluten'],
            storage_condition: 'HOT_HOLDING',
            donor_organization: { name: 'Royal Orchid Hotel' },
          },
        ],
      },
    }),
  },
  analyticsApi: {
    getImpact: vi.fn().mockResolvedValue({
      data: {
        impact: {
          total_quantity_collected: 12500,
          completed_donations_count: 380,
          estimated_co2_kg_diverted: 15875,
          active_listings_count: 14,
        },
      },
    }),
  },
  apiClient: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe('LandingPage', () => {
  it('renders hero title, mission tagline, and FSSAI compliance notices', async () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Good food deserves/i)).toBeInTheDocument();
    expect(screen.getByText(/another destination/i)).toBeInTheDocument();
    expect(screen.getByText(/Certified Food Rescue Compliant with FSSAI Regulations/i)).toBeInTheDocument();
    expect(screen.getByText(/How SharePlate Works/i)).toBeInTheDocument();
  });
});
