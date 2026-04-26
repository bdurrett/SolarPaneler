class SolarPanelMonitor {
    constructor() {
        this.panels = [];
        this.powerData = {};
        this.maxPower = 0;
        this.refreshInterval = null;
        this.refreshIntervalMinutes = parseInt(localStorage.getItem('refreshIntervalMinutes')) || 5;
        this.isDragging = false;
        this.dragPanel = null;
        this.dragOffset = { x: 0, y: 0 };
        this.dragStartPosition = null;
        this.editPlacementEnabled = false;
        this.detailedMode = false;
        this.debug = false;

        // Zoom & pan
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.panStartScreen = { x: 0, y: 0 };
        this.panStartValues = { x: 0, y: 0 };

        // Base canvas dimensions (SVG user-space extent)
        this.baseCanvasWidth = 800;
        this.baseCanvasHeight = 600;

        this.gridSize = 10;

        this.init();
    }

    log(...args) {
        if (this.debug) console.log(...args);
    }

    async init() {
        this.setupEventListeners();
        const input = document.getElementById('refreshInterval');
        if (input) input.value = this.refreshIntervalMinutes;
        // Load power data first so inverter serials are available
        // if we need to auto-generate panels from them
        await this.loadPowerData();
        await this.loadPanelLayout();
        this.startAutoRefresh();
    }

    // Look up power data for a panel by any of its identifier fields
    getPanelPowerInfo(panel) {
        return this.powerData[panel.id] ||
               this.powerData[panel.serialNumber] ||
               this.powerData[panel.inverterSerialNumber] || {};
    }

    // Convert screen coords to SVG user-space coords (respects viewBox / zoom / pan)
    screenToSVG(screenX, screenY) {
        const canvas = document.getElementById('panelCanvas');
        const svgPoint = canvas.createSVGPoint();
        svgPoint.x = screenX;
        svgPoint.y = screenY;
        const ctm = canvas.getScreenCTM();
        if (ctm) return svgPoint.matrixTransform(ctm.inverse());
        const rect = canvas.getBoundingClientRect();
        return { x: screenX - rect.left, y: screenY - rect.top };
    }

    snapToGrid(value) {
        if (!this.gridSize) return value;
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    // Apply current zoom/pan to the SVG viewBox
    updateViewBox() {
        const canvas = document.getElementById('panelCanvas');
        if (!canvas || !this.baseCanvasWidth) return;
        const w = this.baseCanvasWidth / this.zoom;
        const h = this.baseCanvasHeight / this.zoom;
        canvas.setAttribute('viewBox', `${this.panX} ${this.panY} ${w} ${h}`);
    }

    // Fit all panels into view
    fitAllPanels() {
        if (this.panels.length === 0 || !this.baseCanvasWidth) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.panels.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x + p.width);
            maxY = Math.max(maxY, p.y + p.height);
        });

        const pad = 40;
        const contentW = (maxX - minX) + pad * 2;
        const contentH = (maxY - minY) + pad * 2;

        this.panX = minX - pad;
        this.panY = minY - pad;
        const zoomByWidth = this.baseCanvasWidth / contentW;
        const zoomByHeight = this.baseCanvasHeight / contentH;
        this.zoom = Math.min(zoomByWidth, zoomByHeight, 3);

        this.updateViewBox();
    }

    async loadPanelLayout() {
        try {
            console.log('Loading panel layout...');
            const response = await fetch('api.php?action=layout');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            let panelsArray = [];
            if (Array.isArray(data.panels)) panelsArray = data.panels;
            else if (Array.isArray(data)) panelsArray = data;
            else if (data.result && Array.isArray(data.result.panels)) panelsArray = data.result.panels;

            console.log(`Found ${panelsArray.length} panels`);

            const allYCoords = panelsArray.map(p => p.yCoordinate || p.y || 0);
            const minY = Math.min(...allYCoords);
            const yOffset = minY < 0 ? Math.abs(minY) + 50 : 50;

            this.panels = panelsArray.map((panel, index) => {
                const x = panel.xCoordinate || panel.x || (index % 10) * 120 + 50;
                const y = (panel.yCoordinate || panel.y || Math.floor(index / 10) * 120 + 50) + yOffset;
                const rotation = (panel.planeRotation || 0) % 360;
                const baseWidth = panel.width || 80;
                const baseHeight = panel.height || 120;

                let width, height;
                if (rotation === 0 || rotation === 180) {
                    width = baseWidth; height = baseHeight;
                } else if (rotation === 90 || rotation === 270) {
                    width = baseHeight; height = baseWidth;
                } else {
                    const maxDim = Math.max(baseWidth, baseHeight);
                    width = maxDim; height = maxDim;
                }

                return {
                    ...panel,
                    x, y, width, height,
                    id: panel.inverterSerialNumber || panel.id || panel.ID || `panel-${index}`,
                    serialNumber: panel.inverterSerialNumber || panel.serialNumber || panel.SerialNumber,
                    inverterSerialNumber: panel.inverterSerialNumber,
                    planeRotation: rotation
                };
            });

            console.log('Processed panels:', this.panels.length);

            if (this.panels.length === 0) {
                console.warn('No saved layout — auto-generating panels from inverter list');
                this.autoCreatePanelsFromInverters();
            }

            this.resolveOverlaps();
            this.updateStatus(`Panel layout loaded: ${this.panels.length} panels`);
            this.updateSummary();
            if (this.maxPower === 0) this.maxPower = 400;
            this.render();
            this.fitAllPanels();
        } catch (error) {
            console.error('Error loading panel layout:', error);
            this.updateStatus(`Error loading panel layout: ${error.message}`);
            this.autoCreatePanelsFromInverters();
            this.resolveOverlaps();
            this.updateSummary();
            if (this.maxPower === 0) this.maxPower = 400;
            this.render();
            this.fitAllPanels();
        }
    }

    createDefaultPanels() {
        this.panels = [];
        const baseWidth = 80, baseHeight = 120, spacingX = 20, spacingY = 20, cols = 4;
        for (let i = 0; i < 12; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const rotation = (i % 2 === 0) ? 0 : 90;
            const width  = (rotation === 0 || rotation === 180) ? baseWidth  : baseHeight;
            const height = (rotation === 0 || rotation === 180) ? baseHeight : baseWidth;
            this.panels.push({
                id: `panel-${i}`, serialNumber: `SN-${i}`,
                x: 50 + col * (Math.max(width, baseHeight) + spacingX),
                y: 50 + row * (Math.max(height, baseHeight) + spacingY),
                width, height, planeRotation: rotation
            });
        }
    }

    // Build a panel grid from discovered inverters when no saved layout exists.
    // Each panel gets the inverter serial number so power data matches immediately.
    autoCreatePanelsFromInverters() {
        // Deduplicate by serial (powerData has both original and lowercase keys)
        const seen = new Set();
        const inverters = Object.values(this.powerData).filter(inv => {
            if (seen.has(inv.serial)) return false;
            seen.add(inv.serial);
            return true;
        }).sort((a, b) => a.serial.localeCompare(b.serial));

        if (inverters.length === 0) {
            console.warn('No inverters found either — using placeholder panels');
            this.createDefaultPanels();
            return;
        }

        const baseWidth = 80, baseHeight = 120, spacingX = 20, spacingY = 20;
        const cols = Math.ceil(Math.sqrt(inverters.length));
        this.panels = inverters.map((inv, i) => ({
            id: inv.serial,
            serialNumber: inv.serial,
            inverterSerialNumber: inv.serial,
            x: 50 + (i % cols) * (baseWidth + spacingX),
            y: 50 + Math.floor(i / cols) * (baseHeight + spacingY),
            width: baseWidth,
            height: baseHeight,
            planeRotation: 0,
        }));
        console.log(`Auto-created ${this.panels.length} panels from inverter list`);
    }

    panelsOverlap(panel1, panel2) {
        return !(panel1.x + panel1.width <= panel2.x ||
                 panel2.x + panel2.width <= panel1.x ||
                 panel1.y + panel1.height <= panel2.y ||
                 panel2.y + panel2.height <= panel1.y);
    }

    resolveOverlaps() {
        const padding = 10;
        let moved = true;
        let iterations = 0;
        const maxIterations = 100;

        while (moved && iterations < maxIterations) {
            moved = false;
            iterations++;
            for (let i = 0; i < this.panels.length; i++) {
                for (let j = i + 1; j < this.panels.length; j++) {
                    const p1 = this.panels[i];
                    const p2 = this.panels[j];
                    if (this.panelsOverlap(p1, p2)) {
                        const ox = Math.min(p1.x + p1.width - p2.x, p2.x + p2.width - p1.x);
                        const oy = Math.min(p1.y + p1.height - p2.y, p2.y + p2.height - p1.y);
                        if (ox < oy) {
                            if (p1.x < p2.x) { p1.x = Math.max(0, p1.x - (ox + padding) / 2); p2.x += (ox + padding) / 2; }
                            else { p2.x = Math.max(0, p2.x - (ox + padding) / 2); p1.x += (ox + padding) / 2; }
                        } else {
                            if (p1.y < p2.y) { p1.y = Math.max(0, p1.y - (oy + padding) / 2); p2.y += (oy + padding) / 2; }
                            else { p2.y = Math.max(0, p2.y - (oy + padding) / 2); p1.y += (oy + padding) / 2; }
                        }
                        moved = true;
                    }
                }
            }
        }

        if (iterations >= maxIterations) console.warn('Overlap resolution reached max iterations');
    }

    async loadPowerData() {
        try {
            console.log('Loading power data...');
            const response = await fetch('api.php?action=power');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            this.powerData = {};
            this.maxPower = 0;

            const inverters = data.inverters || {};
            console.log(`Found ${Object.keys(inverters).length} inverters`);

            Object.entries(inverters).forEach(([serial, inv]) => {
                this.powerData[serial] = inv;
                // Also index by lowercase serial for case-insensitive lookup
                if (serial !== serial.toLowerCase()) {
                    this.powerData[serial.toLowerCase()] = inv;
                }
                if (inv.power_w > this.maxPower) this.maxPower = inv.power_w;
                this.log(`Stored power data for ${serial}: ${inv.power_w}W`);
            });

            if (this.maxPower === 0) {
                this.maxPower = 400;
                console.log('No power data found, using default max power');
            }

            this.updateStatus(`Power data loaded - ${new Date().toLocaleTimeString()}`);
            this.updateSummary();
            this.render();
        } catch (error) {
            console.error('Error loading power data:', error);
            this.updateStatus(`Error loading power data: ${error.message}`);
            if (this.maxPower === 0) this.maxPower = 400;
            this.updateSummary();
            this.render();
        }
    }

    updateSummary() {
        let totalPower = 0;
        let activePanels = 0;

        this.panels.forEach(panel => {
            const power = this.getPowerValue(this.getPanelPowerInfo(panel));
            if (power > 0) {
                totalPower += power;
                activePanels++;
            }
        });

        const avgPower = activePanels > 0 ? totalPower / activePanels : 0;

        const totalPowerEl   = document.getElementById('totalPower');
        const activePanelsEl = document.getElementById('activePanels');
        const totalPanelsEl  = document.getElementById('totalPanels');
        const avgPowerEl     = document.getElementById('avgPower');
        const lastUpdatedEl  = document.getElementById('lastUpdated');

        if (totalPowerEl) {
            totalPowerEl.textContent = totalPower >= 1000
                ? `${(totalPower / 1000).toFixed(2)} kW`
                : `${totalPower.toFixed(1)} W`;
        }
        if (activePanelsEl) activePanelsEl.textContent = activePanels.toString();
        if (totalPanelsEl)  totalPanelsEl.textContent  = this.panels.length.toString();
        if (avgPowerEl)     avgPowerEl.textContent      = activePanels > 0 ? `${avgPower.toFixed(1)} W` : '—';
        if (lastUpdatedEl)  lastUpdatedEl.textContent   = new Date().toLocaleTimeString();

        this.showNightModeIndicator(this.panels.length > 0 && totalPower === 0);
    }

    showNightModeIndicator(show) {
        const banner = document.getElementById('nightModeBanner');
        if (banner) banner.classList.toggle('hidden', !show);
    }

    getPowerValue(device) {
        if (!device || typeof device !== 'object') return 0;
        // New varserver format
        if (device.power_w !== undefined) return device.power_w;
        if (device.power_kw !== undefined) return device.power_kw * 1000;
        return 0;
    }

    setupEventListeners() {
        const canvas = document.getElementById('panelCanvas');
        const refreshNowBtn        = document.getElementById('refreshNow');
        const refreshIntervalInput = document.getElementById('refreshInterval');
        const exportLayoutBtn      = document.getElementById('exportLayout');
        const saveLayoutBtn        = document.getElementById('saveLayout');
        const diagnosticsBtn       = document.getElementById('diagnostics');
        const settingsBtn          = document.getElementById('settingsBtn');
        const settingsDialog       = document.getElementById('settingsDialog');
        const settingsClose        = document.getElementById('settingsClose');
        const editPlacementCheckbox = document.getElementById('editPlacement');
        const detailedModeToggle   = document.getElementById('detailedMode');
        const fitAllBtn            = document.getElementById('fitAll');

        refreshNowBtn.addEventListener('click', () => this.loadPowerData());

        refreshIntervalInput.addEventListener('change', (e) => {
            this.refreshIntervalMinutes = parseInt(e.target.value) || 5;
            localStorage.setItem('refreshIntervalMinutes', this.refreshIntervalMinutes);
            this.startAutoRefresh();
        });

        if (exportLayoutBtn) exportLayoutBtn.addEventListener('click', () => this.exportPanelLayout());
        if (saveLayoutBtn)   saveLayoutBtn.addEventListener('click',   () => this.saveLayoutToServer());
        if (diagnosticsBtn)  diagnosticsBtn.addEventListener('click',  () => openDiagnosticWindow());
        if (settingsBtn)     settingsBtn.addEventListener('click', () => settingsDialog.showModal());
        if (settingsClose)   settingsClose.addEventListener('click', () => settingsDialog.close());
        if (settingsDialog)  settingsDialog.addEventListener('click', (e) => {
            if (e.target === settingsDialog) settingsDialog.close();
        });
        if (fitAllBtn)       fitAllBtn.addEventListener('click', () => this.fitAllPanels());
        if (detailedModeToggle) detailedModeToggle.addEventListener('change', (e) => {
            this.detailedMode = e.target.checked;
        });

        if (editPlacementCheckbox) {
            editPlacementCheckbox.addEventListener('change', (e) => {
                this.editPlacementEnabled = e.target.checked;
                this.updateCursorStyle();
            });
        }

        // Ctrl+Z to undo last panel move
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && this.editPlacementEnabled) {
                this.undoLastMove();
                e.preventDefault();
            }
        });

        // Mouse events
        canvas.addEventListener('mousedown',  (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove',  (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup',    (e) => this.handleMouseUp(e));
        canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Zoom via scroll wheel
        canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Tooltip (skip while dragging or panning)
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging && !this.isPanning) this.updateTooltip(e);
        });

        // Touch events
        canvas.addEventListener('touchstart',  (e) => this.handleTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove',   (e) => this.handleTouchMove(e),  { passive: false });
        canvas.addEventListener('touchend',    () => this.handleMouseUp({}));
        canvas.addEventListener('touchcancel', () => this.handleMouseUp({}));
    }

    handleWheel(e) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.max(0.1, Math.min(10, this.zoom * factor));

        const canvas = document.getElementById('panelCanvas');
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const svgX = this.panX + (mx / rect.width)  * (this.baseCanvasWidth  / this.zoom);
        const svgY = this.panY + (my / rect.height) * (this.baseCanvasHeight / this.zoom);

        this.zoom = newZoom;
        this.panX = svgX - (mx / rect.width)  * (this.baseCanvasWidth  / this.zoom);
        this.panY = svgY - (my / rect.height) * (this.baseCanvasHeight / this.zoom);

        this.updateViewBox();
    }

    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const t = e.touches[0];
            this.handleMouseDown({ button: 0, clientX: t.clientX, clientY: t.clientY });
        }
    }

    handleTouchMove(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            const t = e.touches[0];
            this.handleMouseMove({ clientX: t.clientX, clientY: t.clientY });
        }
    }

    handleMouseDown(e) {
        if (e.button === 1) {
            this.isPanning = true;
            this.panStartScreen = { x: e.clientX, y: e.clientY };
            this.panStartValues = { x: this.panX, y: this.panY };
            e.preventDefault && e.preventDefault();
            return;
        }

        if (!this.editPlacementEnabled) return;

        const svgCoords = this.screenToSVG(e.clientX, e.clientY);

        let panel = null;
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        if (elementAtPoint) {
            let el = elementAtPoint;
            while (el) {
                if (el.classList && el.classList.contains('panel')) {
                    const panelId = el.getAttribute('data-panel-id');
                    panel = this.panels.find(p =>
                        p.id === panelId || p.serialNumber === panelId || p.inverterSerialNumber === panelId
                    );
                    break;
                }
                el = el.parentElement;
            }
        }

        if (!panel) {
            panel = this.panels.find(p =>
                svgCoords.x >= p.x && svgCoords.x <= p.x + p.width &&
                svgCoords.y >= p.y && svgCoords.y <= p.y + p.height
            );
        }

        if (panel) {
            this.dragStartPosition = { panel, x: panel.x, y: panel.y };
            this.isDragging = true;
            this.dragPanel = panel;
            this.dragOffset = { x: svgCoords.x - panel.x, y: svgCoords.y - panel.y };
            document.getElementById('panelCanvas').style.cursor = 'grabbing';
            const tooltip = document.getElementById('tooltip');
            if (tooltip) tooltip.classList.add('hidden');
        }
    }

    handleMouseMove(e) {
        if (this.isPanning) {
            const canvas = document.getElementById('panelCanvas');
            const rect = canvas.getBoundingClientRect();
            const dx = e.clientX - this.panStartScreen.x;
            const dy = e.clientY - this.panStartScreen.y;
            const svgDx = (dx / rect.width)  * (this.baseCanvasWidth  / this.zoom);
            const svgDy = (dy / rect.height) * (this.baseCanvasHeight / this.zoom);
            this.panX = this.panStartValues.x - svgDx;
            this.panY = this.panStartValues.y - svgDy;
            this.updateViewBox();
            return;
        }

        if (this.isDragging && !this.editPlacementEnabled) {
            this.handleMouseUp({});
            return;
        }

        if (this.isDragging && this.dragPanel) {
            const svgCoords = this.screenToSVG(e.clientX, e.clientY);
            let x = this.snapToGrid(Math.max(0, svgCoords.x - this.dragOffset.x));
            let y = this.snapToGrid(Math.max(0, svgCoords.y - this.dragOffset.y));

            const padding = 5;
            for (const panel of this.panels) {
                if (panel !== this.dragPanel && this.panelsOverlap(
                    { x, y, width: this.dragPanel.width, height: this.dragPanel.height }, panel
                )) {
                    const ox = Math.min(x + this.dragPanel.width - panel.x, panel.x + panel.width - x);
                    const oy = Math.min(y + this.dragPanel.height - panel.y, panel.y + panel.height - y);
                    if (ox < oy) {
                        x = x < panel.x ? panel.x - this.dragPanel.width - padding : panel.x + panel.width + padding;
                    } else {
                        y = y < panel.y ? panel.y - this.dragPanel.height - padding : panel.y + panel.height + padding;
                    }
                }
            }

            this.dragPanel.x = Math.max(0, x);
            this.dragPanel.y = Math.max(0, y);
            this.render();
        }
    }

    handleMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            document.getElementById('panelCanvas').style.cursor = 'default';
            return;
        }
        if (this.isDragging) {
            this.isDragging = false;
            this.dragPanel = null;
            const canvas = document.getElementById('panelCanvas');
            canvas.style.cursor = this.editPlacementEnabled ? 'move' : 'default';
        }
    }

    undoLastMove() {
        if (this.dragStartPosition) {
            const { panel, x, y } = this.dragStartPosition;
            panel.x = x;
            panel.y = y;
            this.dragStartPosition = null;
            this.render();
            this.updateStatus('Undo: panel position restored');
        }
    }

    updateTooltip(e) {
        const canvas = document.getElementById('panelCanvas');
        const tooltip = document.getElementById('tooltip');

        let panel = null;

        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        let el = elementAtPoint;
        while (el && el !== canvas) {
            if (el.classList && el.classList.contains('panel')) {
                const panelId = el.getAttribute('data-panel-id');
                panel = this.panels.find(p =>
                    p.id === panelId || p.serialNumber === panelId || p.inverterSerialNumber === panelId
                );
                break;
            }
            el = el.parentElement || el.parentNode;
        }

        if (!panel) {
            const svgCoords = this.screenToSVG(e.clientX, e.clientY);
            panel = this.panels.find(p =>
                svgCoords.x >= p.x && svgCoords.x <= p.x + p.width &&
                svgCoords.y >= p.y && svgCoords.y <= p.y + p.height
            );
        }

        if (panel) {
            this.showTooltip(e.clientX, e.clientY, panel, this.getPanelPowerInfo(panel));
            canvas.style.cursor = this.editPlacementEnabled ? 'move' : 'default';
        } else {
            tooltip.classList.add('hidden');
            canvas.style.cursor = 'default';
        }
    }

    updateCursorStyle() {
        const canvas = document.getElementById('panelCanvas');
        if (!canvas) return;
        if (!this.editPlacementEnabled) canvas.style.cursor = 'default';
    }

    showTooltip(x, y, panel, powerInfo) {
        const tooltip = document.getElementById('tooltip');
        tooltip.classList.remove('hidden');

        const power = this.getPowerValue(powerInfo);
        const displayName = panel.label || panel.id || panel.serialNumber || 'Unknown';

        let efficiencyHtml = '';
        if (panel.ratedWatts && panel.ratedWatts > 0) {
            const pct = ((power / panel.ratedWatts) * 100).toFixed(1);
            efficiencyHtml = `<p><span class="label">Efficiency:</span> ${pct}% of ${panel.ratedWatts} W rated</p>`;
        }

        let powerHtml = '';

        if (this.detailedMode) {
            Object.entries(powerInfo).forEach(([key, val]) => {
                if (val !== null && val !== undefined && val !== '') {
                    powerHtml += `<p><span class="label">${key}:</span> ${val}</p>`;
                }
            });
        } else {
            const curatedFields = [
                { key: 'power_kw',      label: 'AC Power (kW)',     fmt: v => v.toFixed(4) },
                { key: 'voltage_v',     label: 'AC Voltage (V)',    fmt: v => v.toFixed(1) },
                { key: 'current_a',     label: 'AC Current (A)',    fmt: v => v.toFixed(3) },
                { key: 'frequency_hz',  label: 'Frequency (Hz)',    fmt: v => v.toFixed(2) },
                { key: 'temperature_c', label: 'Temp (°C)',         fmt: v => v.toFixed(1) },
                { key: 'dc_voltage_v',  label: 'DC Voltage (V)',    fmt: v => v.toFixed(1) },
                { key: 'dc_current_a',  label: 'DC Current (A)',    fmt: v => v.toFixed(3) },
                { key: 'lifetime_kwh',  label: 'Lifetime (kWh)',    fmt: v => v.toFixed(1) },
                { key: 'model',         label: 'Model',             fmt: v => v },
            ];
            curatedFields.forEach(({ key, label, fmt }) => {
                const val = powerInfo[key];
                if (val !== undefined && val !== null && val !== '') {
                    powerHtml += `<p><span class="label">${label}:</span> ${fmt(val)}</p>`;
                }
            });
        }

        tooltip.innerHTML = `
            <h3>${displayName}</h3>
            <p><span class="label">Power:</span> ${power.toFixed(1)} W</p>
            ${efficiencyHtml}
            <p><span class="label">Serial:</span> ${panel.serialNumber || panel.inverterSerialNumber || '—'}</p>
            ${this.detailedMode ? `<p><span class="label">Rotation:</span> ${panel.planeRotation || 0}°</p>` : ''}
            ${powerHtml}
        `;

        const offset = 10;
        let tx = x + offset;
        let ty = y + offset;
        tooltip.style.left = `${tx}px`;
        tooltip.style.top  = `${ty}px`;

        const tr = tooltip.getBoundingClientRect();
        if (tx + tr.width  > window.innerWidth)  tx = Math.max(offset, x - tr.width  - offset);
        if (ty + tr.height > window.innerHeight) ty = Math.max(offset, y - tr.height - offset);

        tooltip.style.left = `${tx}px`;
        tooltip.style.top  = `${ty}px`;
    }

    getColorForPower(power) {
        if (power === 0) return '#000000';
        const ratio = Math.min(power / this.maxPower, 1);
        const minGreen = 30;
        const g = Math.floor(minGreen + ((255 - minGreen) * ratio));
        return `rgb(0, ${g}, 0)`;
    }

    render() {
        const canvas = document.getElementById('panelCanvas');
        if (!canvas) return;

        const svgNS = 'http://www.w3.org/2000/svg';
        canvas.innerHTML = '';

        if (this.panels.length === 0) {
            this.baseCanvasWidth  = window.innerWidth;
            this.baseCanvasHeight = window.innerHeight - 100;
            this.updateViewBox();
            return;
        }

        let maxX = 0, maxY = 0;
        this.panels.forEach(panel => {
            if (panel.planeRotation && panel.planeRotation !== 0 && panel.planeRotation !== 180) {
                const rad = (panel.planeRotation * Math.PI) / 180;
                const cos = Math.abs(Math.cos(rad));
                const sin = Math.abs(Math.sin(rad));
                maxX = Math.max(maxX, panel.x + panel.width * cos + panel.height * sin);
                maxY = Math.max(maxY, panel.y + panel.width * sin + panel.height * cos);
            } else {
                maxX = Math.max(maxX, panel.x + panel.width);
                maxY = Math.max(maxY, panel.y + panel.height);
            }
        });

        this.baseCanvasWidth  = maxX + 50;
        this.baseCanvasHeight = maxY + 50;

        const activePowers = this.panels
            .map(p => this.getPowerValue(this.getPanelPowerInfo(p)))
            .filter(v => v > 0)
            .sort((a, b) => a - b);
        const medianPower = activePowers.length > 0
            ? activePowers[Math.floor(activePowers.length / 2)]
            : 0;

        this.panels.forEach(panel => {
            const powerInfo = this.getPanelPowerInfo(panel);
            const power = this.getPowerValue(powerInfo);
            const color = this.getColorForPower(power);
            const isUnderperforming = medianPower > 0 && power > 0 && power < medianPower * 0.5;

            const group   = document.createElementNS(svgNS, 'g');
            const centerX = panel.x + panel.width  / 2;
            const centerY = panel.y + panel.height / 2;

            if (panel.planeRotation &&
                panel.planeRotation !== 0 &&
                panel.planeRotation !== 90 &&
                panel.planeRotation !== 180 &&
                panel.planeRotation !== 270) {
                group.setAttribute('transform', `rotate(${panel.planeRotation} ${centerX} ${centerY})`);
            }

            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x',      panel.x);
            rect.setAttribute('y',      panel.y);
            rect.setAttribute('width',  panel.width);
            rect.setAttribute('height', panel.height);
            rect.setAttribute('fill',   color);
            rect.setAttribute('class',  isUnderperforming ? 'panel underperforming' : 'panel');
            rect.setAttribute('data-panel-id', panel.id || panel.serialNumber);
            group.appendChild(rect);

            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x',                centerX);
            text.setAttribute('y',                centerY);
            text.setAttribute('text-anchor',      'middle');
            text.setAttribute('dominant-baseline','middle');
            text.setAttribute('class',            'panel-text');
            text.textContent = panel.label || `${power.toFixed(1)}W`;
            group.appendChild(text);

            canvas.appendChild(group);
        });

        const dummy = canvas.offsetHeight; // trigger reflow for headless browsers
        this.updateViewBox();
    }

    startAutoRefresh() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(
            () => this.loadPowerData(),
            this.refreshIntervalMinutes * 60 * 1000
        );
    }

    updateStatus(message) {
        const status = document.getElementById('status');
        if (status) status.textContent = message;
    }

    exportPanelLayout() {
        if (!this.panels || this.panels.length === 0) {
            alert('No panels to export');
            return;
        }

        const exportData = this.panels.map(panel => ({
            id: panel.id,
            x: panel.x,
            y: panel.y,
            width: panel.width,
            height: panel.height,
            planeRotation: panel.planeRotation,
            inverterSerialNumber: panel.inverterSerialNumber,
            serialNumber: panel.serialNumber,
            ...(panel.label      ? { label:      panel.label      } : {}),
            ...(panel.ratedWatts ? { ratedWatts: panel.ratedWatts } : {})
        }));

        const jsonString   = JSON.stringify(exportData, null, 4);
        const blob         = new Blob([jsonString], { type: 'application/json' });
        const url          = URL.createObjectURL(blob);
        const a            = document.createElement('a');
        a.href             = url;
        a.download         = 'panel-layout-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.updateStatus(`Layout exported (${this.panels.length} panels)`);
    }

    async saveLayoutToServer() {
        if (!this.panels || this.panels.length === 0) {
            alert('No panels to save');
            return;
        }

        const saveData = this.panels.map(panel => ({
            id: panel.id,
            x: panel.x,
            y: panel.y,
            width: panel.width,
            height: panel.height,
            planeRotation: panel.planeRotation,
            inverterSerialNumber: panel.inverterSerialNumber,
            serialNumber: panel.serialNumber,
            ...(panel.label      ? { label:      panel.label      } : {}),
            ...(panel.ratedWatts ? { ratedWatts: panel.ratedWatts } : {})
        }));

        try {
            const response = await fetch('api.php?action=save_layout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saveData),
            });
            const result = await response.json();
            if (result.ok) {
                this.updateStatus(`Layout saved to server (${result.count} panels)`);
            } else {
                this.updateStatus(`Save failed: ${result.error || 'unknown error'}`);
            }
        } catch (err) {
            this.updateStatus(`Save failed: ${err.message}`);
        }
    }

    importPanelLayout(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                let text = event.target.result.trim();
                text = text.replace(/^[\s\S]*?(\[)/, '$1');

                const match = text.match(/\[[\s\S]*\]/);
                if (!match) throw new Error('No JSON array found in file');

                const layout = JSON.parse(match[0]);
                if (!Array.isArray(layout) || layout.length === 0) {
                    throw new Error('Expected a non-empty array');
                }

                this.panels = layout.map((panel, index) => ({
                    ...panel,
                    id: panel.id || `panel-${index}`,
                    x: panel.x || 0,
                    y: panel.y || 0,
                    width:  panel.width  || 80,
                    height: panel.height || 120,
                    planeRotation: panel.planeRotation || 0
                }));

                this.resolveOverlaps();
                this.updateStatus(`Imported ${this.panels.length} panels from file`);
                this.updateSummary();
                this.render();
                this.fitAllPanels();
            } catch (err) {
                console.error('Import error:', err);
                alert(`Failed to import layout: ${err.message}`);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SolarPanelMonitor();
});
