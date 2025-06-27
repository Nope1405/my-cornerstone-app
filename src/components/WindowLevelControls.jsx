import React from 'react';

const WindowLevelControls = ({ 
  windowSettings, 
  activeViewport, 
  onWindowChange, 
  onReset 
}) => {
  const currentSettings = windowSettings[activeViewport];

  return (
    <div style={{ 
      marginBottom: '20px', 
      padding: '15px', 
      border: '2px solid #007bff', 
      borderRadius: '8px', 
      backgroundColor: '#f8f9fa' 
    }}>
      <h3>Chỉnh Sáng Tối (Window/Level) - Viewport: {activeViewport.toUpperCase()}</h3>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Window Center (Brightness): {currentSettings.center}
          </label>
          <input
            type="range"
            min="-1000"
            max="3000"
            step="1"
            value={currentSettings.center}
            onChange={(e) => onWindowChange('center', e.target.value)}
            style={{ width: '200px' }}
          />
          <input
            type="number"
            value={currentSettings.center}
            onChange={(e) => onWindowChange('center', e.target.value)}
            style={{ marginLeft: '10px', width: '80px' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Window Width (Contrast): {currentSettings.width}
          </label>
          <input
            type="range"
            min="1"
            max="4000"
            step="1"
            value={currentSettings.width}
            onChange={(e) => onWindowChange('width', e.target.value)}
            style={{ width: '200px' }}
          />
          <input
            type="number"
            min="1"
            value={currentSettings.width}
            onChange={(e) => onWindowChange('width', e.target.value)}
            style={{ marginLeft: '10px', width: '80px' }}
          />
        </div>
        
        <button 
          onClick={onReset}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>
      <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
        <strong>Hướng dẫn:</strong> Nhấn giữ chuột PHẢI trên viewport và kéo để điều chỉnh, hoặc dùng slider.
      </p>
    </div>
  );
};

export default WindowLevelControls;