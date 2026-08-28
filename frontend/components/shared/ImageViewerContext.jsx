'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ImageViewerContext = createContext(null);

export function ImageViewerProvider({ children }) {
  const [state, setState] = useState({ open: false, images: [], index: 0 });

  const openViewer = useCallback((images, startIndex = 0) => {
    if (!images?.length) return;
    setState({ open: true, images, index: startIndex });
  }, []);

  const closeViewer = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const setIndex = useCallback((updater) => {
    setState((s) => ({
      ...s,
      index: typeof updater === 'function' ? updater(s.index) : updater,
    }));
  }, []);

  const value = useMemo(
    () => ({ ...state, openViewer, closeViewer, setIndex }),
    [state, openViewer, closeViewer, setIndex],
  );

  return (
    <ImageViewerContext.Provider value={value}>
      {children}
    </ImageViewerContext.Provider>
  );
}

export function useImageViewer() {
  const ctx = useContext(ImageViewerContext);
  if (!ctx) throw new Error('useImageViewer must be used within ImageViewerProvider');
  return ctx;
}