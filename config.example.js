// Configuration file for Solar Panel Monitor
// Copy this file to config.js and update with your actual URLs

const CONFIG = {
    // Base URL for the solar panel API
    apiBaseUrl: 'http://127.0.0.1',
    
    // Endpoint for panel layout data
    panelLayoutEndpoint: '/cgi-bin/dl_cgi/panels/layout',
    
    // Endpoint for power data
    powerDataEndpoint: '/cgi-bin/dl_cgi?Command=DeviceList',
    
    // Optional: Local panel layout (exported from the app)
    // If provided, this will be used instead of fetching from the API
    // To use: Export the panel layout from the app, then paste it here
    // Example format:
    // localLayout: [
    //     { id: 'panel-1', x: 50, y: 50, width: 80, height: 120, planeRotation: 0, inverterSerialNumber: 'SN123' },
    //     { id: 'panel-2', x: 150, y: 50, width: 120, height: 80, planeRotation: 90, inverterSerialNumber: 'SN456' }
    // ]
    localLayout: null
};

