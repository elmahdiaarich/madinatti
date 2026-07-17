'use client';

export default function ConfirmModal({
  open,
  title = 'Confirmer',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-base font-extrabold text-gray-900">{title}</h3>
          {message && <p className="text-sm text-gray-500 mt-1.5">{message}</p>}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#2D5016] hover:bg-[#A7D129] hover:text-[#2D5016]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}