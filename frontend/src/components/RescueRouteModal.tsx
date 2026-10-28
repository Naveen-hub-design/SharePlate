import React, { useState, useEffect } from 'react';
import { 
  X, 
  Navigation, 
  Car, 
  Bike, 
  Footprints, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  LocateFixed, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp,
  Search,
  Building2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { routeApi } from '../api/client';
import type { RouteDirectionResponse, TransportMode, GeocodeResult, Donation } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Custom icons
const donorIcon = new L.DivIcon({
  html: `<div style="background-color: #DC2626; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">🍲</div>`,
  className: 'custom-donor-pin',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

const receiverIcon = new L.DivIcon({
  html: `<div style="background-color: #1B4332; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">🏢</div>`,
  className: 'custom-receiver-pin',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

// Helper component to auto-fit bounds on route change
const AutoFitBounds: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      const bounds = L.latLngBounds(points.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      setTimeout(() => map.invalidateSize(), 150);
    }
  }, [points, map]);
  return null;
};

interface RescueRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: Donation;
  initialOrigin?: { lat: number; lng: number; label: string };
}

export const RescueRouteModal: React.FC<RescueRouteModalProps> = ({
  isOpen,
  onClose,
  donation,
  initialOrigin,
}) => {
  const { user } = useAuth();

  // Donor destination coordinates
  const destLat = donation.latitude || 12.9716;
  const destLng = donation.longitude || 77.5946;

  // Origin state (Defaults to receiver organization if logged in, or initialOrigin, or Central Bangalore)
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string }>(() => {
    if (initialOrigin) return initialOrigin;
    if (user?.organization?.latitude && user.organization.longitude) {
      return {
        lat: user.organization.latitude,
        lng: user.organization.longitude,
        label: `${user.organization.name} (${user.organization.city})`,
      };
    }
    return {
      lat: 12.9352,
      lng: 77.6245,
      label: 'Koramangala Community Kitchen, Bangalore',
    };
  });

  const [mode, setMode] = useState<TransportMode>('driving');
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<RouteDirectionResponse | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  // Origin address search
  const [originQuery, setOriginQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const fetchRoute = async () => {
    if (!origin.lat || !origin.lng || !destLat || !destLng) return;
    setLoading(true);
    try {
      const res = await routeApi.getDirections({
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        dest_lat: destLat,
        dest_lng: destLng,
        mode: mode,
        donation_id: donation.id,
      });
      setRouteData(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to calculate rescue route.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoute();
    }
  }, [isOpen, origin, mode]);

  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    toast.loading('Acquiring high-accuracy GPS coordinates...', { id: 'gps' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('gps');
        toast.success('GPS location acquired!');
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Your Current Device Location',
        });
      },
      (err) => {
        toast.dismiss('gps');
        toast.error(`GPS Error: ${err.message}. Using default Bangalore origin.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearchOrigin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originQuery.trim()) return;
    setSearchingOrigin(true);
    try {
      const res = await routeApi.geocode(originQuery);
      setSearchResults(res.data.results || []);
      setShowSearchDropdown(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingOrigin(false);
    }
  };

  const selectSearchResult = (item: GeocodeResult) => {
    setOrigin({
      lat: item.lat,
      lng: item.lng,
      label: item.label,
    });
    setOriginQuery('');
    setShowSearchDropdown(false);
  };

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destLat},${destLng}&travelmode=${mode === 'motorcycle' ? 'two-wheeler' : mode}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Navigation className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg font-heading flex items-center gap-2">
                Rescue Route & Turn-by-Turn Navigation
              </h3>
              <p className="text-xs text-emerald-100">
                Optimized transit logistics for {donation.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Origin Selector Bar */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex-1 w-full relative">
            <form onSubmit={handleSearchOrigin} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Change pickup origin (e.g. Indiranagar, Whitefield, NGO hub)..."
                  value={originQuery}
                  onChange={(e) => setOriginQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 bg-white focus:border-[#1B4332] outline-none text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={searchingOrigin}
                className="px-3 py-2 bg-stone-200 hover:bg-stone-300 rounded-xl font-bold text-stone-700 transition-colors"
              >
                {searchingOrigin ? 'Searching...' : 'Find'}
              </button>
              <button
                type="button"
                onClick={handleUseCurrentGPS}
                className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <LocateFixed className="w-3.5 h-3.5 text-emerald-700" />
                My GPS
              </button>
            </form>

            {/* Geocode Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 right-0 z-30 bg-white rounded-xl shadow-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSearchResult(item)}
                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-stone-50 flex items-center gap-2 text-stone-800"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current Origin Display */}
          <div className="flex items-center gap-1.5 text-stone-600 bg-white px-3 py-1.5 rounded-xl border border-stone-200 w-full md:w-auto shrink-0 truncate">
            <span className="font-bold text-stone-900">From:</span>
            <span className="truncate max-w-[220px]" title={origin.label}>
              {origin.label}
            </span>
          </div>
        </div>

        {/* Modal Body: Split Map & Logistics Details */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[460px]">
          {/* Left Column: Interactive Leaflet Route Map */}
          <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-full bg-stone-100 border-b lg:border-b-0 lg:border-r border-stone-200">
            {routeData?.route_coordinates ? (
              <MapContainer
                center={[(origin.lat + destLat) / 2, (origin.lng + destLng) / 2]}
                zoom={12}
                scrollWheelZoom={false}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Receiver / Origin Marker */}
                <Marker position={[origin.lat, origin.lng]} icon={receiverIcon}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <strong className="block text-emerald-900 font-bold">🟢 Origin Point</strong>
                      <span>{origin.label}</span>
                    </div>
                  </Popup>
                </Marker>

                {/* Donor / Destination Marker */}
                <Marker position={[destLat, destLng]} icon={donorIcon}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <strong className="block text-red-900 font-bold">🍲 Donor Pickup Bay</strong>
                      <span>{donation.donor_organization?.name || donation.title}</span>
                      <p className="text-[11px] text-stone-500 mt-1">{donation.collection_address}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Polyline Route */}
                <Polyline
                  positions={routeData.route_coordinates}
                  pathOptions={{
                    color: '#1B4332',
                    weight: 5,
                    opacity: 0.85,
                    dashArray: mode === 'walking' ? '8, 8' : undefined,
                  }}
                />

                <AutoFitBounds points={routeData.route_coordinates} />
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#1B4332]/20 border-t-[#1B4332] rounded-full animate-spin" />
              </div>
            )}

            {/* Float transport mode selector inside map */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-stone-200/80 flex gap-1">
              <button
                type="button"
                onClick={() => setMode('driving')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  mode === 'driving'
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                Van/Car
              </button>
              <button
                type="button"
                onClick={() => setMode('motorcycle')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  mode === 'motorcycle'
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                Two-Wheeler
              </button>
              <button
                type="button"
                onClick={() => setMode('walking')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  mode === 'walking'
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                Walk
              </button>
            </div>
          </div>

          {/* Right Column: Route Metrics, FSSAI Food Safety Check & Steps */}
          <div className="lg:col-span-5 p-5 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Distance & Time Hero Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[11px] font-bold uppercase text-emerald-800 block mb-1">
                    Road Distance
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-emerald-950 font-heading">
                      {routeData?.distance_km ?? '--'}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">kilometers</span>
                  </div>
                </div>

                <div className="p-4 bg-stone-100 rounded-2xl border border-stone-200">
                  <span className="text-[11px] font-bold uppercase text-stone-500 block mb-1">
                    Estimated Transit
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-stone-900 font-heading">
                      {routeData?.duration_minutes ?? '--'}
                    </span>
                    <span className="text-xs font-semibold text-stone-600">minutes</span>
                  </div>
                </div>
              </div>

              {/* FSSAI 4-Hour Food Safety Compliance Gauge */}
              {routeData?.fssai_safety && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                    routeData.fssai_safety.status === 'OPTIMAL' || routeData.fssai_safety.status === 'SAFE'
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : routeData.fssai_safety.status === 'URGENT'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {routeData.fssai_safety.status === 'OPTIMAL' || routeData.fssai_safety.status === 'SAFE' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : routeData.fssai_safety.status === 'URGENT' ? (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>
                      {routeData.fssai_safety.status === 'OPTIMAL'
                        ? 'FSSAI Ambient Safety: Optimal Window'
                        : routeData.fssai_safety.status === 'URGENT'
                        ? 'FSSAI Ambient Safety: Urgent Window'
                        : 'FSSAI Ambient Safety Alert'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {routeData.fssai_safety.message}
                  </p>
                  {routeData.fssai_safety.minutes_remaining_after_transit !== null && (
                    <div className="pt-1 flex items-center justify-between text-[11px] font-semibold opacity-90">
                      <span>Post-Transit Safety Buffer:</span>
                      <span className="font-bold">
                        ~{routeData.fssai_safety.minutes_remaining_after_transit} minutes
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Destination Donor Logistics Card */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
                <span className="text-[11px] font-bold uppercase text-stone-400 block">
                  Donor Handover Dispatch
                </span>
                <div className="flex items-start gap-2 text-stone-800">
                  <Building2 className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block">{donation.donor_organization?.name}</strong>
                    <span className="text-stone-500 text-[11px]">{donation.collection_address}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-600">
                  <span>Storage: <strong className="text-stone-800">{donation.storage_condition}</strong></span>
                  <span>Contact: <strong className="text-stone-800">{donation.donor_contact_phone}</strong></span>
                </div>
              </div>

              {/* Turn-by-Turn Collapsible Section */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSteps(!showSteps)}
                  className="w-full px-4 py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#1B4332]" />
                    Turn-by-Turn Maneuvers ({routeData?.turn_by_turn?.length || 0} steps)
                  </span>
                  {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showSteps && (
                  <div className="max-h-48 overflow-y-auto divide-y divide-stone-100 p-2 text-xs">
                    {routeData?.turn_by_turn?.map((step, idx) => (
                      <div key={idx} className="py-2 px-2 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-stone-800 font-medium">{step.instruction}</p>
                          <div className="text-[11px] text-stone-400 mt-0.5 flex gap-2">
                            <span>{step.distance_km} km</span>
                            <span>•</span>
                            <span>~{step.duration_min} min</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={openGoogleMaps}
                className="flex-1 py-3 px-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Launch in Google Maps
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition-colors"
              >
                Close Planner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
