
import { useRef, useCallback } from 'react';
import { RenderingEngine, Enums, imageLoader } from "@cornerstonejs/core";
import * as dicomImageLoader from "@cornerstonejs/dicom-image-loader";
import { PanTool, ToolGroupManager } from "@cornerstonejs/tools";
import { VIEWPORT_CONFIG } from '../config/cornerstoneConfig';

export const useViewport = () => {
  const renderingEngineRef = useRef(null);

  const initializeRenderingEngine = useCallback((elements) => {
    const { elementLeft, elementCenter, elementRight } = elements;
    
    if (!elementLeft || !elementCenter || !elementRight) return null;

    const renderingEngine = new RenderingEngine(VIEWPORT_CONFIG.renderingEngineId);
    renderingEngineRef.current = renderingEngine;

    // Enable viewports
    renderingEngine.enableElement({ 
      viewportId: VIEWPORT_CONFIG.viewportIds.left, 
      element: elementLeft, 
      type: Enums.ViewportType.STACK 
    });
    renderingEngine.enableElement({ 
      viewportId: VIEWPORT_CONFIG.viewportIds.center, 
      element: elementCenter, 
      type: Enums.ViewportType.STACK 
    });
    renderingEngine.enableElement({ 
      viewportId: VIEWPORT_CONFIG.viewportIds.right, 
      element: elementRight, 
      type: Enums.ViewportType.STACK 
    });

    return renderingEngine;
  }, []);

  const setupToolGroup = useCallback(() => {
    let toolGroup;
    try {
      toolGroup = ToolGroupManager.getToolGroup(VIEWPORT_CONFIG.toolGroupId);
      if (!toolGroup) toolGroup = ToolGroupManager.createToolGroup(VIEWPORT_CONFIG.toolGroupId);
    } catch {
      toolGroup = ToolGroupManager.createToolGroup(VIEWPORT_CONFIG.toolGroupId);
    }

    toolGroup.addTool(PanTool.toolName);
    toolGroup.setToolActive(PanTool.toolName, {
      bindings: [{ mouseButton: 1 }],
    });

    toolGroup.addViewport(VIEWPORT_CONFIG.viewportIds.left, VIEWPORT_CONFIG.renderingEngineId);
    toolGroup.addViewport(VIEWPORT_CONFIG.viewportIds.center, VIEWPORT_CONFIG.renderingEngineId);
    toolGroup.addViewport(VIEWPORT_CONFIG.viewportIds.right, VIEWPORT_CONFIG.renderingEngineId);

    return toolGroup;
  }, []);

  const loadImageIntoViewport = useCallback(async (files, viewportId) => {
    if (!renderingEngineRef.current) return { success: false, imageIds: [] };

    try {
      const imageIds = Array.from(files).map((file) =>
        dicomImageLoader.wadouri.fileManager.add(file)
      );

      await Promise.all(imageIds.map((id) => imageLoader.loadAndCacheImage(id)));
      const viewport = renderingEngineRef.current.getViewport(viewportId);
      if (!viewport) return { success: false, imageIds: [] };

      await viewport.setStack(imageIds, 0);
      viewport.render();

      return { success: true, imageIds };
    } catch (error) {
      console.error('Error loading images:', error);
      return { success: false, imageIds: [] };
    }
  }, []);

  const getViewport = useCallback((viewportId) => {
    return renderingEngineRef.current?.getViewport(viewportId);
  }, []);

  const destroyRenderingEngine = useCallback(() => {
    if (renderingEngineRef.current) {
      renderingEngineRef.current.destroy();
      renderingEngineRef.current = null;
    }
    ToolGroupManager.destroyToolGroup(VIEWPORT_CONFIG.toolGroupId);
  }, []);

  return {
    renderingEngineRef,
    initializeRenderingEngine,
    setupToolGroup,
    loadImageIntoViewport,
    getViewport,
    destroyRenderingEngine
  };
};