class SolarPanelMonitor {
    constructor() {
        this.panels = [];
        this.powerData = {};
        this.maxPower = 0;
        this.refreshInterval = null;
        this.refreshIntervalMinutes = 5;
        this.isDragging = false;
        this.dragPanel = null;
        this.dragOffset = { x: 0, y: 0 };
        this.editPlacementEnabled = false;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadPanelLayout(); // This now renders immediately
        await this.loadPowerData(); // This updates the render with power data
        this.startAutoRefresh();
    }

    async loadPanelLayout() {
        try {
            console.log('Loading panel layout...');
            
            // Check if local layout is configured
            if (CONFIG.localLayout && Array.isArray(CONFIG.localLayout) && CONFIG.localLayout.length > 0) {
                console.log('Using local panel layout from config');
                // Use local layout directly - panels are already in the correct format
                this.panels = CONFIG.localLayout.map((panel, index) => {
                    return {
                        ...panel,
                        // Ensure all required fields are present
                        id: panel.id || panel.inverterSerialNumber || `panel-${index}`,
                        serialNumber: panel.serialNumber || panel.inverterSerialNumber,
                        inverterSerialNumber: panel.inverterSerialNumber,
                        x: panel.x || 0,
                        y: panel.y || 0,
                        width: panel.width || 80,
                        height: panel.height || 120,
                        planeRotation: panel.planeRotation || 0
                    };
                });
                console.log(`Loaded ${this.panels.length} panels from local layout`);
            } else {
                // Fetch from API
                const url = CONFIG.apiBaseUrl + CONFIG.panelLayoutEndpoint;
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Panel layout data received:', data);
                
                // Handle the specific JSON format: {result: {panels: [...]}, success: "true"}
                let panelsArray = [];
                if (data.result && data.result.panels) {
                    panelsArray = data.result.panels;
                } else if (Array.isArray(data)) {
                    panelsArray = data;
                } else if (data.panels) {
                    panelsArray = data.panels;
                } else if (data.Panels) {
                    panelsArray = data.Panels;
                }
                
                console.log(`Found ${panelsArray.length} panels`);
                
                // Convert the API format to our internal format
                // API format: {xCoordinate, yCoordinate, planeRotation, inverterSerialNumber}
                
                // First, find the minimum y coordinate to calculate offset for all panels
                const allYCoords = panelsArray.map(p => p.yCoordinate || p.y || 0);
                const minY = Math.min(...allYCoords);
                const yOffset = minY < 0 ? Math.abs(minY) + 50 : 50; // Offset to make all panels visible

                // Next, find minimum X to calculate an offset for all PV6-based coordinates
                const allXCoords = panelsArray.map(p => p.xCoordinate || p.x || 0);
                const minX = Math.min(...allXCoords);
                const xOffset = minX < 0 ? Math.abs(minX) + 50 : 50; // Same idea as yOffset
                
                this.panels = panelsArray.map((panel, index) => {
                // Normalize coordinates (handle negative y values by offsetting)
                const x = (panel.xCoordinate || panel.x || Math.floor(index / 10) * 120 + 50) + xOffset;
                const y = (panel.yCoordinate || panel.y || Math.floor(index / 10) * 120 + 50) + yOffset;
                
                // Get rotation angle (normalize to 0-360)
                const rotation = (panel.planeRotation || 0) % 360;
                
                // Base dimensions for a panel (portrait: taller than wide)
                const baseWidth = panel.width || 80;   // Narrow dimension
                const baseHeight = panel.height || 120; // Tall dimension
                
                // Determine actual width/height based on rotation
                // 0° = portrait (taller than wide), 90° = landscape (wider than tall)
                let width, height;
                if (rotation === 0 || rotation === 180) {
                    // Portrait: taller than wide
                    width = baseWidth;
                    height = baseHeight;
                } else if (rotation === 90 || rotation === 270) {
                    // Landscape: wider than tall
                    width = baseHeight;
                    height = baseWidth;
                } else {
                    // For other angles, use the larger dimension for both to ensure visibility
                    const maxDim = Math.max(baseWidth, baseHeight);
                    width = maxDim;
                    height = maxDim;
                }
                
                return {
                    // Keep original data
                    ...panel,
                    // Map to our standard format
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    id: panel.inverterSerialNumber || panel.id || panel.ID || `panel-${index}`,
                    serialNumber: panel.inverterSerialNumber || panel.serialNumber || panel.SerialNumber,
                    inverterSerialNumber: panel.inverterSerialNumber,
                    planeRotation: rotation
                };
            });
            
                console.log('Processed panels:', this.panels);
            }
            
            if (this.panels.length === 0) {
                console.warn('No panels found in data, creating default panels');
                this.createDefaultPanels();
            }
            
            // Resolve any overlapping panels
            this.resolveOverlaps();
            
            this.updateStatus(`Panel layout loaded: ${this.panels.length} panels`);
            this.updateSummary(); // Update summary to show total panels count
            
            // Render immediately with zero power (will be updated when power data loads)
            if (this.maxPower === 0) {
                this.maxPower = 400; // Default for color scaling
            }
            this.render();
        } catch (error) {
            console.error('Error loading panel layout:', error);
            this.updateStatus(`Error loading panel layout: ${error.message}`);
            // Create default panels if API fails
            this.createDefaultPanels();
            // Resolve any overlapping panels
            this.resolveOverlaps();
            this.updateSummary(); // Update summary to show total panels count
            
            // Render immediately with zero power (will be updated when power data loads)
            if (this.maxPower === 0) {
                this.maxPower = 400; // Default for color scaling
            }
            this.render();
        }
    }
    
