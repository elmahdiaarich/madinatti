'use client';
import { useState } from 'react';

// ─── Labels ───────────────────────────────────────────────────────────────────
const EDUCATION_LABELS = {
  BEFORE_BAC: 'Avant Bac', BAC: 'Bac', BAC_PLUS_1: 'Bac+1',
  BAC_PLUS_2: 'Bac+2', BAC_PLUS_3: 'Bac+3', BAC_PLUS_4: 'Bac+4',
  BAC_PLUS_5_PLUS: 'Bac+5',
};
const EXPERIENCE_LABELS = {
  STUDENT_FRESH_GRAD: 'Jeune diplômé', JUNIOR_LESS_2: '< 2 ans',
  MID_2_TO_5: '2–5 ans', SENIOR_5_TO_10: '5–10 ans', EXPERT_PLUS_10: '+10 ans',
};
const CONTRACT_COLORS = {
  CDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CDD: 'bg-blue-50 text-blue-700 border-blue-200',
  STAGE: 'bg-violet-50 text-violet-700 border-violet-200',
  FREELANCE: 'bg-amber-50 text-amber-700 border-amber-200',
  INTERIM: 'bg-orange-50 text-orange-700 border-orange-200',
  ALTERNANCE: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  ANAPEC: 'bg-teal-50 text-teal-700 border-teal-200',
  TEMPS_PARTIEL: 'bg-pink-50 text-pink-700 border-pink-200',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatSalary(min, max) {
  const hasMin = min != null && Number(min) > 0;
  const hasMax = max != null && Number(max) > 0;
  if (!hasMin && !hasMax) return null;
  const fmt = (v) => Number(v).toLocaleString('fr-MA');
  if (hasMin && hasMax) return `${fmt(min)} – ${fmt(max)} MAD/mois`;
  if (hasMin) return `À partir de ${fmt(min)} MAD/mois`;
  return `Jusqu'à ${fmt(max)} MAD/mois`;
}

function formatAge(date) {
  if (!date) return null;
  const diff = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (diff === 0) return "Mis à jour aujourd'hui";
  if (diff === 1) return 'Mis à jour hier';
  if (diff < 7) return `Mis à jour il y a ${diff} j`;
  if (diff < 30) return `Il y a ${Math.floor(diff / 7)} sem.`;
  return `Il y a ${Math.floor(diff / 30)} mois`;
}

// ─── Anonymous avatar (locked) ────────────────────────────────────────────────
function AnonAvatar() {
  return (
    <div className="w-11 h-11 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  );
}

// ─── Real avatar (unlocked) ───────────────────────────────────────────────────
const GRADIENTS = [
  ['#1e3a5f', '#2563eb'], ['#7f1d1d', '#dc2626'], ['#14532d', '#16a34a'],
  ['#3b0764', '#7c3aed'], ['#1c1917', '#57534e'], ['#7c2d12', '#ea580c'],
];
function getGradient(str = '') {
  const n = (str.charCodeAt(0) || 0) + (str.charCodeAt(1) || 0);
  return GRADIENTS[n % GRADIENTS.length];
}
function RealAvatar({ name, avatar }) {
  const [from, to] = getGradient(name);
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
  if (avatar) {
    return (
      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-[#A7D129]/60">
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 border-2 border-[#A7D129]/60"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      {initials}
    </div>
  );
}

// ─── Availability badge ───────────────────────────────────────────────────────
function AvailBadge({ isAvailable, availableFrom }) {
  if (isAvailable) {
    return (
      <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        ✅ Disponible
      </span>
    );
  }
  const dateStr = availableFrom
    ? new Date(availableFrom).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    : null;
  return (
    <span className="shrink-0 text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
      {dateStr ? `Dispo. le ${dateStr}` : 'Prochainement'}
    </span>
  );
}

// ─── Salary box ───────────────────────────────────────────────────────────────
function SalaryBox({ salary }) {
  if (!salary) return null;
  return (
    <div className="flex items-center gap-2 bg-[#f0faf0] rounded-xl px-3 py-2 border border-[#A7D129]/30">
      <svg className="w-3.5 h-3.5 text-[#2D5016] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="font-bold text-[#2D5016] text-sm">{salary}</p>
    </div>
  );
}

// ─── Contract pills ───────────────────────────────────────────────────────────
function ContractPills({ types = [] }) {
  if (!types.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {types.map(t => (
        <span key={t} className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${CONTRACT_COLORS[t] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

// ─── Language pills ───────────────────────────────────────────────────────────
function LanguagePills({ languages = [] }) {
  if (!languages.length) return null;
  return (
    <div className="flex flex-wrap gap-1 items-center">
      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      {languages.map(l => (
        <span key={l} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
          {l}
        </span>
      ))}
    </div>
  );
}

// ─── Inline unlock confirmation ────────────────────────────────────────────────
function UnlockConfirm({ balance, unlocking, onConfirm, onCancel }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col gap-2.5 animate-fade-in">
      <p className="text-sm font-semibold text-amber-800 text-center">Confirmer le déblocage ?</p>
      <p className="text-xs text-amber-600 text-center">
        1 crédit sera consommé
        {balance !== null && ` · Solde : ${balance} → ${balance - 1}`}
      </p>
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2 border border-amber-200 rounded-lg text-amber-700 text-xs font-semibold hover:bg-amber-100 transition">
          Annuler
        </button>
        <button onClick={onConfirm} disabled={unlocking}
          className="flex-1 py-2 bg-[#2D5016] text-white rounded-lg text-xs font-bold hover:bg-[#3a6b1e] transition disabled:opacity-60">
          {unlocking ? '⏳ ...' : '✓ Confirmer'}
        </button>
      </div>
    </div>
  );
}

// ─── CandidateCard ────────────────────────────────────────────────────────────
export default function CandidateCard({ candidate, onUnlock, unlocking, balance }) {
  const [confirming, setConfirming] = useState(false);
  const isUnlocked = candidate.isUnlocked;

  const salary = formatSalary(candidate.desiredSalaryMin, candidate.desiredSalaryMax);
  const age = formatAge(candidate.updatedAt);
  const education = EDUCATION_LABELS[candidate.educationLevel];
  const experience = EXPERIENCE_LABELS[candidate.experienceLevel];

  const handleConfirm = () => { setConfirming(false); onUnlock(candidate); };

  // ── UNLOCKED STATE ────────────────────────────────────────────────────────
  if (isUnlocked) {
    return (
      <div className="bg-white border-2 border-[#A7D129] rounded-2xl p-5 flex flex-col gap-3.5 shadow-sm shadow-[#A7D129]/10">

        {/* Header */}
        <div className="flex items-start gap-3">
          <RealAvatar name={candidate.name} avatar={candidate.avatar} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 text-[15px] leading-tight">{candidate.name}</p>
              <AvailBadge isAvailable={candidate.isAvailableForWork} availableFrom={candidate.availableFrom} />
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              <a href={`mailto:${candidate.email}`}
                className="text-xs text-blue-600 hover:underline truncate" onClick={e => e.stopPropagation()}>
                ✉️ {candidate.email}
              </a>
              {candidate.phone && (
                <a href={`tel:${candidate.phone}`}
                  className="text-xs text-gray-500 hover:underline" onClick={e => e.stopPropagation()}>
                  📞 {candidate.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Headline */}
        {candidate.headline && (
          <p className="text-sm text-gray-600 italic leading-relaxed border-l-2 border-[#A7D129]/40 pl-3">
            {candidate.headline}
          </p>
        )}

        {/* Education + Experience + City */}
        {(education || experience || candidate.city) && (
          <div className="flex flex-wrap gap-1.5">
            {education && <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">🎓 {education}</span>}
            {experience && <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">💼 {experience}</span>}
            {candidate.city && <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">📍 {candidate.city}</span>}
          </div>
        )}

        <ContractPills types={candidate.desiredContractTypes} />
        <LanguagePills languages={candidate.languages} />
        <SalaryBox salary={salary} />

        {/* CV CTA */}
        {candidate.cvUrl ? (
          <a href={candidate.cvUrl} target="_blank" rel="noreferrer"
            className="mt-auto w-full text-center py-2.5 bg-[#2D5016] text-white font-bold rounded-xl
              hover:bg-[#3a6b1e] transition text-sm flex items-center justify-center gap-2">
            📄 Voir le CV complet
          </a>
        ) : (
          <p className="text-xs text-gray-400 text-center italic mt-auto">CV non fourni par le candidat</p>
        )}
      </div>
    );
  }

  // ── LOCKED STATE ──────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3.5
      hover:border-gray-300 transition-colors">

      {/* Header */}
      <div className="flex items-start gap-3">
        <AnonAvatar />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono font-bold text-gray-500 text-xs tracking-wide">{candidate.reference}</p>
            <AvailBadge isAvailable={candidate.isAvailableForWork} availableFrom={candidate.availableFrom} />
          </div>
          {age && <p className="text-[11px] text-gray-400 mt-0.5">{age}</p>}
        </div>
      </div>

      {/* Headline — main visible info, entices unlock */}
      {candidate.headline && (
        <p className="text-sm text-gray-700 italic leading-snug line-clamp-2">
          "{candidate.headline}"
        </p>
      )}

      {/* Education + Experience + City chips */}
      {(education || experience || candidate.city) && (
        <div className="flex flex-wrap gap-1.5">
          {education && <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-600">🎓 {education}</span>}
          {experience && <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-600">💼 {experience}</span>}
          {candidate.city && <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-600">📍 {candidate.city}</span>}
        </div>
      )}

      <ContractPills types={candidate.desiredContractTypes} />
      <LanguagePills languages={candidate.languages} />

      {/* Salary — key unlock trigger, highlighted */}
      <SalaryBox salary={salary} />

      {/* Unlock CTA / Inline confirmation */}
      <div className="mt-auto">
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            disabled={unlocking}
            className="w-full py-2.5 bg-[#2D5016] text-white font-bold rounded-xl
              hover:bg-[#3a6b1e] active:scale-[.98] transition text-sm disabled:opacity-60
              flex items-center justify-center gap-2">
            {unlocking ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Déblocage...
              </span>
            ) : (
              <>
                🔓 Débloquer le profil
                <span className="opacity-75 text-xs font-normal">· 1 crédit</span>
              </>
            )}
          </button>
        ) : (
          <UnlockConfirm
            balance={balance}
            unlocking={unlocking}
            onConfirm={handleConfirm}
            onCancel={() => setConfirming(false)}
          />
        )}
      </div>
    </div>
  );
}