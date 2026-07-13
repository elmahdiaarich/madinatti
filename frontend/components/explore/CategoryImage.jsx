// frontend/components/explore/CategoryImage.jsx
"use client";

import { useState, useEffect } from "react";

/**
 * Drop-in replacement for a plain <img>: shows the image if it loads,
 * otherwise (missing src, 404, broken CDN link...) falls back to a
 * category-tinted panel with the category's lucide icon.
 *
 * Usage:
 *   <CategoryImage src={img.url} alt={listing.name} icon={cfg.icon}
 *     className="h-72 w-full object-cover" />
 */
export default function CategoryImage({
  src,
  alt = "",
  icon: Icon,
  iconSize = 32,
  className = "",
  onClick,
}) {
  const [errored, setErrored] = useState(false);

  // Reset error state when the source actually changes (e.g. swapping
  // between thumbnails of the same listing).
  useEffect(() => {
    setErrored(false);
  }, [src]);

  const showFallback = !src || errored;

  if (showFallback) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center justify-center bg-[var(--color-primary-mint)] text-[var(--color-primary-dark)]/40 ${className}`}
      >
        {Icon ? <Icon size={iconSize} /> : null}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onClick={onClick}
      onError={() => setErrored(true)}
      className={className}
    />
  );
}