    createDefaultPanels() {
        // Create some default panels for testing (rectangular, non-overlapping)
        this.panels = [];
        const baseWidth = 80;   // Narrow dimension (for portrait)
        const baseHeight = 120; // Tall dimension (for portrait)
        const spacingX = 20; // Horizontal spacing between panels
        const spacingY = 20; // Vertical spacing between panels
        const cols = 4;
        
        for (let i = 0; i < 12; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            // Alternate between 0° (portrait) and 90° (landscape) for variety
            const rotation = (i % 2 === 0) ? 0 : 90;
            
            // Determine dimensions based on rotation
            let width, height;
            if (rotation === 0 || rotation === 180) {
                width = baseWidth;
                height = baseHeight;
            } else {
                width = baseHeight;
                height = baseWidth;
            }
            
            this.panels.push({
                id: `panel-${i}`,
                serialNumber: `SN-${i}`,
                x: 50 + col * (Math.max(width, baseHeight) + spacingX),
                y: 50 + row * (Math.max(height, baseHeight) + spacingY),
                width: width,
                height: height,
                planeRotation: rotation
            });
        }
        console.log('Created default panels:', this.panels);
    }
    
    // Check if two panels overlap
    panelsOverlap(panel1, panel2) {
        return !(panel1.x + panel1.width <= panel2.x ||
                 panel2.x + panel2.width <= panel1.x ||
                 panel1.y + panel1.height <= panel2.y ||
                 panel2.y + panel2.height <= panel1.y);
    }
    
    // Resolve overlapping panels by shifting them
    resolveOverlaps() {
        const padding = 10; // Minimum spacing between panels
        let moved = true;
        let iterations = 0;
        const maxIterations = 100; // Prevent infinite loops
        
        while (moved && iterations < maxIterations) {
            moved = false;
            iterations++;
            
            for (let i = 0; i < this.panels.length; i++) {
                for (let j = i + 1; j < this.panels.length; j++) {
                    const panel1 = this.panels[i];
                    const panel2 = this.panels[j];
                    
                    if (this.panelsOverlap(panel1, panel2)) {
                        // Calculate overlap amounts
                        const overlapX = Math.min(
                            panel1.x + panel1.width - panel2.x,
                            panel2.x + panel2.width - panel1.x
                        );
                        const overlapY = Math.min(
                            panel1.y + panel1.height - panel2.y,
                            panel2.y + panel2.height - panel1.y
                        );
                        
                        // Move panels apart based on which overlap is smaller
                        if (overlapX < overlapY) {
                            // Move horizontally
                            const moveAmount = (overlapX + padding) / 2;
                            if (panel1.x < panel2.x) {
                                panel1.x = Math.max(0, panel1.x - moveAmount);
                                panel2.x = panel2.x + moveAmount;
                            } else {
                                panel2.x = Math.max(0, panel2.x - moveAmount);
                                panel1.x = panel1.x + moveAmount;
                            }
                        } else {
                            // Move vertically
                            const moveAmount = (overlapY + padding) / 2;
                            if (panel1.y < panel2.y) {
                                panel1.y = Math.max(0, panel1.y - moveAmount);
                                panel2.y = panel2.y + moveAmount;
                            } else {
                                panel2.y = Math.max(0, panel2.y - moveAmount);
                                panel1.y = panel1.y + moveAmount;
                            }
                        }
                        
                        moved = true;
                    }
                }
            }
        }
        
        if (iterations >= maxIterations) {
            console.warn('Overlap resolution reached max iterations');
        } else if (moved) {
            console.log(`Resolved panel overlaps in ${iterations} iterations`);
        }
    }

