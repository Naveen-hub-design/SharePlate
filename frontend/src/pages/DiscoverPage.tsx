import React, { useState, useEffect } from 'react';
import { donationApi } from '../api/client';
import type { Donation } from '../types';
import { DonationCard } from '../components/DonationCard';
import { 
  Search, 
  Filter, 
  MapPin, 
  Grid, 
  Map as MapIcon, 
  SlidersHorizontal, 
  Clock, 
  UtensilsCrossed,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Fix leaflet default icons for bundlers
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const FOOD_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'COOKED_MEALS', label: 'Cooked Meals' },
  { value: 'BAKERY_AND_BREAD', label: 'Bakery & Bread' },
  { value: 'FRESH_PRODUCE', label: 'Fresh Produce' },
  { value: 'PACKAGED_GOODS', label: 'Packaged Goods' },
  { value: 'DAIRY_PRODUCTS', label: 'Dairy' },
  { value: 'BEVERAGES', label: 'Beverages' },
];

export const DiscoverPage: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [maxDistance, setMaxDistance] = useState<number>(25);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [urgentOnly, setUrgentOnly] = useState(false);

  // Default map center (Bangalore: 12.9716, 77.5946)
  const defaultCenter: [number, number] = [12.9716, 77.5946];

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const params: any = {
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        status: 'PUBLISHED',
      };
      const res = await donationApi.getDiscover(params);
      let list: Donation[] = res.data.donations || [];

      // Filter urgent locally if checked (under 3 hours)
      if (urgentOnly) {
        const now = new Date().getTime();
        list = list.filter((d) => {
          const deadline = new Date(d.collection_deadline).getTime();
          return (deadline - now) > 0 && (deadline - now) <= 3 * 3600 * 1000;
        });
      }

      setDonations(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [selectedCategory, urgentOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDonations();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
            Verified Food Rescue Network
          </span>
          <h1 className="text-3xl font-extrabold text-stone-900 mt-2 font-heading">
            Discover Surplus Food
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Browse and claim active, verified surplus listings ready for immediate collection.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 self-start md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            Grid View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'map'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Map View
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-sm mb-8 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search by food item, meal type, or donor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-[#1B4332] outline-none text-xs sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2.5 px-3.5 rounded-xl border border-stone-200 focus:border-[#1B4332] outline-none text-xs font-medium bg-white"
            >
              {FOOD_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-stone-500">Quick Filters:</span>
            <button
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={`px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1 ${
                urgentOnly
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              Expiring in &lt; 3h
            </button>
            <button
              onClick={() => setSelectedCategory('COOKED_MEALS')}
              className={`px-3 py-1 rounded-full font-bold transition-colors ${
                selectedCategory === 'COOKED_MEALS'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Cooked Meals
            </button>
            <button
              onClick={() => setSelectedCategory('BAKERY_AND_BREAD')}
              className={`px-3 py-1 rounded-full font-bold transition-colors ${
                selectedCategory === 'BAKERY_AND_BREAD'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Bakery
            </button>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory('')}
                className="text-stone-500 hover:text-stone-800 underline text-[11px]"
              >
                Clear Filters
              </button>
            )}
          </div>

          <span className="text-stone-500 font-medium">
            Found <strong className="text-stone-900">{donations.length}</strong> active listing(s)
          </span>
        </div>
      </div>

      {/* Main Content Area: Grid vs Map */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#1B4332]/20 border-t-[#1B4332] rounded-full animate-spin" />
          <p className="mt-3 text-xs font-semibold text-stone-500">Loading food listings...</p>
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm">
          <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800">No surplus food listings match your criteria</h3>
          <p className="text-stone-500 text-xs mt-1">
            Try adjusting your search terms or clearing selected filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {donations.map((d) => (
            <DonationCard key={d.id} donation={d} showMatchScore />
          ))}
        </div>
      ) : (
        /* Map View */
        <div className="bg-white p-3 rounded-3xl border border-stone-200 shadow-lg h-[650px] relative overflow-hidden">
          <MapContainer
            center={
              donations.length > 0 && donations[0].latitude
                ? [donations[0].latitude, donations[0].longitude]
                : defaultCenter
            }
            zoom={13}
            scrollWheelZoom={false}
            className="w-full h-full rounded-2xl"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {donations.map((d) => {
              if (!d.latitude || !d.longitude) return null;
              return (
                <Marker
                  key={d.id}
                  position={[d.latitude, d.longitude]}
                  icon={defaultIcon}
                >
                  <Popup>
                    <div className="p-1 max-w-[200px]">
                      <h4 className="font-bold text-xs text-stone-900">{d.title}</h4>
                      <p className="text-[11px] text-stone-600 mt-0.5">{d.donor_organization?.name}</p>
                      <p className="text-[11px] font-bold text-emerald-700 mt-1">
                        {d.remaining_quantity} {d.unit} available
                      </p>
                      <Link
                        to={`/donations/${d.id}`}
                        className="mt-2 block w-full text-center py-1 bg-[#1B4332] text-white rounded text-[10px] font-bold"
                      >
                        View & Claim
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}
    </div>
  );
};
