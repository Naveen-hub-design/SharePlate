import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { donationApi, aiApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { FoodCategory } from '../types';
import { 
  Camera, 
  Sparkles, 
  Upload, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Thermometer, 
  Info,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const ALLERGEN_OPTIONS = [
  'Milk / Dairy',
  'Gluten / Wheat',
  'Peanuts',
  'Tree Nuts',
  'Eggs',
  'Soybeans',
  'Fish',
  'Crustaceans / Shellfish',
  'Mustard',
  'Sesame',
];

const STORAGE_CONDITIONS = [
  { value: 'AMBIENT', label: 'Ambient / Room Temperature (Max 4h for cooked meals)' },
  { value: 'REFRIGERATED', label: 'Refrigerated (&lt; 5°C)' },
  { value: 'HOT_HOLDING', label: 'Hot Holding (&gt; 60°C)' },
  { value: 'FROZEN', label: 'Frozen (&lt; -18°C)' },
];

export const CreateDonationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isVerified } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FoodCategory>('COOKED_MEALS');
  const [quantity, setQuantity] = useState<number>(25);
  const [unit, setUnit] = useState('portions');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Times
  const defaultPrepTime = new Date().toISOString().slice(0, 16);
  const defaultDeadline = new Date(Date.now() + 3.5 * 3600 * 1000).toISOString().slice(0, 16);
  const [cookedAt, setCookedAt] = useState(defaultPrepTime);
  const [availableFrom, setAvailableFrom] = useState(defaultPrepTime);
  const [deadline, setDeadline] = useState(defaultDeadline);

  // Safety & Storage
  const [storageCondition, setStorageCondition] = useState('AMBIENT');
  const [temperature, setTemperature] = useState<string>('24');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Location & Contact
  const [address, setAddress] = useState(user?.organization?.address_line || 'MG Road, Bangalore');
  const [lat, setLat] = useState(user?.organization?.latitude?.toString() || '12.9716');
  const [lng, setLng] = useState(user?.organization?.longitude?.toString() || '77.5946');
  const [phone, setPhone] = useState(user?.organization?.contact_phone || user?.phone || '+91 98765 43210');
  const [contactEmail, setContactEmail] = useState(user?.organization?.contact_email || user?.email || '');

  // Safety confirmation
  const [safetyChecklistConfirmed, setSafetyChecklistConfirmed] = useState(false);

  // Loading states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [analyzingAiPhoto, setAnalyzingAiPhoto] = useState(false);
  const [suggestingAiListing, setSuggestingAiListing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Handle Photo selection
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    // Upload to server
    setUploadingImage(true);
    try {
      const res = await donationApi.uploadImage(file);
      setImageUrl(res.data.url);
      toast.success('Food photo uploaded successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Photo upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  // AI Food Photo Assistant
  const handleAnalyzePhotoWithAI = async () => {
    if (!imageFile) {
      toast.error('Please upload a food photo first to run AI photo analysis.');
      return;
    }
    setAnalyzingAiPhoto(true);
    try {
      const res = await aiApi.analyzePhoto(imageFile);
      const data = res.data;

      if (data.suggested_category) {
        setCategory(data.suggested_category as FoodCategory);
      }
      if (data.suggested_title && !title) {
        setTitle(data.suggested_title);
      }
      if (data.suggested_description) {
        setDescription(data.suggested_description);
      }
      if (data.suggested_allergens && Array.isArray(data.suggested_allergens)) {
        setSelectedAllergens((prev) => Array.from(new Set([...prev, ...data.suggested_allergens])));
      }

      toast.success('AI photo analysis complete! Please verify suggested details.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'AI photo analysis unavailable. Using manual entry.');
    } finally {
      setAnalyzingAiPhoto(false);
    }
  };

  // AI Listing Assistant
  const handleSuggestListingWithAI = async () => {
    if (!title.trim()) {
      toast.error('Please enter a brief title or food name first.');
      return;
    }
    setSuggestingAiListing(true);
    try {
      const res = await aiApi.suggestListing({
        title,
        category,
        partial_description: description,
        notes: specialInstructions,
      });

      const data = res.data;
      if (data.enhanced_description) {
        setDescription(data.enhanced_description);
      }
      if (data.collection_instructions) {
        setSpecialInstructions(data.collection_instructions);
      }
      toast.success('AI suggestions applied! Review details before saving.');
    } catch (err: any) {
      toast.error('AI assistant unavailable. You may continue manual editing.');
    } finally {
      setSuggestingAiListing(false);
    }
  };

  const toggleAllergen = (item: string) => {
    if (selectedAllergens.includes(item)) {
      setSelectedAllergens(selectedAllergens.filter((a) => a !== item));
    } else {
      setSelectedAllergens([...selectedAllergens, item]);
    }
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title.trim() || !description.trim() || !address.trim()) {
      toast.error('Please fill in title, description, and collection address.');
      return;
    }

    if (status === 'PUBLISHED' && !safetyChecklistConfirmed) {
      toast.error('You must certify the food safety checklist before publishing a live listing.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        quantity: Number(quantity),
        unit,
        image_url: imageUrl || undefined,
        cooked_or_prepared_at: cookedAt ? new Date(cookedAt).toISOString() : undefined,
        storage_condition: storageCondition,
        storage_temperature_celsius: temperature ? parseFloat(temperature) : undefined,
        is_perishable: ['COOKED_MEALS', 'DAIRY_PRODUCTS', 'RAW_MEAT_OR_SEAFOOD'].includes(category),
        allergens: selectedAllergens,
        collection_address: address.trim(),
        latitude: parseFloat(lat) || 12.9716,
        longitude: parseFloat(lng) || 77.5946,
        available_from: new Date(availableFrom).toISOString(),
        collection_deadline: new Date(deadline).toISOString(),
        special_handling_instructions: specialInstructions.trim() || undefined,
        donor_contact_phone: phone.trim(),
        donor_contact_email: contactEmail.trim(),
        status,
      };

      const res = await donationApi.create(payload);
      toast.success(
        status === 'PUBLISHED'
          ? 'Surplus listing published! Recipient NGOs have been notified.'
          : 'Donation saved as draft.'
      );
      navigate('/donor/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save donation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Top Bar */}
      <button
        onClick={() => navigate('/donor/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#1B4332] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Donor Hub
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
            Commercial Food Rescue
          </span>
          <h1 className="text-3xl font-extrabold text-stone-900 mt-2 font-heading">
            Create Surplus Listing
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-0.5">
            List surplus inventory with AI tagging assistance and FSSAI safety compliance checks.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Photo Upload & AI Photo Assistant Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-600" />
              1. Food Photo & AI Visual Recognition
            </h3>
            {imageFile && (
              <button
                type="button"
                onClick={handleAnalyzePhotoWithAI}
                disabled={analyzingAiPhoto}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {analyzingAiPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing Visuals...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Auto-Tag Photo
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            <div className="sm:col-span-4">
              {imagePreview ? (
                <div className="relative h-44 rounded-2xl overflow-hidden border border-stone-200 group">
                  <img
                    src={imagePreview}
                    alt="Food preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-44 rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#1B4332] bg-stone-50 hover:bg-stone-100/50 flex flex-col items-center justify-center cursor-pointer transition-colors p-4 text-center"
                >
                  <Upload className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-xs font-bold text-stone-700">Upload Food Photo</span>
                  <span className="text-[10px] text-stone-400 mt-1">PNG, JPG up to 10MB</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            <div className="sm:col-span-8 space-y-2 text-xs text-stone-600">
              <p className="font-semibold text-stone-800">
                Snap a clear photograph of the prepared food trays or packaged items.
              </p>
              <p>
                Our server-side AI model inspects the image to recommend the category, allergens, and description. In accordance with safety policies, AI suggestions never replace human food safety verification.
              </p>
              {uploadingImage && (
                <p className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading image to storage...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Basic Details & AI Listing Assistant */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1B4332]" />
              2. Food Details & Quantity
            </h3>
            <button
              type="button"
              onClick={handleSuggestListingWithAI}
              disabled={suggestingAiListing}
              className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {suggestingAiListing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              )}
              AI Listing Assistant
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Item Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Steamed Basmati Rice & Paneer Butter Masala (3 Trays)"
                className="w-full p-3 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-sm font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Food Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FoodCategory)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs bg-white font-medium"
                >
                  <option value="COOKED_MEALS">Cooked Meals (4h ambient limit)</option>
                  <option value="BAKERY_AND_BREAD">Bakery & Bread</option>
                  <option value="FRESH_PRODUCE">Fresh Produce</option>
                  <option value="PACKAGED_GOODS">Packaged Goods</option>
                  <option value="DAIRY_PRODUCTS">Dairy Products</option>
                  <option value="BEVERAGES">Beverages</option>
                  <option value="RAW_MEAT_OR_SEAFOOD">Raw Meat / Seafood</option>
                  <option value="FROZEN_ITEMS">Frozen Items</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Quantity Available *
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Measurement Unit *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs bg-white"
                >
                  <option value="portions">portions / meals</option>
                  <option value="kg">kilograms (kg)</option>
                  <option value="trays">catering trays</option>
                  <option value="boxes">boxes / containers</option>
                  <option value="liters">liters</option>
                  <option value="units">units / pieces</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Description & Ingredients *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail ingredients, cooking method, freshness notes, and packaging type..."
                className="w-full p-3 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs leading-relaxed"
                required
              />
            </div>
          </div>
        </div>

        {/* FSSAI Food Safety, Temperature & Ambient Window */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              3. FSSAI Food Safety, Storage & Timing
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Strict compliance with the Food Safety and Standards (Recovery of Surplus Food) Regulations, 2019.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Storage Method *
              </label>
              <select
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs bg-white"
              >
                {STORAGE_CONDITIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Storage Temperature (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="24"
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Preparation / Cooking Timestamp *
              </label>
              <input
                type="datetime-local"
                value={cookedAt}
                onChange={(e) => setCookedAt(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Strict Collection Deadline *
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
                required
              />
            </div>
          </div>

          {/* Allergen Checkbox Matrix */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Mandatory Allergen Disclosures (Select all present)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALLERGEN_OPTIONS.map((alg) => {
                const checked = selectedAllergens.includes(alg);
                return (
                  <button
                    key={alg}
                    type="button"
                    onClick={() => toggleAllergen(alg)}
                    className={`p-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                      checked
                        ? 'bg-amber-100/80 border-amber-400 text-amber-900 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {checked ? '✓ ' : '+ '} {alg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collection Instructions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Special Handling & Pickup Instructions (Optional)
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Enter via Service Gate 2, bring thermal insulated carrier vessels"
              className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
            />
          </div>
        </div>

        {/* Location & Contact Information */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
            <MapPin className="w-4 h-4 text-[#1B4332]" />
            4. Pickup Location & Contact Coordination
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Collection Address Line *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Donor Contact Phone *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Donor Contact Email *
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
                required
              />
            </div>
          </div>
        </div>

        {/* Food Safety Certification Checklist */}
        <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-300 space-y-3">
          <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            Mandatory Food Donor Safety Pledge
          </h4>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={safetyChecklistConfirmed}
              onChange={(e) => setSafetyChecklistConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-700 rounded accent-[#1B4332]"
            />
            <span className="text-xs text-emerald-950 leading-relaxed">
              I certify that this food was prepared under hygienic conditions, has been held at safe temperatures, is uncontaminated, properly packaged in food-grade materials, and complies with FSSAI Surplus Food Regulations (2019).
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Listing...
              </>
            ) : (
              'Publish Food Donation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
