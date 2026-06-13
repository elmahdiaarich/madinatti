'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { realEstateService } from '@/services/realEstateService';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Reuse the same small sub-components from create page
const LISTING_TYPES = [{ label: 'Vente', value: 'SALE' }, { label: 'Location', value: 'RENT' }];
const PROPERTY_TYPES = [
  { label: 'Appartement', value: 'APARTMENT' }, { label: 'Villa', value: 'VILLA' },
  { label: 'Maison', value: 'HOUSE' }, { label: 'Studio', value: 'STUDIO' },
  { label: 'Terrain', value: 'LAND' }, { label: 'Bureau', value: 'OFFICE' },
  { label: 'Commerce', value: 'SHOP' },
];
const CITIES = ['Casablanca','Rabat','Kénitra','Tanger','Marrakech','Fès','Agadir','Oujda','Tétouan','Salé'];

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}
function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="w-1 h-5 rounded-full bg-primary inline-block" />
      <h2 className="font-bold text-gray-900 text-base">{children}</h2>
    </div>
  );
}
const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const selectCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white";

export default function EditListingPage() {
  return (
    <ProtectedRoute roles={['business']}>
      <EditForm />
    </ProtectedRoute>
  );
}

function EditForm() {
  const { id } = useParams();
  const { token } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await realEstateService.getMyListingById(id, token);
        const d = res.data;
        setForm({
          title: d.title || '',
          description: d.description || '',
          categoryId: d.categoryId || '',
          listingType: d.listingType || 'SALE',
          propertyType: d.propertyType || 'APARTMENT',
          price: d.price?.toString() || '',
          surface: d.surface?.toString() || '',
          rooms: d.rooms?.toString() || '',
          bathrooms: d.bathrooms?.toString() || '',
          floor: d.floor?.toString() || '',
          city: d.city || '',
          location: d.location || '',
          latitude: d.latitude?.toString() || '',
          longitude: d.longitude?.toString() || '',
          contactPhone: d.contactPhone || '',
          images: Array.isArray(d.images) ? d.images : [],
          features: d.features && typeof d.features === 'object' ? d.features : {},
        });
      } catch (e) {
        setError('Annonce introuvable ou accès refusé.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        price: form.price ? parseFloat(form.price) : undefined,
        surface: form.surface ? parseFloat(form.surface) : undefined,
        rooms: form.rooms ? parseInt(form.rooms) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
        floor: form.floor !== '' ? parseInt(form.floor) : undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      };
      await realEstateService.updateMyListing(id, payload, token);
      router.push('/my-space/services/real-estate');
    } catch (e) {
      setError(e.message || 'Erreur serveur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Chargement de l'annonce..." />;

  if (!form) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-extrabold text-primary-dark text-lg">Modifier l'annonce</h1>
          <span className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1 rounded-full font-semibold">
            ⚠ Re-soumise à validation
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Informations générales</SectionTitle>
          <Field label="Titre">
            <input value={form.title} onChange={e => set('title', e.target.value)} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type de transaction">
              <select value={form.listingType} onChange={e => set('listingType', e.target.value)} className={selectCls}>
                {LISTING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Type de bien">
              <select value={form.propertyType} onChange={e => set('propertyType', e.target.value)} className={selectCls}>
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={5} value={form.description} onChange={e => set('description', e.target.value)}
              className={`${inputCls} resize-none`} />
          </Field>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Prix & Surface</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prix (MAD)">
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Surface (m²)">
              <input type="number" value={form.surface} onChange={e => set('surface', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Pièces">
              <input type="number" value={form.rooms} onChange={e => set('rooms', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Salles de bain">
              <input type="number" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Étage">
              <input type="number" value={form.floor} onChange={e => set('floor', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Localisation</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ville">
              <select value={form.city} onChange={e => set('city', e.target.value)} className={selectCls}>
                <option value="">Sélectionner</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Adresse / Quartier">
              <input value={form.location} onChange={e => set('location', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude GPS">
              <input type="number" step="any" value={form.latitude} onChange={e => set('latitude', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Longitude GPS">
              <input type="number" step="any" value={form.longitude} onChange={e => set('longitude', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Contact</SectionTitle>
          <Field label="Téléphone">
            <input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} className={inputCls} />
          </Field>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">❌ {error}</div>
        )}

        <div className="flex gap-3">
          <button onClick={() => router.back()} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition text-sm">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3.5 bg-primary text-white font-extrabold rounded-xl hover:bg-primary-sage transition text-sm disabled:opacity-60">
            {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400">La modification remet l'annonce en attente de validation.</p>
      </div>
    </div>
  );
}