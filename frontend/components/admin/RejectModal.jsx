"use client";

/**
 * components/admin/RejectModal.jsx
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { rejectListing } from "@/lib/adminApi";

const PRESET_REASONS = [
  { id: "inappropriate", label: "Contenu inapproprié ou offensant" },
  { id: "incomplete",    label: "Informations manquantes ou incomplètes" },
  { id: "misleading",   label: "Description fausse ou trompeuse" },
  { id: "duplicate",    label: "Annonce en double" },
  { id: "tos",          label: "Non conforme aux conditions d'utilisation" },
];

const TABS = [
  { key: "reasons", label: "Raisons" },
  { key: "message", label: "Message entreprise" },
];

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6l-12 12" /><path d="M6 6l12 12" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v4" />
    <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
    <path d="M12 16h.01" />
  </svg>
);

const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6l9 -6" />
  </svg>
);

function buildMessage({ companyName, listingTitle, module, selectedReasons, customNote }) {
  const moduleLabel = module === "emploi" ? "offre d'emploi" : "annonce immobilière";
  const salutation  = companyName ? `Bonjour ${companyName},` : "Bonjour,";

  const reasonLines = PRESET_REASONS
    .filter((r) => selectedReasons.includes(r.id))
    .map((r) => `  • ${r.label}`)
    .join("\n");

  const reasonsBlock = reasonLines
    ? `Après examen, votre ${moduleLabel} a été refusée pour les raisons suivantes :\n\n${reasonLines}`
    : `Après examen, votre ${moduleLabel} a été refusée.`;

  const customBlock = customNote?.trim() ? `\n\n${customNote.trim()}` : "";

  return `${salutation}

Suite à la soumission de votre ${moduleLabel} intitulée "${listingTitle || "votre annonce"}", nous avons procédé à une vérification de son contenu.

${reasonsBlock}${customBlock}

Nous vous invitons à corriger les points mentionnés et à soumettre à nouveau votre annonce.

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe Madinatti`;
}

export default function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  listingId,
  listingTitle,
  listing,
  module,
}) {
  const [activeTab, setActiveTab]   = useState("reasons");
  const [selected, setSelected]     = useState([]);
  const [customNote, setCustomNote] = useState("");
  const [message, setMessage]       = useState("");
  const [loading, setLoading]       = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const companyName =
    listing?.submittedBy  ||
    listing?.company      ||
    listing?.companyName  ||
    "";

  const rebuildMessage = useCallback(() => {
    setMessage(buildMessage({ companyName, listingTitle, module, selectedReasons: selected, customNote }));
  }, [companyName, listingTitle, module, selected, customNote]);

  // Reset à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setActiveTab("reasons");
      setSelected([]);
      setCustomNote("");
      setLoading(false);
      setMessage(buildMessage({ companyName, listingTitle, module, selectedReasons: [], customNote: "" }));
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild live
  useEffect(() => { rebuildMessage(); }, [selected, customNote, rebuildMessage]);

  if (!isOpen) return null;

  const toggleReason = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const adminNote = PRESET_REASONS
        .filter((r) => selected.includes(r.id))
        .map((r) => `• ${r.label}`)
        .join("\n") + (customNote.trim() ? `\n\n${customNote.trim()}` : "");

      // PATCH /api/admin/listings/:id/reject  body: { adminNote, messageToSend }
      await rejectListing(
        listingId,
        adminNote || "Annonce refusée par l'administrateur.",
        message,   // messageToSend → BusinessMessage + Notification
        token,
      );

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
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600">
              <IconAlertTriangle />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Motif du refus</h2>
              {listingTitle && <p className="text-sm text-gray-500 truncate mt-0.5">{listingTitle}</p>}
            </div>
            <button onClick={onClose} disabled={loading}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40">
              <IconX />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-6">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5
                  ${activeTab === tab.key ? "border-red-500 text-red-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                {tab.key === "message" && <IconMail />}
                {tab.label}
                {tab.key === "message" && selected.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* Onglet Raisons */}
            {activeTab === "reasons" && (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Raisons <span className="font-normal text-gray-400">(sélection multiple)</span>
                  </p>
                  <div className="flex flex-col gap-2">
                    {PRESET_REASONS.map((reason) => {
                      const checked = selected.includes(reason.id);
                      return (
                        <label key={reason.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer
                            transition-all duration-150 select-none
                            ${checked ? "border-red-300 bg-red-50 text-red-800" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100"}`}>
                          <span className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                            ${checked ? "border-red-500 bg-red-500" : "border-gray-300 bg-white"}`}>
                            {checked && (
                              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <input type="checkbox" className="sr-only" checked={checked}
                            onChange={() => toggleReason(reason.id)} disabled={loading} />
                          <span className="text-sm font-medium">{reason.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Note interne — ne sera PAS envoyée à l'entreprise */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Note interne
                    <span className="font-normal text-gray-400 ml-1">(non visible par l'entreprise)</span>
                  </label>
                  <textarea value={customNote} onChange={(e) => setCustomNote(e.target.value)}
                    disabled={loading} rows={3}
                    placeholder="Précisez des détails internes à l'équipe admin..."
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm
                      placeholder:text-gray-400 resize-none outline-none
                      focus:border-[#2D5016] focus:bg-white focus:ring-2 focus:ring-[#A7D129]/20
                      disabled:opacity-50 transition-all" />
                </div>

                {/* Hint vers onglet message */}
                {selected.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                    <IconMail />
                    <span>
                      {selected.length} raison{selected.length > 1 ? "s" : ""} ajoutée{selected.length > 1 ? "s" : ""} au message —{" "}
                      <button onClick={() => setActiveTab("message")}
                        className="font-semibold underline underline-offset-2 hover:text-blue-900">
                        voir le message
                      </button>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Onglet Message entreprise */}
            {activeTab === "message" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Message envoyé à l'entreprise</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Visible dans Dashboard → Messages &amp; Notifications
                    </p>
                  </div>
                  {companyName && (
                    <span className="shrink-0 text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                      À : {companyName}
                    </span>
                  )}
                </div>

                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  disabled={loading} rows={16}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm
                    text-gray-800 leading-relaxed resize-none outline-none
                    focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100
                    disabled:opacity-50 transition-all font-mono" />

                <p className="text-xs text-gray-400 text-right">
                  {message.length} caractères · modifiable librement
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
            <div className="text-xs text-gray-400">
              {selected.length > 0
                ? `${selected.length} raison${selected.length > 1 ? "s" : ""} sélectionnée${selected.length > 1 ? "s" : ""}`
                : "Sélectionnez au moins une raison"
              }
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} disabled={loading}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100
                  hover:bg-gray-200 transition-colors disabled:opacity-40">
                Annuler
              </button>
              <button onClick={handleConfirm} disabled={loading || !hasSelection}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500
                  hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Traitement...
                  </>
                ) : "Confirmer le refus"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}