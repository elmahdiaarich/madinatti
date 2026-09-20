'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { cities } from 'morocco-cities';
import { isStrongPassword, PASSWORD_MESSAGE } from '@/lib/passwordPolicy.mjs';

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

// Mini-jobs est réservé aux citoyens — pas de toggle citoyen/entreprise ici,
// contrairement à InlineRegisterSection des jobs.
export default function InlineRegisterSection() {
  const router = useRouter();
  const { register } = useAuth();

  const [selectedRegion, setSelectedRegion] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', city: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.name) return 'Nom requis';
    if (!formData.email.includes('@')) return 'Email invalide';
    if (!isStrongPassword(formData.password)) return PASSWORD_MESSAGE;
    if (!formData.phone) return 'Téléphone requis';
    if (!formData.city) return 'Ville requise';
    if (!agreed) return "Veuillez accepter les conditions d'utilisation";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('password', formData.password);
      data.append('phone', formData.phone);
      data.append('city', formData.city);
      data.append('role', 'citizen');
      const res = await register(data);
      if (res.token) router.push('/mini-jobs');
      else setError(res.message || "Erreur lors de l'inscription");
    } catch {
      setError('Erreur serveur, réessayez plus tard');
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    'Créez votre profil prestataire',
    'Publiez vos demandes de services',
    'Contactez directement par téléphone',
    'Avis vérifiés après chaque prestation',
  ];

  return (
    <section
      className="rounded-3xl overflow-hidden shadow-2xl"
      style={{ background: 'linear-gradient(135deg, #2D5016 0%, #3a6b1e 55%, #A7D129 100%)' }}
    >
      <div className="px-8 pt-10 pb-7">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
          style={{ background: 'rgba(167,209,41,0.18)', border: '1px solid rgba(167,209,41,0.4)', color: '#A7D129' }}
        >
          ✦ Mini-jobs
        </span>
        <h2 className="text-3xl font-extrabold text-white leading-tight mb-2">
          Créez votre compte,<br />trouvez ou proposez un service
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Rejoignez la communauté Madinatti pour réserver un prestataire ou publier vos propres compétences
        </p>
        <div className="grid grid-cols-2 gap-2 mt-5">
          {perks.map((p) => (
            <div
              key={p}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#A7D129] shrink-0" />
              {p}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-5 mb-5 bg-white rounded-2xl p-7">
        <p className="text-[#2D5016] font-bold text-base mb-5">Créer mon compte</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="name" placeholder="Nom complet *" onChange={handleChange} className="input-green" />
            <input name="phone" placeholder="Téléphone *" onChange={handleChange} className="input-green" />
          </div>

          <input name="email" type="email" placeholder="Email *" onChange={handleChange} className="input-green" />

          <div className="relative">
            <input
              name="password"
              type={showPw ? 'text' : 'password'}
              placeholder="Mot de passe * (min. 6 caractères)"
              onChange={handleChange}
              className="input-green w-full pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D5016] text-sm font-bold"
            >
              {showPw ? '🙈' : '👁'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              className="input-green"
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setFormData((p) => ({ ...p, city: '' }));
              }}
            >
              <option value="">Choisir une région *</option>
              {Object.keys(citiesByRegion).sort().map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              name="city"
              className="input-green"
              value={formData.city}
              onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
              disabled={!selectedRegion}
            >
              <option value="">Choisir une ville *</option>
              {selectedRegion && citiesByRegion[selectedRegion]?.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#2D5016] shrink-0"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              J'accepte les{' '}
              <Link href="/cgu" className="text-[#2D5016] font-semibold hover:underline">
                Conditions Générales d'Utilisation
              </Link>{' '}
              de Madinatti
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#2D5016] text-white font-extrabold rounded-full text-sm tracking-wide hover:bg-[#A7D129] hover:text-[#2D5016] transition-all duration-200 hover:scale-[1.01] active:scale-100 disabled:opacity-60"
          >
            {loading ? 'Création du compte...' : 'Créer mon compte ✦'}
          </button>

          <p className="text-center text-xs text-gray-400">
            Déjà membre ?{' '}
            <Link href="/auth/login" className="text-[#2D5016] font-bold hover:underline">
              Me connecter
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
