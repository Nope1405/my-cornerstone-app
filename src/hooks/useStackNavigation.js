
import { useState, useCallback } from 'react';

export const useStackNavigation = (getViewport, viewportId) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [imageIds, setImageIds] = useState([]);

  const updateStackInfo = useCallback((newImageIds) => {
    setImageIds(newImageIds);
    setCurrentImageIndex(0);
    setTotalImages(newImageIds.length);
  }, []);

  const clearStackInfo = useCallback(() => {
    setImageIds([]);
    setCurrentImageIndex(0);
    setTotalImages(0);
  }, []);

  const handleNextImage = useCallback(() => {
    const viewport = getViewport(viewportId);
    if (!viewport || imageIds.length <= 1) return;

    const currentIndex = viewport.getCurrentImageIdIndex?.() ?? 0;
    const newIndex = Math.min(imageIds.length - 1, currentIndex + 1);
    if (newIndex !== currentIndex) {
      viewport.setImageIdIndex(newIndex);
      viewport.render();
      setCurrentImageIndex(newIndex);
    }
  }, [getViewport, viewportId, imageIds.length]);

  const handlePreviousImage = useCallback(() => {
    const viewport = getViewport(viewportId);
    if (!viewport || imageIds.length <= 1) return;

    const currentIndex = viewport.getCurrentImageIdIndex?.() ?? 0;
    const newIndex = Math.max(0, currentIndex - 1);
    if (newIndex !== currentIndex) {
      viewport.setImageIdIndex(newIndex);
      viewport.render();
      setCurrentImageIndex(newIndex);
    }
  }, [getViewport, viewportId, imageIds.length]);

  return {
    currentImageIndex,
    totalImages,
    imageIds,
    updateStackInfo,
    clearStackInfo,
    handleNextImage,
    handlePreviousImage
  };
};