import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Radio, 
  Car, 
  Bike, 
  Building2, 
  Clock, 
  ShieldCheck, 
  Thermometer, 
  Flame, 
  Layers, 
  RefreshCw, 
  LocateFixed, 
  Navigation, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ExternalLink,
  Utensils
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { routeApi } from '../api/client';
import type { Donation } from '../types';
import { RescueRouteModal } from '../components/RescueRouteModal';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// Custom icons
const createDonationIcon = (category: string, isUrgent: boolean) => {
  let emoji = '🍲';
  let bgColor = '#DC2626';
  if (category === 'BAKERY_AND_BREAD') { emoji = '🥖'; bgColor = '#D97706'; }
  else if (category === 'FRESH_PRODUCE') { emoji = '🥗'; bgColor = '#16A34A'; }
  else if (category === 'PACKAGED_GOODS') { emoji = '📦'; bgColor = '#2563EB'; }
  else if (category === 'DAIRY_PRODUCTS') { emoji = '🥛'; bgColor = '#0284C7'; }

  const ringHtml = isUrgent
    ? `<span style="position: absolute; top: -5px; right: -5px; width: 14px; height: 14px; border-radius: 50%; background-color: #EF4444; border: 2px solid white; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
    : '';

  return new L.DivIcon({
    html: `<div style="position: relative; background-color: ${bgColor}; width: 38px; height: 38px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer;">
      ${emoji}
      ${ringHtml}
    </div>`,
    className: 'live-donation-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

const ngoIcon = new L.DivIcon({
  html: `<div style="background-color: #1B4332; width: 36px; height: 36px; border-radius: 12px; border: 3px solid white; box-shadow: 0 4px 12px rgba(27,67,50,0.45); display: flex; align-items: center; justify-content: center; color: white; font-size: 17px; cursor: pointer;">
    🏢
  </div>`,
  className: 'live-ngo-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const vehicleVanIcon = new L.DivIcon({
  html: `<div style="background-color: #0284C7; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(2,132,199,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; cursor: pointer;">
    🚐
  </div>`,
  className: 'live-courier-van',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const vehicleBikeIcon = new L.DivIcon({
  html: `<div style="background-color: #7C3AED; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(124,58,237,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 17px; cursor: pointer;">
    🛵
  </div>`,
  className: 'live-courier-bike',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const userBeaconIcon = new L.DivIcon({
  html: `<div style="position: relative; width: 24px; height: 24px; background: #059669; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 16px rgba(5, 150, 105, 0.9);">
    <div style="position: absolute; transform: scale(2.4); width: 100%; height: 100%; border-radius: 50%; background: rgba(5, 150, 105, 0.25); animation: ping 2s infinite;"></div>
  </div>`,
  className: 'live-user-beacon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Helper component for map programmatic flight
const MapController: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
};

export const LiveMapPage: React.FC = () => {
  const [radarData, setRadarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [zoomLevel, setZoomLevel] = useState(13);

  // Layers toggle
  const [showCouriers, setShowCouriers] = useState(true);
  const [showDonations, setShowDonations] = useState(true);
  const [showNGOs, setShowNGOs] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [mapStyle, setMapStyle] = useState<'standard' | 'dark' | 'humanitarian'>('standard');

  // Sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'donations' | 'couriers'>('donations');

  // Selected for Route or Focus
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [routeModalDonation, setRouteModalDonation] = useState<Donation | null>(null);

  // User location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchRadar = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await routeApi.getLiveRadar();
      setRadarData(res.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
      if (!silent) toast.error('Failed to connect to live rescue radar.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar();
    // Live heartbeat polling every 10 seconds
    const interval = setInterval(() => {
      fetchRadar(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAcquireGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    toast.loading('Acquiring high-accuracy GPS coordinates...', { id: 'radar-gps' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('radar-gps');
        toast.success('Radar centered on your live GPS position!');
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMapCenter(coords);
        setUserLocation({ lat: coords[0], lng: coords[1] });
      },
      (err) => {
        toast.dismiss('radar-gps');
        toast.error(`GPS Error: ${err.message}`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const getTileUrl = () => {
    if (mapStyle === 'dark') {
      return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
    if (mapStyle === 'humanitarian') {
      return 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
    }
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  };

  const formatCountdown = (totalSec: number) => {
    if (totalSec <= 0) return 'Expired';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m remaining`;
    return `${mins}m ${secs}s remaining`;
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-stone-900 text-stone-100 font-sans">
      {/* Top Operations Header Bar */}
      <div className="h-14 bg-stone-950/95 border-b border-stone-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE RADAR
          </div>
          <span className="text-sm font-extrabold tracking-wide font-heading text-white hidden sm:inline">
            Bengaluru Food Rescue Operations Mesh
          </span>
          <span className="text-xs text-stone-400 hidden lg:inline">
            • Auto-syncing live every 10s
          </span>
        </div>

        {/* Live Metrics Counters */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden md:flex items-center gap-4 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
            <span className="text-stone-400">
              Surplus: <strong className="text-emerald-400">{radarData?.metrics?.total_portions_available ?? 0} portions</strong>
            </span>
            <span className="text-stone-400">
              Active Couriers: <strong className="text-sky-400">{radarData?.metrics?.active_couriers_in_transit ?? 0} moving</strong>
            </span>
            <span className="text-stone-400">
              NGO Hubs: <strong className="text-amber-400">{radarData?.metrics?.verified_ngos_active ?? 0} verified</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchRadar(false)}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-colors"
            title="Refresh Radar Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Body: Map Canvas & Collapsible Control Sidebar */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Left Floating Sidebar */}
        <div
          className={`absolute top-0 bottom-0 left-0 z-30 transition-all duration-300 ease-in-out flex ${
            sidebarOpen ? 'w-80 sm:w-96' : 'w-0'
          }`}
        >
          <div className="w-full h-full bg-stone-900/95 backdrop-blur-xl border-r border-stone-800 flex flex-col shadow-2xl overflow-hidden">
            {/* Tab switch */}
            <div className="p-3 bg-stone-950/80 border-b border-stone-800 flex gap-2">
              <button
                onClick={() => setActiveTab('donations')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'donations'
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'text-stone-400 hover:text-white bg-stone-800/50'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                Surplus Stream ({radarData?.active_donations?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('couriers')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'couriers'
                    ? 'bg-sky-700 text-white shadow-sm'
                    : 'text-stone-400 hover:text-white bg-stone-800/50'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                Live Couriers ({radarData?.active_couriers?.length || 0})
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {activeTab === 'donations' ? (
                radarData?.active_donations && radarData.active_donations.length > 0 ? (
                  radarData.active_donations.map((d: any) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSelectedEntity(d);
                        setMapCenter([d.latitude, d.longitude]);
                      }}
                      className="p-3.5 rounded-2xl bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/40">
                            {d.category.replace(/_/g, ' ')}
                          </span>
                          <h4 className="font-bold text-xs text-white mt-1 group-hover:text-emerald-400 transition-colors">
                            {d.title}
                          </h4>
                          <p className="text-[11px] text-stone-400 mt-0.5">{d.donor_name}</p>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-400 font-heading">
                          {d.remaining_quantity} {d.unit}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-stone-700/50 flex items-center justify-between text-[11px] text-stone-400">
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Clock className="w-3 h-3" />
                          {formatCountdown(d.seconds_remaining)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRouteModalDonation(d);
                          }}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors"
                        >
                          <Navigation className="w-3 h-3" /> Route
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-stone-500 text-xs">
                    No active listings in current radar window.
                  </div>
                )
              ) : (
                radarData?.active_couriers && radarData.active_couriers.length > 0 ? (
                  radarData.active_couriers.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedEntity(c);
                        setMapCenter([c.current_lat, c.current_lng]);
                      }}
                      className="p-3.5 rounded-2xl bg-stone-800/80 hover:bg-stone-800 border border-sky-800/40 transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-900/60 text-sky-300 border border-sky-700/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                          {c.vehicle_type}
                        </span>
                        <span className="text-[11px] font-bold text-sky-400">
                          ETA ~{c.eta_minutes}m
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-white group-hover:text-sky-300 transition-colors">
                          {c.driver_name}
                        </h4>
                        <p className="text-[11px] text-stone-300 mt-0.5 font-medium">
                          Cargo: {c.cargo}
                        </p>
                      </div>

                      {/* Transit Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-stone-400">
                          <span>{c.origin_name}</span>
                          <span>{c.destination_name}</span>
                        </div>
                        <div className="w-full bg-stone-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${c.progress_percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-stone-700/50 flex items-center justify-between text-[10px] text-stone-400">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <Thermometer className="w-3 h-3 text-red-400" />
                          {c.temperature_celsius}°C ({c.safety_status.replace(/_/g, ' ')})
                        </span>
                        <span className="text-sky-300 font-bold">{c.progress_percent}% En Route</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-stone-500 text-xs">
                    No active rescue dispatches currently in transit.
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Toggle Button for Left Sidebar */}
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute top-4 z-30 p-2 bg-stone-900/90 text-white rounded-r-xl border-y border-r border-stone-700 shadow-xl transition-all ${
            sidebarOpen ? 'left-80 sm:left-96' : 'left-0'
          }`}
          title={sidebarOpen ? 'Hide stream' : 'Show stream'}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Floating Map Layer & Basemap Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          {/* Basemap Style Switcher */}
          <div className="bg-stone-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-stone-800 shadow-xl flex gap-1 text-[11px] font-bold">
            <button
              onClick={() => setMapStyle('standard')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                mapStyle === 'standard' ? 'bg-[#1B4332] text-white shadow' : 'text-stone-400 hover:text-white'
              }`}
            >
              OSM Light
            </button>
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                mapStyle === 'dark' ? 'bg-[#1B4332] text-white shadow' : 'text-stone-400 hover:text-white'
              }`}
            >
              🌙 Dark Ops
            </button>
            <button
              onClick={() => setMapStyle('humanitarian')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                mapStyle === 'humanitarian' ? 'bg-[#1B4332] text-white shadow' : 'text-stone-400 hover:text-white'
              }`}
            >
              Clean
            </button>
          </div>

          {/* Layer toggles */}
          <div className="bg-stone-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-stone-800 shadow-xl space-y-1.5 text-xs">
            <span className="font-bold text-[10px] uppercase tracking-wider text-stone-500 block mb-1">
              Active Map Layers
            </span>
            <label className="flex items-center gap-2 text-stone-300 hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showCouriers}
                onChange={(e) => setShowCouriers(e.target.checked)}
                className="rounded accent-sky-500"
              />
              <span className="flex items-center gap-1.5">
                🚗 Live Couriers
              </span>
            </label>
            <label className="flex items-center gap-2 text-stone-300 hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showDonations}
                onChange={(e) => setShowDonations(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span className="flex items-center gap-1.5">
                🍲 Surplus Listings
              </span>
            </label>
            <label className="flex items-center gap-2 text-stone-300 hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showNGOs}
                onChange={(e) => setShowNGOs(e.target.checked)}
                className="rounded accent-emerald-600"
              />
              <span className="flex items-center gap-1.5">
                🏢 Verified NGO Hubs
              </span>
            </label>
            <label className="flex items-center gap-2 text-stone-300 hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showHotspots}
                onChange={(e) => setShowHotspots(e.target.checked)}
                className="rounded accent-red-500"
              />
              <span className="flex items-center gap-1.5">
                🔥 Surplus Hotspots
              </span>
            </label>
          </div>

          {/* Quick GPS button */}
          <button
            type="button"
            onClick={handleAcquireGPS}
            className="p-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-2xl shadow-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors"
          >
            <LocateFixed className="w-4 h-4" />
            <span className="hidden sm:inline">My Location</span>
          </button>
        </div>

        {/* Map Canvas */}
        <div className="w-full h-full">
          <MapContainer
            center={mapCenter}
            zoom={zoomLevel}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url={getTileUrl()}
            />

            <MapController center={mapCenter} zoom={zoomLevel} />

            {/* User GPS beacon */}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userBeaconIcon}>
                <Popup>
                  <div className="p-1 text-xs text-stone-900">
                    <strong>📍 Your Live GPS Point</strong>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Hotspots */}
            {showHotspots &&
              radarData?.hotspots?.map((h: any, idx: number) => (
                <Circle
                  key={idx}
                  center={[h.lat, h.lng]}
                  radius={1200}
                  pathOptions={{
                    color: '#EF4444',
                    fillColor: '#EF4444',
                    fillOpacity: 0.12,
                    weight: 1.5,
                    dashArray: '3, 6',
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs text-stone-900">
                      <strong className="block text-red-700 font-bold">🔥 Surplus Food Generation Hotspot</strong>
                      <span>{h.name}</span>
                      <p className="text-[11px] text-stone-600 mt-1">
                        Avg daily rescue potential: <strong>~{h.daily_rescued_kg} kg</strong>
                      </p>
                    </div>
                  </Popup>
                </Circle>
              ))}

            {/* Active Couriers */}
            {showCouriers &&
              radarData?.active_couriers?.map((c: any) => (
                <React.Fragment key={c.id}>
                  <Marker
                    position={[c.current_lat, c.current_lng]}
                    icon={c.mode === 'motorcycle' ? vehicleBikeIcon : vehicleVanIcon}
                  >
                    <Popup maxWidth={260}>
                      <div className="p-1.5 space-y-2 text-stone-900 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold text-[10px]">
                            {c.vehicle_type}
                          </span>
                          <span className="font-bold text-sky-700">ETA: {c.eta_minutes} min</span>
                        </div>
                        <h4 className="font-bold text-sm">{c.driver_name}</h4>
                        <p className="text-stone-600 text-[11px]">
                          <strong>Cargo:</strong> {c.cargo}
                        </p>
                        <div className="p-2 bg-stone-50 rounded-xl border border-stone-200 text-[11px] space-y-1">
                          <div>From: <strong>{c.origin_name}</strong></div>
                          <div>To: <strong>{c.destination_name}</strong></div>
                          <div className="pt-1 border-t border-stone-200 text-emerald-800 font-semibold flex items-center gap-1">
                            <Thermometer className="w-3.5 h-3.5 text-red-500" />
                            {c.temperature_celsius}°C • {c.safety_status.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Draw live route line for active courier */}
                  <Polyline
                    positions={[c.origin_coords, [c.current_lat, c.current_lng], c.destination_coords]}
                    pathOptions={{
                      color: c.mode === 'motorcycle' ? '#7C3AED' : '#0284C7',
                      weight: 4,
                      opacity: 0.7,
                      dashArray: '6, 6',
                    }}
                  />
                </React.Fragment>
              ))}

            {/* Verified NGO Hubs */}
            {showNGOs &&
              radarData?.ngo_hubs?.map((org: any) => (
                <Marker
                  key={org.id}
                  position={[org.latitude, org.longitude]}
                  icon={ngoIcon}
                >
                  <Popup maxWidth={260}>
                    <div className="p-1 text-stone-900 text-xs space-y-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#1B4332] font-bold text-[10px] inline-block">
                        Verified Community Kitchen / Shelter
                      </span>
                      <h4 className="font-bold text-sm">{org.name}</h4>
                      <p className="text-stone-500 text-[11px]">{org.address}, {org.city}</p>
                      <div className="pt-1 border-t border-stone-200 text-[11px] text-stone-600">
                        Daily Capacity: <strong>{org.capacity?.servings_per_day || 250} meals/day</strong>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Published Donations */}
            {showDonations &&
              radarData?.active_donations?.map((d: any) => {
                const isUrgent = d.seconds_remaining < 7200;
                return (
                  <Marker
                    key={d.id}
                    position={[d.latitude, d.longitude]}
                    icon={createDonationIcon(d.category, isUrgent)}
                  >
                    <Popup maxWidth={260}>
                      <div className="p-1.5 text-stone-900 text-xs space-y-2">
                        {d.image_url && (
                          <div className="h-24 w-full rounded-lg overflow-hidden bg-stone-100">
                            <img src={d.image_url} alt={d.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {d.category.replace(/_/g, ' ')}
                          </span>
                          <h4 className="font-bold text-sm mt-1">{d.title}</h4>
                          <p className="text-stone-600 text-[11px]">{d.donor_name}</p>
                        </div>
                        <div className="pt-1.5 border-t border-stone-200 flex justify-between items-center text-[11px]">
                          <span className="font-bold text-emerald-800">
                            {d.remaining_quantity} {d.unit} available
                          </span>
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatCountdown(d.seconds_remaining)}
                          </span>
                        </div>
                        <div className="pt-1 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRouteModalDonation(d)}
                            className="flex-1 py-1.5 bg-[#1B4332] text-white rounded-lg text-center font-bold text-[10px] flex items-center justify-center gap-1"
                          >
                            <Navigation className="w-3 h-3" />
                            Route Planner
                          </button>
                          <Link
                            to={`/donations/${d.id}`}
                            className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-center font-bold text-[10px]"
                          >
                            Claim Food
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>
        </div>
      </div>

      {/* Rescue Route Modal when triggered from live map */}
      {routeModalDonation && (
        <RescueRouteModal
          isOpen={!!routeModalDonation}
          onClose={() => setRouteModalDonation(null)}
          donation={routeModalDonation}
          initialOrigin={userLocation ? { lat: userLocation.lat, lng: userLocation.lng, label: 'Your Current GPS Position' } : undefined}
        />
      )}
    </div>
  );
};
