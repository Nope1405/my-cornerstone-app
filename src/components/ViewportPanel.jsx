
import React from 'react';

const ViewportPanel = ({ 
  elementRef, 
  viewportId, 
  onFileChange, 
  showNavigation = false,
  navigationProps = {}
}) => {
  const { 
    currentImageIndex = 0, 
    totalImages = 0, 
    onPrevious, 
    onNext 
  } = navigationProps;

  return (
    <div>
      <input
        type="file"
        accept=".dcm"
        multiple
        onChange={onFileChange}
      />
      <div
        ref={elementRef}
        data-viewport-id={viewportId}
        style={{
          width: 512,
          height: 512,
          backgroundColor: "black",
          touchAction: "none",
          cursor: "crosshair",
          border: "1px solid #ccc"
        }}
      />
      {showNavigation && (
        <div style={{ 
          marginTop: '10px', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '10px' 
        }}>
          <button
            onClick={onPrevious}
            disabled={currentImageIndex === 0 || totalImages <= 1}
          >
            Previous Image
          </button>
          <span>{currentImageIndex + 1} / {totalImages}</span>
          <button
            onClick={onNext}
            disabled={currentImageIndex === totalImages - 1 || totalImages <= 1}
          >
            Next Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewportPanel;