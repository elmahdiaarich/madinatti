'use client';

import { useState, useEffect } from 'react';
import { updateJournalistStatus } from '@/lib/adminApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const REJECT_REASONS = [
  { id: 'fake_identity',   label: 'Identité ou informations non vérifiables' },
  { id: 'no_credentials', label: 'Aucune expérience journalistique justifiée' },
  { id: 'quality',        label: "Qualité d'écriture insuffisante" },
  { id: 'tos',            label: "Non-conformité aux conditions d'utilisation" },
  { id: 'spam',           label: 'Tentative de spam ou contenu promotionnel' },
];

const SUSPEND_REASONS = [
  { id: 'abusive',        label: 'Contenu abusif ou articles répétés refusés' },
  { id: 'plagiarism',     label: 'Plagiat détecté' },
  { id: 'misinformation', label: 'Désinformation / fausses informations' },
  { id: 'tos',            label: "Violation des conditions d'utilisation" },
  { id: 'inactivity',     label: 'Compte inactif prolongé (nettoyage)' },
];

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6l-12 12" /><path d="M6 6l12 12" />
  </svg>
);

const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v4" />
    <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
    <path d="M12 16h.01" />
  </svg>
);

export default function JournalistActionModal({ isOpen, onClose, onSuccess, journalist, action }) {
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const isReject = action === 'REJECTED';
  const reasons = isReject ? REJECT_REASONS : SUSPEND_REASONS;
  const accentColor = isReject ? 'red' : 'orange';
  const title = isReject ? 'Refuser le compte journaliste' : 'Suspendre le compte journaliste';
  const confirmLabel = isReject ? 'Confirmer le refus' : 'Confirmer la suspension';

  useEffect(() => {
    if (isOpen) { setSelected([]); setNote(''); }
  }, [isOpen]);

  if (!isOpen || !journalist) return null;

  const toggle = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);

  const buildNote = () => {
    const reasonLines = reasons.filter((r) => selected.includes(r.id)).map((r) => `| ${r.label}`).join('\n');
    return [reasonLines, note.trim()].filter(Boolean).join('\n\n');
  };

  const handleConfirm = async () => {
    const adminNote = buildNote();
    if (!adminNote) { toast.error('Veuillez sélectionner au moins une raison.'); return; }
    setLoading(true);
    try {
      await updateJournalistStatus(journalist.id, action, adminNote, token);
      toast.success(isReject ? `Compte de ${journalist.name} refusé.` : `Compte de ${journalist.name} suspendu.`);
      onSuccess(action);
    } catch (e) {
      toast.error(`Erreur : ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const hasSelection = selected.length > 0 || note.trim().length > 0;
  const red = { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300', bgLight: 'bg-red-50', btnBg: 'bg-red-500 hover:bg-red-600', check: 'border-red-500 bg-red-500' };
  const orange = { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300', bgLight: 'bg-orange-50', btnBg: 'bg-orange-500 hover:bg-orange-600', check: 'border-orange-500 bg-orange-500' };
  const c = accentColor === 'red' ? red : orange;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
          <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0 ${c.text}`}><IconAlert /></div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 truncate mt-0.5">{journalist.name} | {journalist.email}</p>
            </div>
            <button onClick={onClose} disabled={loading} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"><IconX /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Raison(s) <span className="font-normal text-gray-400">(sélection multiple)</span></p>
              <div className="flex flex-col gap-2">
                {reasons.map((reason) => {
                  const checked = selected.includes(reason.id);
                  return (
                    <label key={reason.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 select-none ${checked ? `${c.border} ${c.bgLight} ${c.text}` : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100'}`}>
                      <span className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${checked ? c.check : 'border-gray-300 bg-white'}`}>
                        {checked && (<svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
                      </span>
                      <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(reason.id)} disabled={loading} />
                      <span className="text-sm font-medium">{reason.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Note complémentaire <span className="font-normal text-gray-400 ml-1">(envoyée au journaliste)</span></label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} disabled={loading} rows={3}
                placeholder="Précisez un motif personnalisé..."
                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 resize-none outline-none focus:border-[#2D5016] focus:bg-white focus:ring-2 focus:ring-[#A7D129]/20 disabled:opacity-50 transition-all" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
            <div className="text-xs text-gray-400">{selected.length > 0 ? `${selected.length} raison${selected.length > 1 ? 's' : ''} sélectionnée${selected.length > 1 ? 's' : ''}` : 'Sélectionnez au moins une raison'}</div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} disabled={loading} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40">Annuler</button>
              <button onClick={handleConfirm} disabled={loading || !hasSelection} className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white ${c.btnBg} transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2`}>
                {loading ? (<><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Traitement...</>) : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
