# SolarPaneler
Render PV6 Solar Panel in your browser, automatically finding the placement of your panels and
showing power production and panel details for each.

Detailed post at [Self Hosting PV6 Monitoring (software included!)](https://brett.durrett.net/self-hosting-pv6-monitoring-software-included/)

## Setup

1. Copy the example configuration file:
   ```bash
   cp config.example.js config.js
   ```

2. Edit `config.js` and update the URLs with your actual API endpoints:
   - `apiBaseUrl`: Base URL for your solar panel API
   - `panelLayoutEndpoint`: Endpoint path for panel layout data
   - `powerDataEndpoint`: Endpoint path for power data

Note: `config.js` is ignored by git, so each installation can have its own configuration.

## Running

Just load index.html into a browser... no server needed!

## Panel Layout Export/Import

You can export the panel layout (including any manual position adjustments) and use it locally instead of fetching from the API.

### Exporting the Panel Layout

1. Load the application and arrange your panels as desired (you can drag panels to reposition them)
2. Click the **"Export Layout"** button in the header
3. The layout will be:
   - Copied to your clipboard
   - Downloaded as a text file (`panel-layout-export.txt`)

### Using the Exported Layout

1. Open the exported file or paste the clipboard content
2. Open your `config.js` file
3. Find the `localLayout` property (it should be set to `null`)
4. Replace `null` with the exported array from the file

Example:
```javascript
const CONFIG = {
    apiBaseUrl: 'http://127.0.0.1',
    panelLayoutEndpoint: '/cgi-bin/dl_cgi/panels/layout',
    powerDataEndpoint: '/cgi-bin/dl_cgi?Command=DeviceList',
    
    // Paste your exported layout here:
    localLayout: [
        {
            "id": "panel-1",
            "x": 50,
            "y": 50,
            "width": 80,
            "height": 120,
            "planeRotation": 0,
            "inverterSerialNumber": "SN123",
            "serialNumber": "SN123"
        },
        // ... more panels
    ]
};
```

5. Save `config.js` and refresh the application
6. The app will now use the local layout instead of fetching from the API

**Note:** When `localLayout` is configured, the app will skip fetching the panel layout from the API, which can be useful for:
- Offline use
- Custom panel arrangements
- Faster loading times
- Preserving manual position adjustments



