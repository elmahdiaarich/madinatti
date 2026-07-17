// frontend/components/admin/ConfirmModal.jsx
"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

export default function ConfirmModal({
  title,
  description,
  confirmLabel = "Supprimer",
  onConfirm,
  onClose,
  loading = false,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 size={16} />
                  {confirmLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}