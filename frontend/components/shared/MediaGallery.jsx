'use client';

import Image from 'next/image';
import { useImageViewer } from './ImageViewerContext';

export default function MediaGallery({ images = [], emptyLabel = 'Aucune photo' }) {
  const { openViewer } = useImageViewer();
  const list = images.filter((img) => img?.url);

  if (!list.length) {
    return (
      <div className="w-full h-[240px] sm:h-[320px] rounded-[28px] bg-[#EEF6DE] flex items-center justify-center text-[#A7D129] text-sm font-semibold">
        {emptyLabel}
      </div>
    );
  }

  const viewerImages = list.map((img, i) => ({ src: img.url, alt: img.alt || `Photo ${i + 1}` }));
  const open = (i) => openViewer(viewerImages, i);

  return (
    <>
      <div className="lg:hidden flex flex-col gap-3">
        <MobileGallery list={list} onOpen={open} />
      </div>
      <div className="hidden lg:block h-[340px] rounded-[28px] overflow-hidden">
        <DesktopGrid list={list} onOpen={open} />
      </div>
    </>
  );
}

function DesktopGrid({ list, onOpen }) {
  const count = list.length;

  // 1 photo: full-bleed single frame
  if (count === 1) {
    return <Tile img={list[0]} alt="Photo 1" className="w-full h-full" onClick={() => onOpen(0)} />;
  }

  // 2 photos: even split
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-2 h-full">
        {list.map((img, i) => (
          <Tile key={img.url + i} img={img} alt={`Photo ${i + 1}`} className="h-full" onClick={() => onOpen(i)} />
        ))}
      </div>
    );
  }

  // 3 photos: 1 large left + 2 stacked right
  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-2 h-full">
        <Tile img={list[0]} alt="Photo 1" className="h-full" onClick={() => onOpen(0)} />
        <div className="grid grid-rows-2 gap-2 h-full">
          <Tile img={list[1]} alt="Photo 2" className="h-full" onClick={() => onOpen(1)} />
          <Tile img={list[2]} alt="Photo 3" className="h-full" onClick={() => onOpen(2)} />
        </div>
      </div>
    );
  }

  // 4 photos: 1 large left + 3 stacked right
  if (count === 4) {
    return (
      <div className="grid grid-cols-2 gap-2 h-full">
        <Tile img={list[0]} alt="Photo 1" className="h-full" onClick={() => onOpen(0)} />
        <div className="grid grid-rows-3 gap-2 h-full">
          {list.slice(1).map((img, i) => (
            <Tile key={img.url + i} img={img} alt={`Photo ${i + 2}`} className="h-full" onClick={() => onOpen(i + 1)} />
          ))}
        </div>
      </div>
    );
  }

  // 5+ photos: 1 large left + 2x2 grid right, overlay "+N" on last tile
  const [cover, ...rest] = list;
  const extra = rest.slice(0, 4);
  const overflowCount = rest.length - extra.length;

  return (
    <div className="grid grid-cols-2 gap-2 h-full">
      <Tile img={cover} alt="Photo 1" className="h-full" onClick={() => onOpen(0)} />
      <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
        {extra.map((img, i) => {
          const isLast = i === extra.length - 1 && overflowCount > 0;
          return (
            <Tile
              key={img.url + i}
              img={img}
              alt={`Photo ${i + 2}`}
              className="h-full"
              onClick={() => onOpen(i + 1)}
              overlayCount={isLast ? overflowCount : null}
            />
          );
        })}
      </div>
    </div>
  );
}

function Tile({ img, alt, className, onClick, overlayCount }) {
  return (
    <button type="button" onClick={onClick} className={`relative group overflow-hidden bg-[#EEF6DE] rounded-2xl ${className}`}>
      <Image
        src={img.url}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
      />
      {overlayCount ? (
        <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-extrabold text-lg">
          +{overlayCount}
        </div>
      ) : null}
    </button>
  );
}

function MobileGallery({ list, onOpen }) {
  return (
    <>
      <button
        type="button"
        onClick={() => onOpen(0)}
        className="relative w-full h-[240px] sm:h-[320px] bg-[#EEF6DE] rounded-[28px] overflow-hidden"
      >
        <Image src={list[0].url} alt="Photo 1" fill sizes="100vw" className="object-cover" priority />
        {list.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/55 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-semibold tracking-wide">
            1 / {list.length}
          </div>
        )}
      </button>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar p-2">
          {list.map((img, i) => (
            <button key={img.url + i} onClick={() => onOpen(i)} className="shrink-0 relative w-20 h-20 rounded-2xl overflow-hidden opacity-80 hover:opacity-100 transition">
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}