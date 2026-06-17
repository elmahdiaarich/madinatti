/**
 * components/admin/RejectModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal "Motif du refus" — opens when admin clicks "Refuser" on a listing.
 *
 * Props:
 *  isOpen       — boolean
 *  onClose      — () => void
 *  onConfirm    — (newStatus: string) => void   called after successful API call
 *  listingId    — string
 *  listingTitle — string  (shown in header)
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";


import { useState, useEffect, useRef } from "react";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { updateListingStatus } from '@/lib/adminApi';

// ── Predefined rejection reasons ──────────────────────────────────────────────
const PRESET_REASONS = [
  { id: "inappropriate", label: "Contenu inapproprié ou offensant" },
  { id: "incomplete", label: "Informations manquantes ou incomplètes" },
  { id: "misleading", label: "Description fausse ou trompeuse" },
  { id: "duplicate", label: "Annonce en double" },
  { id: "tos", label: "Non conforme aux conditions d'utilisation" },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconX = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 9v4" />
    <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
    <path d="M12 16h.01" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function RejectModal({ isOpen, onClose, onConfirm, listingId, listingTitle , module }) {
  const [selected, setSelected] = useState([]);
  const [customNote, setCustomNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth()
  const { toast } = useToast()

  const currentReasonsRef = useRef('[Complétez le motif de refus ici]')

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {

      setSelected([]);
      setCustomNote("");
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Toggle a preset reason ────────────────────────────────────────────────
  const toggleReason = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  // ── Build final note string ───────────────────────────────────────────────
  const buildNote = () => {
    const presetLabels = PRESET_REASONS.filter((r) =>
      selected.includes(r.id),
    ).map((r) => `• ${r.label}`);

    const parts = [];
    if (presetLabels.length > 0) parts.push(presetLabels.join("\n"));
    if (customNote.trim()) parts.push(customNote.trim());

    return parts.join("\n\n");
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const note = buildNote() || "Annonce refusée par l'administrateur.";
      await updateListingStatus(listingId, "REJECTED", note, token, module );
      onConfirm("REJECTED");
    } catch (e) {
      console.error(e);
      toast.error(`Erreur : ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const hasSelection = selected.length > 0 || customNote.trim().length > 0;

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* ── Modal panel ─────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600">
              <IconAlertTriangle />
            </div>
            <div className="flex-1 min-w-0">

              <h2 className="text-lg font-bold text-gray-900">
                Motif du refus
              </h2>
              {listingTitle && (
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {listing.title}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
            >
              <IconX />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            {/* Preset reasons */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Raisons (sélection multiple)
              </p>
              <div className="flex flex-col gap-2">
                {PRESET_REASONS.map((reason) => {
                  const checked = selected.includes(reason.id);
                  return (
                    <label
                      key={reason.id}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer
                        transition-all duration-150 select-none
                        ${
                          checked
                            ? "border-red-300 bg-red-50 text-red-800"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100"
                        }
                      `}
                    >
                      {/* Custom checkbox */}
                      <span
                        className={`
                        shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                        ${checked ? "border-red-500 bg-red-500" : "border-gray-300 bg-white"}
                      `}
                      >
                        {checked && (
                          <svg
                            width="9"
                            height="7"
                            viewBox="0 0 9 7"
                            fill="none"
                          >
                            <path
                              d="M1 3.5L3.5 6L8 1"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleReason(reason.id)}
                        disabled={loading}
                      />
                      <span className="text-sm font-medium">
                        {reason.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Custom note */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Note personnalisée
                <span className="font-normal text-gray-400 ml-1">
                  (envoyée à l'entreprise)
                </span>
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                disabled={loading}
                placeholder="Précisez les éléments à corriger ou les raisons supplémentaires..."
                rows={8}
                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800
                  placeholder:text-gray-400 resize-none outline-none
                  focus:border-[#2D5016] focus:bg-white focus:ring-2 focus:ring-[#A7D129]/20
                  disabled:opacity-50 transition-all"
              />

              <p className="text-xs text-gray-400 mt-2 text-right">
                {customNote.length} caractères
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100
                hover:bg-gray-200 transition-colors disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || !hasSelection}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500
                hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Traitement...
                </>
              ) : (
                "Confirmer le refus"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}