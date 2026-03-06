// Configuration file for Solar Panel Monitor
// Copy this file to config.js and update with your actual URLs

const CONFIG = {
    // Base URL for the solar panel API
    apiBaseUrl: 'http://127.0.0.1',

    // Endpoint for panel layout data
    panelLayoutEndpoint: '/cgi-bin/dl_cgi/panels/layout',

    // Endpoint for power data
    powerDataEndpoint: '/cgi-bin/dl_cgi?Command=DeviceList',

    // Optional: Grid snap size in SVG units when dragging panels (0 to disable)
    // gridSize: 10,

    // Optional: Local panel layout (exported from the app)
    // If provided, this will be used instead of fetching from the API.
    // Use "Export Layout" in the app, then paste the array here.
    // You can also import a layout file directly via the "Import Layout" button.
    //
    // Optional per-panel fields:
    //   label      - friendly display name shown on the panel and in the tooltip
    //   ratedWatts - nameplate capacity; enables efficiency % in the tooltip
    //
    // localLayout: [
    //     {
    //         id: 'panel-1', x: 50, y: 50, width: 80, height: 120,
    //         planeRotation: 0, inverterSerialNumber: 'SN123',
    //         label: 'Garage South', ratedWatts: 400
    //     },
    //     {
    //         id: 'panel-2', x: 150, y: 50, width: 120, height: 80,
    //         planeRotation: 90, inverterSerialNumber: 'SN456'
    //     }
    // ]
    localLayout: null
};

