
import { setUseCPURendering } from "@cornerstonejs/core";
import * as dicomImageLoader from "@cornerstonejs/dicom-image-loader";
import {
  addTool,
  PanTool,
  init as csToolsInit
} from "@cornerstonejs/tools";

export const initializeDicomImageLoader = () => {
  dicomImageLoader.init({
    maxWebWorkers: navigator.hardwareConcurrency || 2,
  });
};

export const initializeCornerstoneTools = () => {
  setUseCPURendering(true);
  csToolsInit();
  addTool(PanTool);
};

export const VIEWPORT_CONFIG = {
  renderingEngineId: "cornerstone-rendering-engine",
  viewportIds: {
    left: "CT_STACK_LEFT",
    center: "CT_STACK_CENTER", 
    right: "CT_STACK_RIGHT"
  },
  toolGroupId: "cornerstone-tools-group"
};

export const initializeCornerstone = () => {
  initializeDicomImageLoader();
  initializeCornerstoneTools();
};