    async loadPowerData() {
        try {
            console.log('Loading power data...');
            const url = CONFIG.apiBaseUrl + CONFIG.powerDataEndpoint;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Power data received:', data);
            
            // Store power data by serial number or ID
            this.powerData = {};
            // Reset maxPower to recalculate from new data
            this.maxPower = 0;
            
            const devices = Array.isArray(data) ? data : (data.devices || data.DeviceList || data.Devices || []);
            
            console.log(`Found ${devices.length} total devices`);
            
            // Filter for inverters only (solar panels)
            const inverters = devices.filter(device => {
                return device.DEVICE_TYPE === "Inverter" || 
                       device.TYPE === "SOLARBRIDGE" ||
                       (device.DESCR && device.DESCR.includes("Inverter"));
            });
            
            console.log(`Found ${inverters.length} inverters (solar panels)`);
            
            inverters.forEach(device => {
                // Use SERIAL field (uppercase) to match with panel inverterSerialNumber
                const serial = device.SERIAL || device.serialNumber || device.SerialNumber || 
                              device.inverterSerialNumber || device.InverterSerialNumber ||
                              device.id || device.ID;
                
                if (serial) {
                    // Store by serial number
                    this.powerData[serial] = device;
                    
                    // Also store by lowercase version if different
                    if (serial !== serial.toLowerCase()) {
                        this.powerData[serial.toLowerCase()] = device;
                    }
                    
                    // Track maximum power for color scaling
                    const power = this.getPowerValue(device);
                    if (power > this.maxPower) {
                        this.maxPower = power;
                    }
                    
                    console.log(`Stored power data for ${serial}: ${power}W`);
                }
            });
            
            // If no max power found, set a default for color scaling
            if (this.maxPower === 0) {
                this.maxPower = 400; // Default max power for color scaling
                console.log('No power data found, using default max power for color scaling');
            }
            
            console.log('Power data processed. Max power:', this.maxPower);
            console.log('Power data stored, keys:', Object.keys(this.powerData));
            console.log('About to render, powerData reference check:', this.powerData !== null);
            this.updateStatus(`Power data loaded - ${new Date().toLocaleTimeString()}`);
            this.updateSummary();
            this.render();
        } catch (error) {
            console.error('Error loading power data:', error);
            this.updateStatus(`Error loading power data: ${error.message}`);
            // Still render with default/zero power
            if (this.maxPower === 0) {
                this.maxPower = 400; // Default for color scaling
            }
            this.updateSummary();
            this.render();
        }
    }

    updateSummary() {
        let totalPower = 0;
        let activePanels = 0;
        
        // Calculate total power from all panels
        this.panels.forEach(panel => {
            const powerInfo = this.powerData[panel.id] || 
                             this.powerData[panel.serialNumber] || 
                             this.powerData[panel.inverterSerialNumber] || {};
            const power = this.getPowerValue(powerInfo);
            
            if (power > 0) {
                totalPower += power;
                activePanels++;
            }
        });
        
        // Update summary display
        const totalPowerElement = document.getElementById('totalPower');
        const activePanelsElement = document.getElementById('activePanels');
        const totalPanelsElement = document.getElementById('totalPanels');
        
        if (totalPowerElement) {
            // Format power: show kW if >= 1000W, otherwise show W
            if (totalPower >= 1000) {
                totalPowerElement.textContent = `${(totalPower / 1000).toFixed(2)} kW`;
            } else {
                totalPowerElement.textContent = `${totalPower.toFixed(1)} W`;
            }
        }
        
        if (activePanelsElement) {
            activePanelsElement.textContent = activePanels.toString();
        }
        
        if (totalPanelsElement) {
            totalPanelsElement.textContent = this.panels.length.toString();
        }
    }

    getPowerValue(device) {
        console.log('getPowerValue called with device:', device);
        console.log('Device type:', typeof device, 'Is object:', device && typeof device === 'object');
        
        if (!device || typeof device !== 'object') {
            console.log('getPowerValue: Invalid device object, returning 0');
            return 0;
        }
        
        // Try various possible power field names
        // p_3phsum_kw is in kilowatts, so convert to watts by multiplying by 1000
        console.log('Checking p_3phsum_kw:', {
            exists: 'p_3phsum_kw' in device,
            value: device.p_3phsum_kw,
            type: typeof device.p_3phsum_kw,
            isUndefined: device.p_3phsum_kw === undefined,
            isNull: device.p_3phsum_kw === null,
            isEmpty: device.p_3phsum_kw === ''
        });
        
        if (device.p_3phsum_kw !== undefined && device.p_3phsum_kw !== null && device.p_3phsum_kw !== '') {
            const value = parseFloat(device.p_3phsum_kw);
            console.log('p_3phsum_kw parsed:', {
                raw: device.p_3phsum_kw,
                parsed: value,
                isNaN: isNaN(value),
                result: !isNaN(value) ? value * 1000 : 'NaN'
            });
            if (!isNaN(value)) {
                const result = value * 1000;
                console.log('getPowerValue returning (from p_3phsum_kw):', result, 'W');
                return result; // Convert kW to W
            }
        }
        
        console.log('Checking p_3phsum_kW:', {
            exists: 'p_3phsum_kW' in device,
            value: device.p_3phsum_kW,
            type: typeof device.p_3phsum_kW
        });
        
        if (device.p_3phsum_kW !== undefined && device.p_3phsum_kW !== null && device.p_3phsum_kW !== '') {
            const value = parseFloat(device.p_3phsum_kW);
            console.log('p_3phsum_kW parsed:', {
                raw: device.p_3phsum_kW,
                parsed: value,
                isNaN: isNaN(value),
                result: !isNaN(value) ? value * 1000 : 'NaN'
            });
            if (!isNaN(value)) {
                const result = value * 1000;
                console.log('getPowerValue returning (from p_3phsum_kW):', result, 'W');
                return result; // Convert kW to W
            }
        }
        
        // Fallback to other possible field names (already in watts)
        console.log('Checking fallback power fields:', {
            power: device.power,
            Power: device.Power,
            powerWatts: device.powerWatts,
            PowerWatts: device.PowerWatts,
            currentPower: device.currentPower,
            CurrentPower: device.CurrentPower,
            instantPower: device.instantPower,
            InstantPower: device.InstantPower
        });
        
        const fallbackValue = device.power || device.Power || device.powerWatts || device.PowerWatts || 
               device.currentPower || device.CurrentPower || 
               device.instantPower || device.InstantPower || 0;
        
        console.log('Fallback value selected:', fallbackValue, 'type:', typeof fallbackValue);
        
        const fallback = parseFloat(fallbackValue);
        console.log('Fallback parsed:', {
            raw: fallbackValue,
            parsed: fallback,
            isNaN: isNaN(fallback)
        });
        
        const result = isNaN(fallback) ? 0 : fallback;
        console.log('getPowerValue returning (from fallback):', result, 'W');
        return result;
    }

