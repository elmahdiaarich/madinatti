'use client';
import CvDownload from '@/components/shared/CvDownload';

import { useState, useEffect } from 'react';
import { GraduationCap, Briefcase, MapPin, Languages, Heart, Clock, Lock, FileText, CheckCircle2, X } from 'lucide-react';

const EDUCATION_LABELS = {
  BEFORE_BAC: 'Qualification avant Bac', BAC: 'Bac', BAC_PLUS_1: 'Bac+1', BAC_PLUS_2: 'Bac+2',
  BAC_PLUS_3: 'Bac+3', BAC_PLUS_4: 'Bac+4', BAC_PLUS_5_PLUS: 'Bac+5 et plus',
};
const EXPERIENCE_LABELS = {
  STUDENT_FRESH_GRAD: 'Étudiant, jeune diplômé', JUNIOR_LESS_2: 'Débutant < 2 ans',
  MID_2_TO_5: 'Entre 2 et 5 ans', SENIOR_5_TO_10: 'Entre 5 et 10 ans', EXPERT_PLUS_10: '> 10 ans',
};

function formatRelative(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 30) return `il y a ${days} j`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

function MetaRow({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Icon size={14} className="text-gray-400 shrink-0" />
      <span className="truncate">{children}</span>
    </div>
  );
}

