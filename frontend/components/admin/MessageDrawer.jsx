import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function MessageDrawer({
  isOpen,
  onClose,
  onSend,
  title,
  template,
  listingTitle,
  listingType,
  listingId,
  badgeType
}) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMessage(template || '');
    }
  }, [isOpen, template]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message, isOpen]);

  if (!isOpen || !mounted) return null;

  const badgeStyles = badgeType === 'REJECTION' 
    ? 'bg-red-50 text-red-700' 
    : 'bg-orange-50 text-orange-700';

  const modal = (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {/* Overlay click handler */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modale */}
      <div 
        className="bg-white rounded-2xl w-full max-w-[580px] max-h-[90vh] flex flex-col overflow-hidden relative z-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${badgeType === 'REJECTION' ? 'bg-red-500' : 'bg-orange-500'}`} />
            <h2 className="text-[15px] font-medium text-gray-900">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* Section textarea */}
          <div className="flex flex-col flex-1">
            <label className="text-[11px] text-gray-500 uppercase tracking-wide mb-1.5 font-semibold">
              Message
            </label>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none min-h-[400px] border border-gray-200 rounded-lg px-3.5 py-3 text-sm leading-[1.8] text-gray-800 focus:outline-none focus:border-[#2D5016] focus:ring-[3px] focus:ring-[#2D5016]/10 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
          <button 
            onClick={onClose}
            className="px-[18px] py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button 
            onClick={() => {
              onSend(message);
              onClose();
            }}
            className="px-5 py-2 text-sm font-medium text-white bg-[#2D5016] rounded-lg hover:bg-[#3a6b1e] transition-colors"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
