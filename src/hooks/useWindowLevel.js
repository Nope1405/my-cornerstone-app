import { useState, useCallback, useRef } from 'react';

export const useWindowLevel = (renderingEngineRef) => {
  const [windowSettings, setWindowSettings] = useState({
    left: { center: 128, width: 256 },
    center: { center: 128, width: 256 },
    right: { center: 128, width: 256 }
  });

  const [activeViewport, setActiveViewport] = useState('left');
  
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const dragViewportRef = useRef(null);

  const updateWindowLevel = useCallback((viewportId, center, width) => {
    const viewport = renderingEngineRef.current?.getViewport(viewportId);
    if (!viewport) return;

    viewport.setProperties({
      voiRange: {
        lower: center - width / 2,
        upper: center + width / 2
      }
    });
    viewport.render();
  }, [renderingEngineRef]);

  const handleMouseDown = useCallback((e, viewportType) => {
    if (e.button === 2) { 
      e.preventDefault();
      isDraggingRef.current = true;
      dragViewportRef.current = viewportType;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      
      document.body.style.cursor = 'crosshair';
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current || !dragViewportRef.current) return;

    e.preventDefault();
    
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    
    const viewportIds = {
      left: 'CT_STACK_LEFT',
      center: 'CT_STACK_CENTER',
      right: 'CT_STACK_RIGHT'
    };

    const viewportId = viewportIds[dragViewportRef.current];
    const viewport = renderingEngineRef.current?.getViewport(viewportId);
    if (!viewport) return;

    const currentSettings = windowSettings[dragViewportRef.current];
    
    const centerSensitivity = 2.0;  
    const widthSensitivity = 4.0;
    
    const newCenter = Math.max(-1000, Math.min(3000, 
      currentSettings.center + (deltaX * centerSensitivity)
    ));
    const newWidth = Math.max(1, Math.min(4000, 
      currentSettings.width + (-deltaY * widthSensitivity)
    ));

    const newSettings = {
      center: Math.round(newCenter),
      width: Math.round(newWidth)
    };

    setWindowSettings(prev => ({
      ...prev,
      [dragViewportRef.current]: newSettings
    }));

    updateWindowLevel(viewportId, newSettings.center, newSettings.width);
    
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [windowSettings, updateWindowLevel]);

  const handleMouseUp = useCallback((e) => {
    if (e.button === 2 && isDraggingRef.current) { 
      e.preventDefault();
      isDraggingRef.current = false;
      dragViewportRef.current = null;
      
      document.body.style.cursor = 'default';
    }
  }, []);

  const setupMouseListeners = useCallback(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleWindowChange = useCallback((type, value) => {
    const viewportIds = {
      left: 'CT_STACK_LEFT',
      center: 'CT_STACK_CENTER',
      right: 'CT_STACK_RIGHT'
    };

    const viewport = renderingEngineRef.current?.getViewport(viewportIds[activeViewport]);
    if (!viewport) return;

    const currentSettings = windowSettings[activeViewport];
    const newSettings = {
      ...currentSettings,
      [type]: parseFloat(value)
    };

    setWindowSettings(prev => ({
      ...prev,
      [activeViewport]: newSettings
    }));

    updateWindowLevel(viewportIds[activeViewport], newSettings.center, newSettings.width);
  }, [activeViewport, windowSettings, updateWindowLevel]);

  const resetWindowLevel = useCallback(() => {
    const viewportIds = {
      left: 'CT_STACK_LEFT',
      center: 'CT_STACK_CENTER',
      right: 'CT_STACK_RIGHT'
    };

    const viewport = renderingEngineRef.current?.getViewport(viewportIds[activeViewport]);
    if (!viewport) return;

    const defaultSettings = { center: 128, width: 256 };
    
    setWindowSettings(prev => ({
      ...prev,
      [activeViewport]: defaultSettings
    }));

    updateWindowLevel(viewportIds[activeViewport], defaultSettings.center, defaultSettings.width);
  }, [activeViewport, updateWindowLevel]);

  const setActiveViewportHandler = useCallback((viewportType) => {
    setActiveViewport(viewportType);
  }, []);

  const initializeWindowLevel = useCallback((viewportId, viewportKey, imageMetadata) => {
    let defaultCenter = 128;
    let defaultWidth = 256;
    
    if (imageMetadata && imageMetadata.string) {
      const windowCenter = imageMetadata.string('x00281050'); 
      const windowWidth = imageMetadata.string('x00281051');  
      
      if (windowCenter) defaultCenter = parseFloat(windowCenter.split('\\')[0]) || 128;
      if (windowWidth) defaultWidth = parseFloat(windowWidth.split('\\')[0]) || 256;
    }

    setWindowSettings(prev => ({
      ...prev,
      [viewportKey]: { center: defaultCenter, width: defaultWidth }
    }));

    updateWindowLevel(viewportId, defaultCenter, defaultWidth);
  }, [updateWindowLevel]);

  return {
    windowSettings,
    activeViewport,
    handleWindowChange,
    resetWindowLevel,
    setActiveViewportHandler,
    initializeWindowLevel,
    handleMouseDown,
    setupMouseListeners
  };
};