export default function CandidateCard({ candidate, onUnlock, unlocking, onSaveNotes, savingNotes, onToggleFavorite, togglingFavorite }) {
  const isUnlocked = candidate.isUnlocked;
  const [notesDraft, setNotesDraft] = useState(candidate.notes || '');
  const [notesDirty, setNotesDirty] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  useEffect(() => {
    setNotesDraft(candidate.notes || '');
    setNotesDirty(false);
  }, [candidate.notes, candidate.id]);

  const freshness = formatRelative(candidate.updatedAt);

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-shadow hover:shadow-md ${
        isUnlocked ? 'border-gray-100' : 'border-gray-100'
      }`}
    >
      {/* Top accent bar — signale le statut débloqué/non débloqué en un coup d'œil */}
      <div className={`h-1 ${isUnlocked ? 'bg-[#A7D129]' : 'bg-gray-200'}`} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
                  <button
            type="button"
            onClick={() => isUnlocked && candidate.avatar && setPhotoOpen(true)}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center shrink-0 overflow-hidden transition ${
              isUnlocked ? 'bg-[#E8F5D0] border-2 border-[#A7D129]/50' : 'border border-gray-200'
            } ${isUnlocked && candidate.avatar ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
            style={
              !isUnlocked
                ? {
                    backgroundImage:
                      'repeating-linear-gradient(-45deg, #F1F0EC, #F1F0EC 3px, #E4E2DB 3px, #E4E2DB 6px)',
                  }
                : undefined
            }
            title={!isUnlocked ? 'Identité masquée avant déblocage' : candidate.avatar ? 'Voir la photo en grand' : undefined}
          >
            {isUnlocked ? (
              candidate.avatar ? (
                <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-bold text-[#2D5016]">{candidate.name?.charAt(0)?.toUpperCase() || '?'}</span>
              )
            ) : (
              <span className="w-6 h-6 rounded-full bg-white/80 border border-gray-300 flex items-center justify-center">
                <Lock size={11} className="text-gray-500" />
              </span>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-gray-900 text-[15px] leading-snug truncate">
                {isUnlocked ? candidate.name : candidate.reference}
              </p>
              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(candidate)}
                  disabled={togglingFavorite}
                  title={candidate.isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <Heart
                    size={16}
                    className={candidate.isFavorited ? 'text-red-500' : 'text-gray-300'}
                    fill={candidate.isFavorited ? 'currentColor' : 'none'}
                  />
                </button>
              )}
            </div>
            {isUnlocked && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{candidate.email}{candidate.phone ? ` · ${candidate.phone}` : ''}</p>
            )}
          </div>
        </div>

        {(candidate.category || candidate.currentPosition) && (
          <p className="text-sm font-semibold text-[#2D5016] -mt-1">
            {candidate.currentPosition || candidate.category?.name}
            {candidate.currentPosition && candidate.category ? <span className="text-gray-400 font-normal"> · {candidate.category.name}</span> : null}
          </p>
        )}

        {candidate.headline && (
          <p className="text-sm text-gray-700 italic line-clamp-2 -mt-1">{candidate.headline}</p>
        )}

        {/* Status row */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${
              candidate.isAvailableForWork
                ? 'text-green-700 bg-green-50 border border-green-200'
                : 'text-gray-500 bg-gray-50 border border-gray-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${candidate.isAvailableForWork ? 'bg-green-500' : 'bg-gray-400'}`} />
            {candidate.isAvailableForWork
              ? 'Disponible'
              : candidate.availableFrom
              ? `Dès le ${new Date(candidate.availableFrom).toLocaleDateString('fr-FR')}`
              : 'Non disponible'}
          </span>
          <div className="flex items-center gap-1.5">
            {candidate.updatedAt && (Date.now() - new Date(candidate.updatedAt).getTime()) / 86400000 <= 2 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#A7D129]/20 text-[#2D5016]">
                Nouveau
              </span>
            )}
            {freshness && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400" title="Dernière mise à jour du profil">
                <Clock size={11} /> {freshness}
              </span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-1.5 pt-1">
          <MetaRow icon={GraduationCap}>{EDUCATION_LABELS[candidate.educationLevel]}</MetaRow>
          <MetaRow icon={Briefcase}>{EXPERIENCE_LABELS[candidate.experienceLevel]}</MetaRow>
          <MetaRow icon={MapPin}>{candidate.city}</MetaRow>
          <MetaRow icon={Languages}>{Array.isArray(candidate.languages) && candidate.languages.length > 0 ? candidate.languages.join(', ') : null}</MetaRow>
        </div>

        {Array.isArray(candidate.skills) && candidate.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidate.skills.slice(0, 6).map((s) => (
              <span key={s} className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#E8F5D0] text-[#2D5016] border border-[#A7D129]/40">
                {s}
              </span>
            ))}
          </div>
        )}

        {Array.isArray(candidate.desiredContractTypes) && candidate.desiredContractTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidate.desiredContractTypes.map((t) => (
              <span key={t} className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Footer — pousse en bas de carte pour aligner les hauteurs dans la grille */}
        <div className="mt-auto pt-2 flex flex-col gap-3">
          {isUnlocked ? (
            <>
             {candidate.cvUrl ? (
                <CvDownload candidateId={candidate.id}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2D5016] text-white font-bold rounded-xl hover:bg-[#3a6b1e] transition text-sm"
                >
                  <FileText size={15} /> Voir le CV
                </CvDownload>
              ) : (
                <p className="text-xs text-gray-400 text-center italic">CV non fourni</p>
              )}
              {candidate.portfolioUrl && (
                <a
                  href={candidate.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center text-xs font-semibold text-[#2D5016] hover:underline"
                >
                  🔗 Voir le portfolio / LinkedIn
                </a>
              )}

              {onSaveNotes && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Note privée</label>
                  <textarea
                    value={notesDraft}
                    onChange={(e) => { setNotesDraft(e.target.value); setNotesDirty(true); }}
                    placeholder="Ex: contacté le 12/08, dispo dans 2 mois..."
                    rows={2}
                    maxLength={1000}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#A7D129]/40 focus:border-[#2D5016] transition resize-none"
                  />
                  {notesDirty && (
                    <button
                      onClick={() => { onSaveNotes(candidate.id, notesDraft); setNotesDirty(false); }}
                      disabled={savingNotes}
                      className="self-end inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg bg-[#2D5016] text-white hover:bg-[#3a6b1e] transition disabled:opacity-60"
                    >
                      <CheckCircle2 size={12} /> {savingNotes ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => onUnlock(candidate)}
              disabled={unlocking}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2D5016] text-white font-bold rounded-xl hover:bg-[#3a6b1e] transition text-sm disabled:opacity-60"
            >
              <Lock size={14} />
              {unlocking ? 'Déblocage...' : 'Débloquer le profil'}
              {!unlocking && <span className="text-[10px] font-normal opacity-80 ml-0.5">· 1 crédit</span>}
            </button>
          )}
        </div>
      </div>

      {photoOpen && candidate.avatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setPhotoOpen(false)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPhotoOpen(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
            >
              <X size={22} />
            </button>
            <img
              src={candidate.avatar}
              alt={candidate.name}
              className="w-full aspect-square object-cover rounded-2xl border-4 border-white"
            />
            <p className="text-center text-white font-semibold mt-3">{candidate.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}