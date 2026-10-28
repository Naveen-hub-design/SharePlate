import React, { useState, useEffect } from 'react';
import { donationApi, routeApi } from '../api/client';
import type { Donation, GeocodeResult } from '../types';
import { DonationCard } from '../components/DonationCard';
import { RescueRouteModal } from '../components/RescueRouteModal';
import { 
  Search, 
  MapPin, 
  Grid, 
  Map as MapIcon, 
  Clock, 
  UtensilsCrossed,
  LocateFixed,
  Navigation,
  ExternalLink,
  ChevronRight,
  Flame,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// Helper component to center map programmatically
const MapFlyTo: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
      setTimeout(() => map.invalidateSize(), 200);
    }
  }, [center, zoom, map]);
  return null;
};

// Create category pin marker helper
const createCategoryIcon = (category: string, isUrgent: boolean = false) => {
  let emoji = '🍲';
  let bgColor = '#1B4332';
  
  if (category === 'COOKED_MEALS') {
    emoji = '🍲';
    bgColor = '#DC2626';
  } else if (category === 'BAKERY_AND_BREAD') {
    emoji = '🥖';
    bgColor = '#D97706';
  } else if (category === 'FRESH_PRODUCE') {
    emoji = '🥗';
    bgColor = '#16A34A';
  } else if (category === 'PACKAGED_GOODS') {
    emoji = '📦';
    bgColor = '#2563EB';
  } else if (category === 'DAIRY_PRODUCTS') {
    emoji = '🥛';
    bgColor = '#0284C7';
  } else if (category === 'BEVERAGES') {
    emoji = '🧃';
    bgColor = '#7C3AED';
  }

  const urgentRing = isUrgent
    ? `<span style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; border-radius: 50%; background-color: #EF4444; border: 2px solid white; animation: pulse 1.5s infinite;"></span>`
    : '';

  return new L.DivIcon({
    html: `<div style="position: relative; background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 17px; cursor: pointer;">
      ${emoji}
      ${urgentRing}
    </div>`,
    className: 'custom-cat-pin',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// User Location Pin
const userBeaconIcon = new L.DivIcon({
  html: `<div style="position: relative; width: 22px; height: 22px; background: #0284C7; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 14px rgba(2, 132, 199, 0.8);">
    <div style="position: absolute; -webkit-transform: scale(2.2); transform: scale(2.2); width: 100%; height: 100%; border-radius: 50%; background: rgba(2, 132, 199, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
  </div>`,
  className: 'user-beacon-pin',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
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
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [urgentOnly, setUrgentOnly] = useState(false);

  // Map state
  const defaultCenter: [number, number] = [12.9716, 77.5946]; // Bangalore City Center
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);

  // Area Search / Geocoding
  const [areaQuery, setAreaQuery] = useState('');
  const [areaResults, setAreaResults] = useState<GeocodeResult[]>([]);
  const [searchingArea, setSearchingArea] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);

  // Route Modal State
  const [selectedDonationForRoute, setSelectedDonationForRoute] = useState<Donation | null>(null);

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

  const handleAreaSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaQuery.trim()) return;
    setSearchingArea(true);
    try {
      const res = await routeApi.geocode(areaQuery);
      setAreaResults(res.data.results || []);
      setShowAreaDropdown(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingArea(false);
    }
  };

  const handleSelectArea = (item: GeocodeResult) => {
    setMapCenter([item.lat, item.lng]);
    setUserLocation({
      lat: item.lat,
      lng: item.lng,
      label: item.label,
    });
    setAreaQuery('');
    setShowAreaDropdown(false);
    toast.success(`Centered map on ${item.label.split(',')[0]}`);
  };

  const handleAcquireGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    toast.loading('Acquiring high-accuracy GPS coordinates...', { id: 'gps-search' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('gps-search');
        toast.success('Centered on your GPS location!');
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMapCenter(coords);
        setUserLocation({
          lat: coords[0],
          lng: coords[1],
          label: 'Your Current GPS Position',
        });
      },
      (err) => {
        toast.dismiss('gps-search');
        toast.error(`GPS Error: ${err.message}. Using default Bangalore center.`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
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
            Browse and claim active, verified surplus listings ready for immediate collection with live route directions.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 self-start md:self-auto shadow-sm">
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
                ? 'bg-[#1B4332] text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Interactive Map
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
        /* Upgraded Interactive Map View */
        <div className="space-y-4">
          {/* Spatial Controls Toolbar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Area Search Input */}
            <div className="relative flex-1 w-full">
              <form onSubmit={handleAreaSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search Bangalore area (e.g. Indiranagar, Koramangala, Whitefield)..."
                    value={areaQuery}
                    onChange={(e) => setAreaQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:border-[#1B4332] outline-none text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchingArea}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl font-bold text-stone-700 transition-colors"
                >
                  {searchingArea ? 'Locating...' : 'Locate'}
                </button>
                <button
                  type="button"
                  onClick={handleAcquireGPS}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#1B4332] rounded-xl font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap border border-emerald-200"
                >
                  <LocateFixed className="w-3.5 h-3.5 text-emerald-700" />
                  My GPS
                </button>
              </form>

              {/* Area search autocomplete dropdown */}
              {showAreaDropdown && areaResults.length > 0 && (
                <div className="absolute top-12 left-0 right-0 z-30 bg-white rounded-xl shadow-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
                  {areaResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectArea(item)}
                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-stone-50 flex items-center gap-2 text-stone-800"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Radius Filter Pills */}
            <div className="flex items-center gap-1.5 self-start md:self-auto shrink-0">
              <span className="text-stone-500 font-semibold mr-1">Radius:</span>
              {[5, 10, 15, 25].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setRadiusKm(km)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    radiusKm === km
                      ? 'bg-[#1B4332] text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          {/* Leaflet Map Frame */}
          <div className="bg-white p-3 rounded-3xl border border-stone-200 shadow-xl h-[680px] relative overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={true}
              className="w-full h-full rounded-2xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapFlyTo center={mapCenter} zoom={13} />

              {/* User Location Marker & Radius Circle */}
              {userLocation && (
                <>
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={userBeaconIcon}>
                    <Popup>
                      <div className="p-1 text-xs">
                        <strong className="block text-sky-900 font-bold">📍 Your Location Point</strong>
                        <span>{userLocation.label}</span>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={radiusKm * 1000}
                    pathOptions={{
                      color: '#1B4332',
                      fillColor: '#2D6A4F',
                      fillOpacity: 0.08,
                      weight: 1.5,
                      dashArray: '4, 6',
                    }}
                  />
                </>
              )}

              {/* Donation Pins */}
              {donations.map((d) => {
                if (!d.latitude || !d.longitude) return null;
                const deadline = new Date(d.collection_deadline).getTime();
                const now = new Date().getTime();
                const diffHours = (deadline - now) / (1000 * 3600);
                const isUrgent = diffHours > 0 && diffHours <= 2.5;

                return (
                  <Marker
                    key={d.id}
                    position={[d.latitude, d.longitude]}
                    icon={createCategoryIcon(d.category, isUrgent)}
                  >
                    <Popup maxWidth={260} minWidth={220}>
                      <div className="p-1 space-y-2">
                        {/* Image preview */}
                        {d.image_url && (
                          <div className="h-24 w-full rounded-lg overflow-hidden bg-stone-100">
                            <img
                              src={d.image_url}
                              alt={d.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                            {d.category.replace(/_/g, ' ')}
                          </span>
                          <h4 className="font-bold text-xs text-stone-900 mt-1 leading-tight">
                            {d.title}
                          </h4>
                          <p className="text-[11px] text-stone-600 mt-0.5 font-medium">
                            {d.donor_organization?.name}
                          </p>
                        </div>

                        <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-emerald-800">
                            {d.remaining_quantity} {d.unit}
                          </span>
                          <span
                            className={`font-semibold flex items-center gap-1 ${
                              isUrgent ? 'text-red-600' : 'text-stone-500'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {new Date(d.collection_deadline).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Interactive Route Navigation Trigger */}
                        <div className="pt-1 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedDonationForRoute(d)}
                            className="w-full py-1.5 px-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            Plan Route & Directions
                          </button>

                          <Link
                            to={`/donations/${d.id}`}
                            className="w-full block text-center py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            View Full Details & Claim
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Map Legend Floating Overlay */}
            <div className="absolute bottom-6 right-6 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-stone-200/90 text-[11px] space-y-1.5 hidden sm:block">
              <strong className="block text-stone-900 font-bold mb-1">Listing Pins</strong>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
                <span className="text-stone-600">Cooked Meals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-600 inline-block" />
                <span className="text-stone-600">Bakery & Bread</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                <span className="text-stone-600">Fresh Produce</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                <span className="text-stone-600">Packaged Goods</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rescue Route Modal */}
      {selectedDonationForRoute && (
        <RescueRouteModal
          isOpen={!!selectedDonationForRoute}
          onClose={() => setSelectedDonationForRoute(null)}
          donation={selectedDonationForRoute}
          initialOrigin={userLocation || undefined}
        />
      )}
    </div>
  );
};