    setupEventListeners() {
        const canvas = document.getElementById('panelCanvas');
        const refreshNowBtn = document.getElementById('refreshNow');
        const refreshIntervalInput = document.getElementById('refreshInterval');
        const exportLayoutBtn = document.getElementById('exportLayout');
        const editPlacementCheckbox = document.getElementById('editPlacement');
        const tooltip = document.getElementById('tooltip');

        // Refresh now button
        refreshNowBtn.addEventListener('click', () => {
            this.loadPowerData();
        });

        // Refresh interval input
        refreshIntervalInput.addEventListener('change', (e) => {
            this.refreshIntervalMinutes = parseInt(e.target.value) || 5;
            this.startAutoRefresh();
        });

        // Export layout button
        if (exportLayoutBtn) {
            exportLayoutBtn.addEventListener('click', () => {
                this.exportPanelLayout();
            });
        }

        // Edit placement checkbox
        if (editPlacementCheckbox) {
            editPlacementCheckbox.addEventListener('change', (e) => {
                this.editPlacementEnabled = e.target.checked;
                this.updateCursorStyle();
            });
        }

        // Mouse events for dragging
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', () => this.handleMouseUp());
        canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        // Tooltip positioning
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) {
                this.updateTooltip(e);
            }
        });
    }

    handleMouseDown(e) {
        // Only allow dragging if edit placement is enabled
        if (!this.editPlacementEnabled) {
            return;
        }

        const canvas = document.getElementById('panelCanvas');
        
        // Use SVG element-based detection for accurate hit testing
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        let panelElement = null;
        if (elementAtPoint) {
            if (elementAtPoint.classList && elementAtPoint.classList.contains('panel')) {
                panelElement = elementAtPoint;
            } else if (elementAtPoint.parentElement && 
                      elementAtPoint.parentElement.querySelector && 
                      elementAtPoint.parentElement.querySelector('.panel')) {
                panelElement = elementAtPoint.parentElement.querySelector('.panel');
            }
        }
        
        // Find panel by element ID
        let panel = null;
        if (panelElement) {
            const panelId = panelElement.getAttribute('data-panel-id');
            panel = this.panels.find(p => 
                (p.id === panelId) || 
                (p.serialNumber === panelId) || 
                (p.inverterSerialNumber === panelId)
            );
        }
        
        // Fallback to coordinate-based detection
        if (!panel) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            panel = this.panels.find(p => {
                // Account for rotation in hit detection
                if (p.planeRotation && p.planeRotation !== 0 && p.planeRotation !== 180 && 
                    p.planeRotation !== 90 && p.planeRotation !== 270) {
                    const rad = (p.planeRotation * Math.PI) / 180;
                    const cos = Math.abs(Math.cos(rad));
                    const sin = Math.abs(Math.sin(rad));
                    const rotatedWidth = p.width * cos + p.height * sin;
                    const rotatedHeight = p.width * sin + p.height * cos;
                    return x >= p.x && x <= p.x + rotatedWidth &&
                           y >= p.y && y <= p.y + rotatedHeight;
                } else {
                    return x >= p.x && x <= p.x + p.width &&
                           y >= p.y && y <= p.y + p.height;
                }
            });
        }

        if (panel) {
            this.isDragging = true;
            this.dragPanel = panel;
            this.dragOffset = {
                x: x - panel.x,
                y: y - panel.y
            };
            canvas.style.cursor = 'grabbing';
            
            // Hide tooltip when dragging starts
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.classList.add('hidden');
            }
        }
    }

    handleMouseMove(e) {
        // Stop dragging if edit mode is disabled
        if (this.isDragging && !this.editPlacementEnabled) {
            this.handleMouseUp();
            return;
        }
        
        if (this.isDragging && this.dragPanel) {
            const canvas = document.getElementById('panelCanvas');
            const rect = canvas.getBoundingClientRect();
            let x = e.clientX - rect.left - this.dragOffset.x;
            let y = e.clientY - rect.top - this.dragOffset.y;

            // Keep panel within canvas bounds
            x = Math.max(0, x);
            y = Math.max(0, y);
            
            // Check for overlaps with other panels and adjust position
            const padding = 5; // Minimum spacing
            for (const panel of this.panels) {
                if (panel !== this.dragPanel && this.panelsOverlap({
                    x: x, y: y, 
                    width: this.dragPanel.width, 
                    height: this.dragPanel.height
                }, panel)) {
                    // Calculate how to move to avoid overlap
                    const overlapX = Math.min(
                        x + this.dragPanel.width - panel.x,
                        panel.x + panel.width - x
                    );
                    const overlapY = Math.min(
                        y + this.dragPanel.height - panel.y,
                        panel.y + panel.height - y
                    );
                    
                    if (overlapX < overlapY) {
                        // Adjust horizontally
                        if (x < panel.x) {
                            x = panel.x - this.dragPanel.width - padding;
                        } else {
                            x = panel.x + panel.width + padding;
                        }
                    } else {
                        // Adjust vertically
                        if (y < panel.y) {
                            y = panel.y - this.dragPanel.height - padding;
                        } else {
                            y = panel.y + panel.height + padding;
                        }
                    }
                }
            }

            // Update panel position
            this.dragPanel.x = Math.max(0, x);
            this.dragPanel.y = Math.max(0, y);
            this.render();
        }
    }

    handleMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragPanel = null;
            const canvas = document.getElementById('panelCanvas');
            // Reset cursor based on edit mode
            if (this.editPlacementEnabled) {
                canvas.style.cursor = 'move';
            } else {
                canvas.style.cursor = 'default';
            }
        }
    }

    updateTooltip(e) {
        const canvas = document.getElementById('panelCanvas');
        const tooltip = document.getElementById('tooltip');
        
        // Find the element at the mouse position
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        
        // Traverse up the DOM tree to find a panel element
        let panelElement = null;
        let currentElement = elementAtPoint;
        
        while (currentElement && currentElement !== canvas && !panelElement) {
            // Check if current element is a panel rect
            if (currentElement.classList && currentElement.classList.contains('panel')) {
                panelElement = currentElement;
                break;
            }
            // Check if current element contains a panel rect
            if (currentElement.querySelector) {
                const panelRect = currentElement.querySelector('.panel');
                if (panelRect) {
                    panelElement = panelRect;
                    break;
                }
            }
            // Move up to parent
            currentElement = currentElement.parentElement || currentElement.parentNode;
        }
        
        // Find panel by element ID
        let panel = null;
        if (panelElement) {
            const panelId = panelElement.getAttribute('data-panel-id');
            if (panelId) {
                panel = this.panels.find(p => 
                    (p.id === panelId) || 
                    (p.serialNumber === panelId) || 
                    (p.inverterSerialNumber === panelId)
                );
            }
        }
        
        // Fallback: use coordinate-based detection with proper SVG coordinate transformation
        if (!panel) {
            const rect = canvas.getBoundingClientRect();
            const svgPoint = canvas.createSVGPoint();
            svgPoint.x = e.clientX;
            svgPoint.y = e.clientY;
            
            // Transform screen coordinates to SVG coordinates
            const ctm = canvas.getScreenCTM();
            if (ctm) {
                const inverseCTM = ctm.inverse();
                const transformedPoint = svgPoint.matrixTransform(inverseCTM);
                const x = transformedPoint.x;
                const y = transformedPoint.y;
                
                panel = this.panels.find(p => {
                    // Check if point is within panel bounds (accounting for rotation)
                    // For rotated panels, we need to check the actual rotated rectangle
                    if (p.planeRotation && p.planeRotation !== 0 && p.planeRotation !== 180 && 
                        p.planeRotation !== 90 && p.planeRotation !== 270) {
                        // For arbitrary rotations, check against rotated bounding box
                        const rad = (p.planeRotation * Math.PI) / 180;
                        const cos = Math.abs(Math.cos(rad));
                        const sin = Math.abs(Math.sin(rad));
                        const rotatedWidth = p.width * cos + p.height * sin;
                        const rotatedHeight = p.width * sin + p.height * cos;
                        return x >= p.x && x <= p.x + rotatedWidth &&
                               y >= p.y && y <= p.y + rotatedHeight;
                    } else {
                        // For 0°, 90°, 180°, 270° - dimensions are already swapped if needed
                        return x >= p.x && x <= p.x + p.width &&
                               y >= p.y && y <= p.y + p.height;
                    }
                });
            } else {
                // Fallback to simple coordinate calculation if CTM not available
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                panel = this.panels.find(p => {
                    return x >= p.x && x <= p.x + p.width &&
                           y >= p.y && y <= p.y + p.height;
                });
            }
        }

        if (panel) {
            const powerInfo = this.powerData[panel.id] || 
                             this.powerData[panel.serialNumber] || 
                             this.powerData[panel.inverterSerialNumber] || {};
            this.showTooltip(e.clientX, e.clientY, panel, powerInfo);
            // Update cursor based on edit mode
            if (this.editPlacementEnabled) {
                canvas.style.cursor = 'move';
            } else {
                canvas.style.cursor = 'default';
            }
        } else {
            tooltip.classList.add('hidden');
            canvas.style.cursor = 'default';
        }
    }

    updateCursorStyle() {
        const canvas = document.getElementById('panelCanvas');
        if (!canvas) return;
        
        // Update cursor style based on edit mode
        // The cursor will be updated dynamically when hovering over panels
        if (!this.editPlacementEnabled) {
            canvas.style.cursor = 'default';
        }
    }

    showTooltip(x, y, panel, powerInfo) {
        const tooltip = document.getElementById('tooltip');
        tooltip.classList.remove('hidden');
        
        let html = `<h3>Panel Details</h3>`;
        
        // Add all panel properties
        Object.keys(panel).forEach(key => {
            if (key !== 'x' && key !== 'y' && key !== 'width' && key !== 'height') {
                html += `<p><span class="label">${key}:</span> ${panel[key]}</p>`;
            }
        });
        
        // Add all power info properties
        Object.keys(powerInfo).forEach(key => {
            html += `<p><span class="label">${key}:</span> ${powerInfo[key]}</p>`;
        });
        
        tooltip.innerHTML = html;
        
        // Initial position (to the right and below cursor)
        const offset = 10;
        let tooltipX = x + offset;
        let tooltipY = y + offset;
        
        // Temporarily position tooltip to get accurate dimensions
        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY}px`;
        
        // Get tooltip dimensions after rendering
        const tooltipRect = tooltip.getBoundingClientRect();
        const tooltipWidth = tooltipRect.width;
        const tooltipHeight = tooltipRect.height;
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust horizontal position if tooltip goes off screen
        if (tooltipX + tooltipWidth > viewportWidth) {
            // Try positioning to the left of cursor
            tooltipX = x - tooltipWidth - offset;
            // If still off screen on the left, position at screen edge
            if (tooltipX < 0) {
                tooltipX = offset;
            }
        }
        // Ensure tooltip doesn't go off left edge
        if (tooltipX < 0) {
            tooltipX = offset;
        }
        
        // Adjust vertical position if tooltip goes off screen
        if (tooltipY + tooltipHeight > viewportHeight) {
            // Try positioning above cursor
            tooltipY = y - tooltipHeight - offset;
            // If still off screen at top, position at screen edge
            if (tooltipY < 0) {
                tooltipY = offset;
            }
        }
        // Ensure tooltip doesn't go off top edge
        if (tooltipY < 0) {
            tooltipY = offset;
        }
        
        // Apply final position
        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY}px`;
        
        // Final check: verify tooltip is fully on screen and adjust if needed
        const finalRect = tooltip.getBoundingClientRect();
        let adjustedX = tooltipX;
        let adjustedY = tooltipY;
        
        // Ensure tooltip doesn't go off right edge
        if (finalRect.right > viewportWidth) {
            adjustedX = viewportWidth - tooltipWidth - offset;
        }
        // Ensure tooltip doesn't go off left edge
        if (finalRect.left < 0) {
            adjustedX = offset;
        }
        // Ensure tooltip doesn't go off bottom edge
        if (finalRect.bottom > viewportHeight) {
            adjustedY = viewportHeight - tooltipHeight - offset;
        }
        // Ensure tooltip doesn't go off top edge
        if (finalRect.top < 0) {
            adjustedY = offset;
        }
        
        // If tooltip is larger than viewport, center it
        if (tooltipWidth > viewportWidth - 2 * offset) {
            adjustedX = Math.max(offset, (viewportWidth - tooltipWidth) / 2);
        }
        if (tooltipHeight > viewportHeight - 2 * offset) {
            adjustedY = Math.max(offset, (viewportHeight - tooltipHeight) / 2);
        }
        
        // Apply any final adjustments
        if (adjustedX !== tooltipX || adjustedY !== tooltipY) {
            tooltip.style.left = `${adjustedX}px`;
            tooltip.style.top = `${adjustedY}px`;
        }
    }

    getColorForPower(power) {
        if (this.maxPower === 0) return '#000000'; // Black for no power
        
        // If power is 0, return black
        if (power === 0) return '#000000';
        
        // Calculate ratio, but ensure any non-zero power has at least some visible color
        // Minimum green value of 30 (out of 255) for any panel with power > 0
        const ratio = Math.min(power / this.maxPower, 1);
        const minGreen = 30; // Minimum green value for visibility
        const maxGreen = 255;
        const greenRange = maxGreen - minGreen;
        
        // Scale from minGreen to maxGreen based on ratio
        const g = Math.floor(minGreen + (greenRange * ratio));
        
        // Interpolate from dark green to bright green
        const r = Math.floor(0);
        const b = Math.floor(0);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    render() {
        const canvas = document.getElementById('panelCanvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        const svgNS = 'http://www.w3.org/2000/svg';
        
        // Clear canvas
        canvas.innerHTML = '';
        
        console.log(`Rendering ${this.panels.length} panels`);
        console.log('Power data available:', Object.keys(this.powerData).length, 'devices');
        console.log('Max power:', this.maxPower);
        console.log('Power data keys (first 5):', Object.keys(this.powerData).slice(0, 5));
        
        if (this.panels.length === 0) {
            console.warn('No panels to render!');
            // Set minimum canvas size
            canvas.setAttribute('width', window.innerWidth);
            canvas.setAttribute('height', window.innerHeight - 100);
            return;
        }
        
        // Calculate canvas size based on panel positions
        // Account for rotation by calculating bounding box
        let maxX = 0, maxY = 0;
        this.panels.forEach(panel => {
            // For rotated panels, calculate the bounding box
            if (panel.planeRotation && panel.planeRotation !== 0 && panel.planeRotation !== 180) {
                // For 90° and 270° rotations, dimensions are already swapped
                // For other angles, we use square dimensions
                const rad = (panel.planeRotation * Math.PI) / 180;
                const cos = Math.abs(Math.cos(rad));
                const sin = Math.abs(Math.sin(rad));
                const rotatedWidth = panel.width * cos + panel.height * sin;
                const rotatedHeight = panel.width * sin + panel.height * cos;
                maxX = Math.max(maxX, panel.x + rotatedWidth);
                maxY = Math.max(maxY, panel.y + rotatedHeight);
            } else {
                // For 0° and 180°, no rotation adjustment needed
                maxX = Math.max(maxX, panel.x + panel.width);
                maxY = Math.max(maxY, panel.y + panel.height);
            }
        });
        
        const canvasWidth = Math.max(maxX + 50, window.innerWidth);
        const canvasHeight = Math.max(maxY + 50, window.innerHeight - 100);
        
        canvas.setAttribute('width', canvasWidth);
        canvas.setAttribute('height', canvasHeight);
        canvas.setAttribute('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);
        canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        console.log(`Canvas size: ${canvasWidth}x${canvasHeight}`);
        
        // Render each panel
        this.panels.forEach((panel, index) => {
            // Try multiple ways to match panel to power data
            const powerInfo = this.powerData[panel.id] || 
                             this.powerData[panel.serialNumber] || 
                             this.powerData[panel.inverterSerialNumber] || {};
            
            // Debug matching
            if (index < 3) { // Log first 3 panels for debugging
                console.log(`Panel ${index} matching:`, {
                    id: panel.id,
                    serialNumber: panel.serialNumber,
                    inverterSerialNumber: panel.inverterSerialNumber,
                    foundPowerInfo: !!powerInfo && Object.keys(powerInfo).length > 0,
                    powerDataKeys: Object.keys(this.powerData).slice(0, 5)
                });
            }
            
            const power = this.getPowerValue(powerInfo);
            const color = this.getColorForPower(power);
            
            console.log(`Panel ${index}: id=${panel.id}, power=${power}, color=${color}, pos=(${panel.x},${panel.y}), size=${panel.width}x${panel.height}, rotation=${panel.planeRotation}°`);
            
            // Create a group for the panel to apply rotation
            const group = document.createElementNS(svgNS, 'g');
            
            // Calculate center point for rotation
            const centerX = panel.x + panel.width / 2;
            const centerY = panel.y + panel.height / 2;
            
            // Apply rotation transform only for angles that aren't 0/90/180/270
            // For 0/90/180/270, dimensions are already swapped, so no visual rotation needed
            if (panel.planeRotation && 
                panel.planeRotation !== 0 && 
                panel.planeRotation !== 90 && 
                panel.planeRotation !== 180 && 
                panel.planeRotation !== 270) {
                group.setAttribute('transform', `rotate(${panel.planeRotation} ${centerX} ${centerY})`);
            }
            
            // Create panel rectangle (positioned relative to top-left corner)
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', panel.x);
            rect.setAttribute('y', panel.y);
            rect.setAttribute('width', panel.width);
            rect.setAttribute('height', panel.height);
            rect.setAttribute('fill', color);
            rect.setAttribute('class', 'panel');
            rect.setAttribute('data-panel-id', panel.id || panel.serialNumber);
            group.appendChild(rect);
            
            // Add power text
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', centerX);
            text.setAttribute('y', centerY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('class', 'panel-text');
            text.textContent = `${power.toFixed(1)}W`;
            group.appendChild(text);
            
            canvas.appendChild(group);
        });
        
        console.log('Rendering complete, canvas children:', canvas.children.length);
        
        // Force a reflow/repaint to ensure SVG updates are applied
        // This is especially important in Selenium/headless browsers
        const dummy = canvas.offsetHeight; // Trigger reflow
        
        // Use requestAnimationFrame to ensure browser processes DOM changes
        requestAnimationFrame(() => {
            console.log('Render animation frame complete, final canvas children:', canvas.children.length);
        });
    }

    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        const intervalMs = this.refreshIntervalMinutes * 60 * 1000;
        this.refreshInterval = setInterval(() => {
            this.loadPowerData();
        }, intervalMs);
    }

    updateStatus(message) {
        const status = document.getElementById('status');
        status.textContent = message;
    }

    exportPanelLayout() {
        if (!this.panels || this.panels.length === 0) {
            alert('No panels to export');
            return;
        }

        // Create export data with only the essential fields
        const exportData = this.panels.map(panel => {
            return {
                id: panel.id,
                x: panel.x,
                y: panel.y,
                width: panel.width,
                height: panel.height,
                planeRotation: panel.planeRotation,
                inverterSerialNumber: panel.inverterSerialNumber,
                serialNumber: panel.serialNumber
            };
        });

        // Format as JSON string for config.js
        const jsonString = JSON.stringify(exportData, null, 4);
        
        // Create a formatted string for config.js
        const configString = `    localLayout: ${jsonString}`;

        // Create a blob and download it
        const blob = new Blob([configString], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'panel-layout-export.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Also copy to clipboard
        navigator.clipboard.writeText(configString).then(() => {
            this.updateStatus(`Panel layout exported! Copied to clipboard. (${this.panels.length} panels)`);
            console.log('Panel layout copied to clipboard:', configString);
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            this.updateStatus(`Panel layout exported to file! (${this.panels.length} panels)`);
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SolarPanelMonitor();
});


