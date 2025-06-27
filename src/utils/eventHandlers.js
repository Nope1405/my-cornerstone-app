
import { VIEWPORT_CONFIG } from '../config/cornerstoneConfig';

export const createEventHandlers = (renderingEngineRef) => {
  const handleContextMenu = (e) => e.preventDefault();

  const handleWheel = (e) => {
    e.preventDefault();
    const targetElement = e.currentTarget;
    let currentViewportId;
    
    const elementLeft = document.querySelector(`[data-viewport-id="${VIEWPORT_CONFIG.viewportIds.left}"]`);
    const elementCenter = document.querySelector(`[data-viewport-id="${VIEWPORT_CONFIG.viewportIds.center}"]`);
    const elementRight = document.querySelector(`[data-viewport-id="${VIEWPORT_CONFIG.viewportIds.right}"]`);
    
    if (targetElement === elementLeft) currentViewportId = VIEWPORT_CONFIG.viewportIds.left;
    else if (targetElement === elementCenter) currentViewportId = VIEWPORT_CONFIG.viewportIds.center;
    else if (targetElement === elementRight) currentViewportId = VIEWPORT_CONFIG.viewportIds.right;
    else return;

    const viewport = renderingEngineRef.current?.getViewport(currentViewportId);
    if (!viewport) return;

    const currentZoom = viewport.getZoom?.() ?? 1;
    if (viewport.setZoom) {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      viewport.setZoom(currentZoom * zoomFactor);
    }
    viewport.render();
  };

  return {
    handleContextMenu,
    handleWheel
  };
};

export const attachEventListeners = (elements, handlers) => {
  const { elementLeft, elementCenter, elementRight } = elements;
  const { handleContextMenu, handleWheel } = handlers;

  elementLeft.addEventListener("contextmenu", handleContextMenu);
  elementCenter.addEventListener("contextmenu", handleContextMenu);
  elementRight.addEventListener("contextmenu", handleContextMenu);

  elementLeft.addEventListener('wheel', handleWheel, { passive: false });
  elementCenter.addEventListener('wheel', handleWheel, { passive: false });
  elementRight.addEventListener('wheel', handleWheel, { passive: false });

  return () => {
    elementLeft.removeEventListener("contextmenu", handleContextMenu);
    elementCenter.removeEventListener("contextmenu", handleContextMenu);
    elementRight.removeEventListener("contextmenu", handleContextMenu);
    elementLeft.removeEventListener('wheel', handleWheel);
    elementCenter.removeEventListener('wheel', handleWheel);
    elementRight.removeEventListener('wheel', handleWheel);
  };
};