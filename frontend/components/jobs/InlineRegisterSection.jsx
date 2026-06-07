'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { cities } from 'morocco-cities';

// ─── Villes par région ────────────────────────────────────────────────────────
const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

// ─── Composant ────────────────────────────────────────────────────────────────
export default function InlineRegisterSection({ jobTitle }) {
  const router = useRouter();
  const { register } = useAuth();

  const [role, setRoleState] = useState('citizen');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', city: '',
    companyName: '', companyWebsite: '',
  });
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const isBusiness = role === 'business';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSwitch = (r) => {
    setRoleState(r);
    if (r !== 'business') {
      setFormData((prev) => ({ ...prev, companyName: '', companyWebsite: '' }));
      setCompanyLogoFile(null);
      setCompanyLogoPreview(null);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompanyLogoFile(file);
      setCompanyLogoPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    if (!formData.name) return 'Nom requis';
    if (!formData.email.includes('@')) return 'Email invalide';
    if (formData.password.length < 6) return 'Mot de passe trop court (min. 6 caractères)';
    if (!formData.phone) return 'Téléphone requis';
    if (!formData.city) return 'Ville requise';
    if (isBusiness && !formData.companyName) return 'Nom de la société requis';
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
      data.append('role', role);
      if (isBusiness) {
        data.append('companyName', formData.companyName);
        data.append('companyWebsite', formData.companyWebsite);
        if (companyLogoFile) data.append('companyLogo', companyLogoFile);
      }
      const res = await register(data);
      if (res.token) router.push('/');
      else setError(res.message || "Erreur lors de l'inscription");
    } catch {
      setError('Erreur serveur, réessayez plus tard');
    } finally {
      setLoading(false);
    }
  };

  const perkscitoyen = [
    'Candidature en 1 clic',
    'Alertes emploi personnalisées',
    'CV sauvegardé et réutilisable',
    'Suivi de vos candidatures',
  ];
  const perksBusiness = [
    'Mise en avant des annonces',
    'Publications illimitées',
    'Accès à une base de talents',
    'Visibilité prioritaire',
  ];
  const perks = isBusiness ? perksBusiness : perkscitoyen;

  return (
    <section
      className="rounded-3xl overflow-hidden shadow-2xl"
      style={{ background: 'linear-gradient(135deg, #2D5016 0%, #3a6b1e 55%, #A7D129 100%)' }}
    >
      {/* Header */}
      <div className="px-8 pt-10 pb-7">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
          style={{ background: 'rgba(167,209,41,0.18)', border: '1px solid rgba(167,209,41,0.4)', color: '#A7D129' }}
        >
          ✦ Madinatti
        </span>
        <h2 className="text-3xl font-extrabold text-white leading-tight mb-2">
          {isBusiness
            ? <>Publiez votre annonce,<br />trouvez les bons profils</>
            : <>Créez votre compte,<br />postulez en 1 minute</>
          }
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {isBusiness
            ? "Rejoignez des centaines d'entreprises qui recrutent sur Madinatti"
            : 'Rejoignez des milliers de candidats qui ont trouvé leur prochaine opportunité'
          }
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

      {/* Form card */}
      <div className="mx-5 mb-5 bg-white rounded-2xl p-7">
        <p className="text-[#2D5016] font-bold text-base mb-5">Créer mon compte</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Role toggle */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7BA428] mb-1.5">Je suis</p>
          <div className="grid grid-cols-2 border-2 border-[#2D5016] rounded-xl overflow-hidden">
            {[{ v: 'citizen', label: '👤 Citoyen' }, { v: 'business', label: '🏢 Entreprise' }].map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => handleRoleSwitch(v)}
                className={`py-2.5 text-sm font-bold transition-colors ${role === v ? 'bg-[#2D5016] text-white' : 'bg-white text-[#2D5016]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="name" placeholder="Nom complet *" onChange={handleChange} className="input-green" />
            <input name="phone" placeholder="Téléphone *" onChange={handleChange} className="input-green" />
          </div>

          <input name="email" type="email" placeholder="Email *" onChange={handleChange} className="input-green" />

          {/* Password */}
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

          {/* Région + Ville */}
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

          {/* Business fields */}
          {isBusiness && (
            <div className="bg-[#E8F5D0] border border-[#A7D129]/40 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7BA428]">Informations entreprise</p>
              <input
                name="companyName"
                placeholder="Nom de l'entreprise *"
                onChange={handleChange}
                className="input-green bg-white"
              />
              <input
                name="companyWebsite"
                placeholder="Site web (optionnel)"
                onChange={handleChange}
                className="input-green bg-white"
              />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7BA428] mb-2">Logo</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border-2 border-[#A7D129]/40 bg-white flex items-center justify-center overflow-hidden">
                    {companyLogoPreview
                      ? <img src={companyLogoPreview} alt="Logo" className="w-full h-full object-contain" />
                      : <span className="text-xl">🏢</span>}
                  </div>
                  <label className="text-sm text-[#2D5016] font-semibold underline underline-offset-2 cursor-pointer hover:text-[#7BA428]">
                    {companyLogoPreview ? 'Changer' : 'Ajouter le logo'}
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Terms */}
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
            {loading
              ? 'Création du compte...'
              : isBusiness
                ? 'Créer mon compte entreprise ✦'
                : 'Créer mon compte et postuler ✦'
            }
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
