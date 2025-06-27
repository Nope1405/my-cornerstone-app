import React, { useEffect, useRef, useState } from "react";
import {
  RenderingEngine,
  Enums,
  setUseCPURendering,
  imageLoader,
} from "@cornerstonejs/core";
import * as dicomImageLoader from "@cornerstonejs/dicom-image-loader";
import {
  addTool,
  PanTool,
  ToolGroupManager,
  init as csToolsInit
} from "@cornerstonejs/tools";

import WindowLevelControls from './components/WindowLevelControls';
import { useWindowLevel } from './hooks/useWindowLevel';

dicomImageLoader.init({
  maxWebWorkers: navigator.hardwareConcurrency || 2,
});

setUseCPURendering(true);

csToolsInit();

addTool(PanTool);

function CornerstoneViewer() {
  const elementRefLeft = useRef(null);
  const elementRefCenter = useRef(null);
  const elementRefRight = useRef(null);
  const renderingEngineRef = useRef(null);

  const [currentImageIndexLeft, setCurrentImageIndexLeft] = useState(0);
  const [totalImagesLeft, setTotalImagesLeft] = useState(0);
  const [imageIdsLeft, setImageIdsLeft] = useState([]);

  const {
    windowSettings,
    activeViewport,
    handleWindowChange,
    resetWindowLevel,
    setActiveViewportHandler,
    initializeWindowLevel
  } = useWindowLevel(renderingEngineRef);

  const renderingEngineId = "cornerstone-rendering-engine";
  const viewportIdLeft = "CT_STACK_LEFT";
  const viewportIdCenter = "CT_STACK_CENTER";
  const viewportIdRight = "CT_STACK_RIGHT";
  const toolGroupId = "cornerstone-tools-group";

  useEffect(() => {
    const elementLeft = elementRefLeft.current;
    const elementCenter = elementRefCenter.current;
    const elementRight = elementRefRight.current;

    if (!elementLeft || !elementCenter || !elementRight) return;

    const handleContextMenu = (e) => e.preventDefault();
    elementLeft.addEventListener("contextmenu", handleContextMenu);
    elementCenter.addEventListener("contextmenu", handleContextMenu);
    elementRight.addEventListener("contextmenu", handleContextMenu);

    const renderingEngine = new RenderingEngine(renderingEngineId);
    renderingEngineRef.current = renderingEngine;

    renderingEngine.enableElement({ viewportId: viewportIdLeft, element: elementLeft, type: Enums.ViewportType.STACK });
    renderingEngine.enableElement({ viewportId: viewportIdCenter, element: elementCenter, type: Enums.ViewportType.STACK });
    renderingEngine.enableElement({ viewportId: viewportIdRight, element: elementRight, type: Enums.ViewportType.STACK });

    let toolGroup;
    try {
      toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      if (!toolGroup) toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
    } catch {
      toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
    }

    toolGroup.addTool(PanTool.toolName);
    toolGroup.setToolActive(PanTool.toolName, {
      bindings: [{ mouseButton: 1 }],
    });

    toolGroup.addViewport(viewportIdLeft, renderingEngineId);
    toolGroup.addViewport(viewportIdCenter, renderingEngineId);
    toolGroup.addViewport(viewportIdRight, renderingEngineId);

    const handleWheel = (e) => {
      e.preventDefault();
      const targetElement = e.currentTarget;
      let currentViewportId;
      if (targetElement === elementLeft) currentViewportId = viewportIdLeft;
      else if (targetElement === elementCenter) currentViewportId = viewportIdCenter;
      else if (targetElement === elementRight) currentViewportId = viewportIdRight;
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

  
    const handleViewportClick = (e, viewportType) => {
      setActiveViewportHandler(viewportType);
    };

    elementLeft.addEventListener('click', (e) => handleViewportClick(e, 'left'));
    elementCenter.addEventListener('click', (e) => handleViewportClick(e, 'center'));
    elementRight.addEventListener('click', (e) => handleViewportClick(e, 'right'));

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

      if (toolGroup) {
        toolGroup.removeViewports(renderingEngineId, viewportIdLeft);
        toolGroup.removeViewports(renderingEngineId, viewportIdCenter);
        toolGroup.removeViewports(renderingEngineId, viewportIdRight);
      }

      if (renderingEngineRef.current) {
        renderingEngineRef.current.destroy();
        renderingEngineRef.current = null;
      }

      ToolGroupManager.destroyToolGroup(toolGroupId);
    };
  }, [setActiveViewportHandler]);

  const loadImageIntoViewport = async (files, viewportId) => {
    if (!renderingEngineRef.current) return;

    try {
      const imageIds = Array.from(files).map((file) =>
        dicomImageLoader.wadouri.fileManager.add(file)
      );

      await Promise.all(imageIds.map((id) => imageLoader.loadAndCacheImage(id)));
      const viewport = renderingEngineRef.current.getViewport(viewportId);
      if (!viewport) return;

      await viewport.setStack(imageIds, 0);
      viewport.render();

      if (imageIds.length > 0) {
        const image = await imageLoader.loadAndCacheImage(imageIds[0]);
        const metadata = image.data;
        const viewportKey = viewportId === viewportIdLeft ? 'left' : 
                           viewportId === viewportIdCenter ? 'center' : 'right';
        initializeWindowLevel(viewportId, viewportKey, metadata);
      }

      if (viewportId === viewportIdLeft) {
        setImageIdsLeft(imageIds);
        setCurrentImageIndexLeft(0);
        setTotalImagesLeft(imageIds.length);
      }
    } catch (error) {
      console.error(error);
      if (viewportId === viewportIdLeft) {
        setImageIdsLeft([]);
        setCurrentImageIndexLeft(0);
        setTotalImagesLeft(0);
      }
    }
  };

  const handleNextImageLeft = () => {
    const viewport = renderingEngineRef.current?.getViewport(viewportIdLeft);
    if (!viewport || imageIdsLeft.length <= 1) return;

    const currentIndex = viewport.getCurrentImageIdIndex?.() ?? 0;
    const newIndex = Math.min(imageIdsLeft.length - 1, currentIndex + 1);
    if (newIndex !== currentIndex) {
      viewport.setImageIdIndex(newIndex);
      viewport.render();
      setCurrentImageIndexLeft(newIndex);
    }
  };

  const handlePreviousImageLeft = () => {
    const viewport = renderingEngineRef.current?.getViewport(viewportIdLeft);
    if (!viewport || imageIdsLeft.length <= 1) return;

    const currentIndex = viewport.getCurrentImageIdIndex?.() ?? 0;
    const newIndex = Math.max(0, currentIndex - 1);
    if (newIndex !== currentIndex) {
      viewport.setImageIdIndex(newIndex);
      viewport.render();
      setCurrentImageIndexLeft(newIndex);
    }
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: '#111' }}>
      <h1 style={{ color: '#111', letterSpacing: 1 }}>Cornerstone3D React Viewer với Brightness/Contrast</h1>
      
      <WindowLevelControls
        windowSettings={windowSettings}
        activeViewport={activeViewport}
        onWindowChange={handleWindowChange}
        onReset={resetWindowLevel}
      />

      <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
        <div>
          <h4>Left Viewport {activeViewport === 'left' && '(ACTIVE)'}</h4>
          <input
            type="file"
            accept=".dcm"
            multiple
            onChange={(e) => {
              if (e.target.files.length > 0) {
                loadImageIntoViewport(e.target.files, viewportIdLeft);
              }
            }}
          />
          <div
            ref={elementRefLeft}
            style={{
              width: 512,
              height: 512,
              backgroundColor: "white",
              touchAction: "none",
              cursor: "crosshair",
              border: activeViewport === 'left' ? "3px solid #007bff" : "1px solid #ccc"
            }}
          ></div>
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              onClick={handlePreviousImageLeft}
              disabled={currentImageIndexLeft === 0 || totalImagesLeft <= 1}
            >
              Previous Image
            </button>
            <span>{currentImageIndexLeft + 1} / {totalImagesLeft}</span>
            <button
              onClick={handleNextImageLeft}
              disabled={currentImageIndexLeft === totalImagesLeft - 1 || totalImagesLeft <= 1}
            >
              Next Image
            </button>
          </div>
        </div>

        <div>
          <h4>Center Viewport {activeViewport === 'center' && '(ACTIVE)'}</h4>
          <input
            type="file"
            accept=".dcm"
            multiple
            onChange={(e) => {
              if (e.target.files.length > 0) {
                loadImageIntoViewport(e.target.files, viewportIdCenter);
              }
            }}
          />
          <div
            ref={elementRefCenter}
            style={{
              width: 512,
              height: 512,
              backgroundColor: "white",
              touchAction: "none",
              cursor: "crosshair",
              border: activeViewport === 'center' ? "3px solid #007bff" : "1px solid #ccc"
            }}
          ></div>
        </div>

        <div>
          <h4>Right Viewport {activeViewport === 'right' && '(ACTIVE)'}</h4>
          <input
            type="file"
            accept=".dcm"
            multiple
            onChange={(e) => {
              if (e.target.files.length > 0) {
                loadImageIntoViewport(e.target.files, viewportIdRight);
              }
            }}
          />
          <div
            ref={elementRefRight}
            style={{
              width: 512,
              height: 512,
              backgroundColor: "white",
              touchAction: "none",
              cursor: "crosshair",
              border: activeViewport === 'right' ? "3px solid #007bff" : "1px solid #ccc"
            }}
          ></div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px', color: '#111', fontSize: '1.05rem', lineHeight: 1.7 }}>

        <p>• <strong>Pan (Di chuyển):</strong> Nhấn giữ chuột TRÁI và kéo</p>
        <p>• <strong>Zoom (Phóng to/thu nhỏ):</strong> Cuộn chuột (wheel) lên/xuống</p>
        <p>• <strong>Điều hướng Stack (Khung trái):</strong> Dùng nút Previous/Next</p>
        <p>• <strong>Chỉnh sáng tối:</strong> Click vào viewport muốn điều chỉnh, sau đó dùng các slider ở trên</p>
        <p>• <strong>Window Center (Brightness):</strong> Điều chỉnh độ sáng của hình ảnh</p>
        <p>• <strong>Window Width (Contrast):</strong> Điều chỉnh độ tương phản của hình ảnh</p>
      </div>
    </div>
  );
}

export default CornerstoneViewer;