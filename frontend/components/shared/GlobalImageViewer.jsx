'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Maximize2, Minus, Plus, RotateCcw, X } from 'lucide-react';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function imageFromElement(img) {
  return {
    src: img.currentSrc || img.src,
    alt: img.alt || 'Image',
    naturalWidth: img.naturalWidth || null,
    naturalHeight: img.naturalHeight || null,
  };
}

function isInteractiveImage(img) {
  return Boolean(
    img.closest('[data-no-image-viewer], a, button, [role="button"], input, label, select, textarea'),
  );
}

function pageImages() {
  if (typeof document === 'undefined') return [];
  const seen = new Set();
  return Array.from(document.images)
    .filter((img) => img.src && !isInteractiveImage(img))
    .map(imageFromElement)
    .filter((img) => {
      if (!img.src || seen.has(img.src)) return false;
      seen.add(img.src);
      return true;
    });
}

export default function GlobalImageViewer() {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState(true);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [loadedSize, setLoadedSize] = useState(null);
  const dragRef = useRef(null);

  const active = images[index] || null;

  const resetView = useCallback(() => {
    setZoom(1);
    setFitMode(true);
    setPan({ x: 0, y: 0 });
  }, []);

  const openAtImage = useCallback((img) => {
    const all = pageImages();
    const clicked = imageFromElement(img);
    const nextImages = all.length ? all : [clicked];
    const nextIndex = Math.max(0, nextImages.findIndex((item) => item.src === clicked.src));
    setImages(nextImages);
    setIndex(nextIndex);
    setLoadedSize({
      width: clicked.naturalWidth,
      height: clicked.naturalHeight,
    });
    resetView();
    setOpen(true);
  }, [resetView]);

  useEffect(() => {
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.target?.closest?.('[data-image-viewer="open"]')) return;
      const img = event.target?.closest?.('img');
      if (!img || !img.src || isInteractiveImage(img)) return;
      event.preventDefault();
      event.stopPropagation();
      openAtImage(img);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [openAtImage]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === '+') {
        setFitMode(false);
        setZoom((value) => clamp(value + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
      }
      if (event.key === '-') {
        setFitMode(false);
        setZoom((value) => clamp(value - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
      }
      if (event.key === '0') resetView();
      if (event.key === 'ArrowLeft') setIndex((value) => (value - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight') setIndex((value) => (value + 1) % images.length);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [images.length, open, resetView]);

  useEffect(() => {
    if (!active?.src) return;
    setLoadedSize(active.naturalWidth && active.naturalHeight
      ? { width: active.naturalWidth, height: active.naturalHeight }
      : null);
  }, [active?.src, active?.naturalWidth, active?.naturalHeight]);

  const dimensions = useMemo(() => {
    if (!loadedSize?.width || !loadedSize?.height) return 'Dimensions inconnues';
    return `${loadedSize.width} x ${loadedSize.height}px`;
  }, [loadedSize]);

  if (!open || !active) return null;

  const go = (delta) => {
    if (images.length <= 1) return;
    setIndex((value) => (value + delta + images.length) % images.length);
    resetView();
  };

  const setZoomed = (next) => {
    setFitMode(false);
    setZoom((value) => clamp(typeof next === 'function' ? next(value) : next, MIN_ZOOM, MAX_ZOOM));
  };

  const onWheel = (event) => {
    event.preventDefault();
    setZoomed((value) => value + (event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP));
  };

  const onPointerDown = (event) => {
    if (fitMode && zoom === 1) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, pan };
  };

  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    setPan({ x: dragRef.current.pan.x + dx, y: dragRef.current.pan.y + dy });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col bg-black/95 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Visionneuse image"
      data-image-viewer="open"
    >
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{active.alt}</p>
          <p className="text-xs text-white/55">{dimensions} - {Math.round(zoom * 100)}%</p>
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton label="Zoom moins" onClick={() => setZoomed((value) => value - ZOOM_STEP)}>
            <Minus size={17} />
          </ToolbarButton>
          <ToolbarButton label="Zoom plus" onClick={() => setZoomed((value) => value + ZOOM_STEP)}>
            <Plus size={17} />
          </ToolbarButton>
          <ToolbarButton label="Taille reelle" onClick={() => { setFitMode(false); setZoomed(1); setPan({ x: 0, y: 0 }); }}>
            <Maximize2 size={17} />
          </ToolbarButton>
          <ToolbarButton label="Ajuster" onClick={resetView}>
            <RotateCcw size={17} />
          </ToolbarButton>
          <a
            href={active.src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink size={17} />
          </a>
          <ToolbarButton label="Fermer" onClick={() => setOpen(false)}>
            <X size={19} />
          </ToolbarButton>
        </div>
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-white/15"
              aria-label="Image precedente"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-white/15"
              aria-label="Image suivante"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        <div className="flex h-full w-full items-center justify-center p-4 sm:p-8">
          <img
            src={active.src}
            alt={active.alt}
            draggable={false}
            onLoad={(event) => setLoadedSize({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })}
            className={fitMode ? 'max-h-full max-w-full select-none object-contain' : 'select-none object-contain'}
            style={fitMode
              ? undefined
              : {
                  width: loadedSize?.width || 'auto',
                  height: loadedSize?.height || 'auto',
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  cursor: zoom > 1 ? 'grab' : 'default',
                }}
          />
        </div>
      </div>

      <div className="flex h-11 shrink-0 items-center justify-between border-t border-white/10 px-3 text-xs text-white/60 sm:px-5">
        <span>{images.length > 1 ? `${index + 1} / ${images.length}` : 'Image unique'}</span>
        <span>Molette: zoom - glisser: deplacer - Esc: fermer</span>
      </div>
    </div>
  );
}

function ToolbarButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}
