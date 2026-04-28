// All safe (GET-only) endpoints extracted from swagger.json
// Grouped by functional area, ordered by usefulness for diagnostics
const DIAGNOSTIC_ENDPOINTS = [
    // ── System ─────────────────────────────────────────────────────────────
    {
        operationId: 'getSupervisorInfo',
        summary: 'PVS model, firmware version, build, and serial number',
        path: '/cgi-bin/dl_cgi/supervisor/info',
        tag: 'System'
    },

    // ── Power & Grid ───────────────────────────────────────────────────────
    {
        operationId: 'getPowerProduction',
        summary: 'Whether power production is currently enabled or disabled',
        path: '/cgi-bin/dl_cgi/network/powerProduction',
        tag: 'Power & Grid'
    },
    {
        operationId: 'getGridVoltage',
        summary: 'Configured grid voltage (208 V or 240 V)',
        path: '/cgi-bin/dl_cgi/grid/voltage',
        tag: 'Power & Grid'
    },
    {
        operationId: 'getGridExportLimit',
        summary: 'Current grid export limit (enabled, factor, and limit)',
        path: '/cgi-bin/dl_cgi/grid/export_limit',
        tag: 'Power & Grid'
    },
    {
        operationId: 'getGridProfileV1',
        summary: 'Active grid profile name, pending profile, and apply progress',
        path: '/cgi-bin/dl_cgi/grid/profile',
        tag: 'Power & Grid'
    },
    {
        operationId: 'getGridProfile',
        summary: 'Active grid profile detail per subsystem (v2)',
        path: '/cgi-bin/dl_cgi/grid/v2/profile',
        tag: 'Power & Grid'
    },
    {
        operationId: 'getGridProfiles',
        summary: 'Full list of all available grid profiles on the PVS',
        path: '/cgi-bin/dl_cgi/grid/profiles',
        tag: 'Power & Grid'
    },

    // ── Devices ────────────────────────────────────────────────────────────
    {
        operationId: 'getDevices',
        summary: 'Full device list (inverters, meters, PVS supervisor, etc.)',
        path: '/cgi-bin/dl_cgi/devices/list',
        tag: 'Devices'
    },
    {
        operationId: 'getCandidates',
        summary: 'Candidate devices queued for connectivity checks',
        path: '/cgi-bin/dl_cgi/candidates',
        tag: 'Devices'
    },
    {
        operationId: 'getPingableDevices',
        summary: 'Devices that can be pinged for connectivity testing',
        path: '/cgi-bin/dl_cgi/network/getPingableDevices',
        tag: 'Devices'
    },

    // ── Panels ─────────────────────────────────────────────────────────────
    {
        operationId: 'getPanelsLayout',
        summary: 'Panel layout stored on the PVS (positions and serial numbers)',
        path: '/cgi-bin/dl_cgi/panels/layout',
        tag: 'Panels'
    },

    // ── Network ────────────────────────────────────────────────────────────
    {
        operationId: 'getNetworkInterfaces',
        summary: 'Network interface names and basic status',
        path: '/cgi-bin/dl_cgi/network/interfaces',
        tag: 'Network'
    },
    {
        operationId: 'getGeneralNetworkSettings',
        summary: 'General network configuration (hostname, DNS, NTP, etc.)',
        path: '/cgi-bin/dl_cgi/network/settings',
        tag: 'Network'
    },
    {
        operationId: 'getFirewallSettings',
        summary: 'Firewall rules and settings',
        path: '/cgi-bin/dl_cgi/network/firewallSettings',
        tag: 'Network'
    },
    {
        operationId: 'getWhitelist',
        summary: 'Network whitelist entries',
        path: '/cgi-bin/dl_cgi/network/whitelist',
        tag: 'Network'
    },
    {
        operationId: 'getInterfaceConfig (eth)',
        summary: 'Ethernet interface configuration (IP, DHCP, gateway, etc.)',
        path: '/cgi-bin/dl_cgi/network/interfaceConfig/eth',
        tag: 'Network'
    },
    {
        operationId: 'getInterfaceConfig (wifi)',
        summary: 'WiFi interface configuration',
        path: '/cgi-bin/dl_cgi/network/interfaceConfig/wifi',
        tag: 'Network'
    },
    {
        operationId: 'getInterfaceConfig (plc)',
        summary: 'Powerline (PLC) interface configuration',
        path: '/cgi-bin/dl_cgi/network/interfaceConfig/plc',
        tag: 'Network'
    },
    {
        operationId: 'pingStatus',
        summary: 'Output of any currently running ping process',
        path: '/cgi-bin/dl_cgi/network/ping',
        tag: 'Network'
    },
    {
        operationId: 'tunnelStatus',
        summary: 'Status of any open SSH tunnels',
        path: '/cgi-bin/dl_cgi/network/tunnel',
        tag: 'Network'
    },

    // ── Communication ──────────────────────────────────────────────────────
    {
        operationId: 'getInterfaces',
        summary: 'Full detail for all communication interfaces (cell, WiFi, PLC, WAN)',
        path: '/cgi-bin/dl_cgi/communication/interfaces',
        tag: 'Communication'
    },
    {
        operationId: 'getInterface (cell)',
        summary: 'Cellular interface details (signal, carrier, data usage)',
        path: '/cgi-bin/dl_cgi/communication/interface/cell',
        tag: 'Communication'
    },
    {
        operationId: 'getInterface (sta0)',
        summary: 'WiFi station interface details',
        path: '/cgi-bin/dl_cgi/communication/interface/sta0',
        tag: 'Communication'
    },
    {
        operationId: 'getInterface (wan)',
        summary: 'WAN interface details',
        path: '/cgi-bin/dl_cgi/communication/interface/wan',
        tag: 'Communication'
    },
    {
        operationId: 'accessPoints',
        summary: 'Available WiFi access points visible to the PVS',
        path: '/cgi-bin/dl_cgi/communication/ap',
        tag: 'Communication'
    },
    {
        operationId: 'isCellularPrimary',
        summary: 'Whether cellular is set as the primary network connection',
        path: '/cgi-bin/dl_cgi/communication/cellular/primary',
        tag: 'Communication'
    },
    {
        operationId: 'isCellularPurchased',
        summary: 'Whether a cellular data plan has been purchased',
        path: '/cgi-bin/dl_cgi/communication/cellular/purchased',
        tag: 'Communication'
    },

    // ── Firmware ───────────────────────────────────────────────────────────
    {
        operationId: 'getNewFirmwareVersion',
        summary: 'URL of newer firmware if an update is available',
        path: '/cgi-bin/dl_cgi/firmware/new_version',
        tag: 'Firmware'
    },
    {
        operationId: 'getUpgradeStatus',
        summary: 'Status and progress of any firmware upgrade in progress',
        path: '/cgi-bin/dl_cgi/firmware/upgrade',
        tag: 'Firmware'
    },

    // ── Energy Storage (ESS) ───────────────────────────────────────────────
    {
        operationId: 'getEssStatus',
        summary: 'Status of all energy storage system devices and any parameter errors',
        path: '/cgi-bin/dl_cgi/energy-storage-system/status',
        tag: 'Energy Storage'
    },
    {
        operationId: 'getDeviceList (ESS pre-discover)',
        summary: 'All devices with ESS discovery errors (pre-commissioning)',
        path: '/cgi-bin/dl_cgi/energy-storage-system/pre-discover',
        tag: 'Energy Storage'
    },
    {
        operationId: 'getFirmwareUpdateStatus',
        summary: 'Status of any ESS component firmware update in progress',
        path: '/cgi-bin/dl_cgi/energy-storage-system/firmware/status',
        tag: 'Energy Storage'
    },

    // ── Health ─────────────────────────────────────────────────────────────
    {
        operationId: 'getSystemHealthCheckList',
        summary: 'All available equinox system health checks',
        path: '/cgi-bin/dl_cgi/equinox-system-check/list',
        tag: 'Health'
    },
    {
        operationId: 'getSystemHealthReport',
        summary: 'Results and progress of the last system health check run',
        path: '/cgi-bin/dl_cgi/equinox-system-check',
        tag: 'Health'
    },
];

// Read-only varserver groups from the pypvs CSV.
// Only /sys/ and /net/ prefixes are used — writable vars live under other roots.
const VARSERVER_GROUPS = [
    {
        label:   'System Info',
        match:   '/sys/info/',
        summary: 'Firmware revision, hardware model, serial number, CPU/RAM usage',
    },
    {
        label:   'Live Data',
        match:   '/sys/livedata/',
        summary: 'PV power, net power, ESS power, state of charge, site load',
    },
    {
        label:   'Inverters',
        match:   '/sys/devices/inverter/',
        summary: 'Per-inverter telemetry — power, voltage, current, temperature, lifetime energy',
    },
    {
        label:   'Meters',
        match:   '/sys/devices/meter/',
        summary: 'Revenue-grade meter readings — production and consumption',
    },
    {
        label:   'ESS / Battery',
        match:   '/sys/devices/ess/',
        summary: 'Battery state of charge, power, temperature, and fault flags',
    },
    {
        label:   'Transfer Switch',
        match:   '/sys/devices/transfer_switch/',
        summary: 'Transfer switch status and mode',
    },
    {
        label:   'Network (net)',
        match:   '/net/',
        summary: 'Interface link states for sta0, wan0, wan1, wwan0',
    },
    {
        label:   'PVS Statistics',
        match:   '/sys/pvs/',
        summary: 'Flash wear count and USB erase statistics',
    },
    {
        label:   'Cellular Toggle',
        match:   '/sys/toggle_cell/',
        summary: 'Broadband / cell connection flags and low-data mode',
    },
];

// Description lookup keyed by varserver name.
// Entries with {index} in the path cover all indexed devices — the lookup
// normalises actual names (e.g. /sys/devices/inverter/0/p3phsumKw) by
// replacing any all-digit path segment with {index} before the lookup.
const VARSERVER_DESCRIPTIONS = {
    // /net/
    '/net/sta0/state':  'sta0 interface state',
    '/net/wan0/state':  'wan0 interface state',
    '/net/wan1/state':  'wan1 (USB dongle ethernet adapter) interface state',
    '/net/wwan0/state': 'wwan0 interface state',

    // /sys/devices/ess/{index}/
    '/sys/devices/ess/{index}/chrgLimitPmaxKw':   'Maximum allowed charge power (kW)',
    '/sys/devices/ess/{index}/customerSocVal':    'Customer-reported state of charge (SOC) value',
    '/sys/devices/ess/{index}/dischrgLimPmaxKw':  'Maximum allowed discharge power (kW)',
    '/sys/devices/ess/{index}/maxTBattCellDegc':  'Maximum battery cell temperature (°C)',
    '/sys/devices/ess/{index}/maxVBattCellV':     'Maximum battery cell voltage (V)',
    '/sys/devices/ess/{index}/minTBattCellDegc':  'Minimum battery cell temperature (°C)',
    '/sys/devices/ess/{index}/minVBattCellV':     'Minimum battery cell voltage (V)',
    '/sys/devices/ess/{index}/msmtEps':           'Timestamp of the last measurement',
    '/sys/devices/ess/{index}/negLtea3phsumKwh':  'Total negative energy (kWh) over 3 phases',
    '/sys/devices/ess/{index}/opMode':            'Operating mode of the ESS',
    '/sys/devices/ess/{index}/p3phsumKw':         'Total real power (kW) over 3 phases',
    '/sys/devices/ess/{index}/posLtea3phsumKwh':  'Total positive energy (kWh) over 3 phases',
    '/sys/devices/ess/{index}/prodMdlNm':         'Product model name',
    '/sys/devices/ess/{index}/sn':                'Device serial number',
    '/sys/devices/ess/{index}/socVal':            'State of charge (SOC) value',
    '/sys/devices/ess/{index}/sohVal':            'State of health (SOH) value',
    '/sys/devices/ess/{index}/tInvtrDegc':        'Inverter temperature (°C)',
    '/sys/devices/ess/{index}/v1nV':              'Voltage between phase 1 and neutral (V)',
    '/sys/devices/ess/{index}/v2nV':              'Voltage between phase 2 and neutral (V)',
    '/sys/devices/ess/{index}/vBattV':            'Battery voltage (V)',

    // /sys/devices/inverter/{index}/
    '/sys/devices/inverter/{index}/freqHz':          'Frequency in Hz detected by the inverter',
    '/sys/devices/inverter/{index}/i3phsumA':        'Sum of phase currents in A',
    '/sys/devices/inverter/{index}/iMppt1A':         'Current of MPPT1 in A',
    '/sys/devices/inverter/{index}/ltea3phsumKwh':   'Lifetime sum of 3-phase energy in kWh',
    '/sys/devices/inverter/{index}/msmtEps':         'Timestamp of the last measurement',
    '/sys/devices/inverter/{index}/p3phsumKw':       'Sum of 3-phase power in kW',
    '/sys/devices/inverter/{index}/pMppt1Kw':        'Power of MPPT1 in kW',
    '/sys/devices/inverter/{index}/prodMdlNm':       'Product model name',
    '/sys/devices/inverter/{index}/sn':              'Serial number of the inverter',
    '/sys/devices/inverter/{index}/tHtsnkDegc':      'Temperature of the heat sink in °C',
    '/sys/devices/inverter/{index}/vMppt1V':         'Voltage of MPPT1 in V',
    '/sys/devices/inverter/{index}/vln3phavgV':      'Average line-to-neutral voltage of 3-phase system in V',

    // /sys/devices/meter/{index}/
    '/sys/devices/meter/{index}/ctSclFctr':          'CT scaling factor',
    '/sys/devices/meter/{index}/freqHz':             'Frequency in Hz',
    '/sys/devices/meter/{index}/i1A':                'Current in A for phase 1',
    '/sys/devices/meter/{index}/i2A':                'Current in A for phase 2',
    '/sys/devices/meter/{index}/msmtEps':            'Timestamp of the last measurement',
    '/sys/devices/meter/{index}/negLtea3phsumKwh':   'Negative lifetime sum of 3-phase energy in kWh',
    '/sys/devices/meter/{index}/netLtea3phsumKwh':   'Net lifetime sum of 3-phase energy in kWh',
    '/sys/devices/meter/{index}/p1Kw':               'Power in kW for phase 1',
    '/sys/devices/meter/{index}/p2Kw':               'Power in kW for phase 2',
    '/sys/devices/meter/{index}/p3phsumKw':          'Sum of 3-phase power in kW',
    '/sys/devices/meter/{index}/posLtea3phsumKwh':   'Positive lifetime sum of 3-phase energy in kWh',
    '/sys/devices/meter/{index}/prodMdlNm':          'Product model name',
    '/sys/devices/meter/{index}/q3phsumKvar':        'Sum of 3-phase reactive power in kVar',
    '/sys/devices/meter/{index}/s3phsumKva':         'Sum of 3-phase apparent power in kVA',
    '/sys/devices/meter/{index}/sn':                 'Serial number of the meter',
    '/sys/devices/meter/{index}/totPfRto':           'Total power factor ratio',
    '/sys/devices/meter/{index}/v12V':               'Voltage between phase 1 and 2 in V',
    '/sys/devices/meter/{index}/v1nV':               'Voltage between phase 1 and neutral in V',
    '/sys/devices/meter/{index}/v2nV':               'Voltage between phase 2 and neutral in V',

    // /sys/devices/transfer_switch/{index}/
    '/sys/devices/transfer_switch/{index}/midStEnum':   'MID state',
    '/sys/devices/transfer_switch/{index}/msmtEps':     'Timestamp of the last measurement',
    '/sys/devices/transfer_switch/{index}/prodMdlNm':   'Product model name',
    '/sys/devices/transfer_switch/{index}/pvd1StEnum':  'PV Disconnect (PVD) state',
    '/sys/devices/transfer_switch/{index}/sn':          'Serial number of the transfer switch',
    '/sys/devices/transfer_switch/{index}/tDegc':       'Temperature in degrees Celsius',
    '/sys/devices/transfer_switch/{index}/v1nGridV':    'Grid voltage for phase 1',
    '/sys/devices/transfer_switch/{index}/v1nV':        'Voltage between phase 1 and neutral',
    '/sys/devices/transfer_switch/{index}/v2nGridV':    'Grid voltage between phase 2 and neutral',
    '/sys/devices/transfer_switch/{index}/v2nV':        'Voltage between phase 2 and neutral',
    '/sys/devices/transfer_switch/{index}/vSpplyV':     'Supply voltage',

    // /sys/info/
    '/sys/info/active_interface':     'Current active network interface',
    '/sys/info/active_interface_mac': 'Current active network interface MAC address',
    '/sys/info/boardtype':            'PVS board type',
    '/sys/info/cpu_usage':            'Current CPU usage in percentage',
    '/sys/info/finance_type':         'Finance type for the site (UNKNOWN, CASH, LEASE, or LOAN)',
    '/sys/info/flash_usage':          'Current flash usage in percentage',
    '/sys/info/fwrev':                'PVS firmware revision',
    '/sys/info/hwrev':                'PVS hardware revision',
    '/sys/info/lmac':                 'LAN0 MAC address',
    '/sys/info/model':                'PVS model number',
    '/sys/info/ram_usage':            'Current RAM usage in percentage',
    '/sys/info/serialnum':            'PVS serial number',
    '/sys/info/ssid':                 'PVS SSID',
    '/sys/info/sw_rev':               'SPWR software revision',
    '/sys/info/sys_type':             'System type (PV-only, storage)',
    '/sys/info/uptime':               'PVS uptime',
    '/sys/info/wpa_key':              'PVS WPA key',

    // /sys/livedata/
    '/sys/livedata/backupTimeRemaining': 'Battery backup time remaining (minutes)',
    '/sys/livedata/ess_en':              'Battery energy (kWh)',
    '/sys/livedata/ess_p':              'Battery power (kW)',
    '/sys/livedata/midstate':           'MID state',
    '/sys/livedata/net_en':             'Net consumption energy (kWh)',
    '/sys/livedata/net_p':              'Net consumption power (kW)',
    '/sys/livedata/pv_en':              'Production energy (kWh)',
    '/sys/livedata/pv_p':               'Production power (kW)',
    '/sys/livedata/site_load_en':       'Site load energy (kWh)',
    '/sys/livedata/site_load_p':        'Site load power (kW)',
    '/sys/livedata/soc':                'Battery state of charge (%)',
    '/sys/livedata/time':               'Telemetry websockets timestamp',

    // /sys/pvs/
    '/sys/pvs/flashwear_type_b': 'Percentage lifetime estimation as HEX value (0x01 = 10%, 0x9 = 90%) for TYPE B cell',
    '/sys/pvs/usb_erase_count':  'SMART Attribute 229 erase count — measures USB drive health',

    // /sys/toggle_cell/
    '/sys/toggle_cell/broadband_connected': 'Broadband connection status (0 = disconnected, 1 = connected)',
    '/sys/toggle_cell/cell_connected':      'Cell connection status (0 = disconnected, 1 = connected)',
    '/sys/toggle_cell/low_data_mode':       'Toggle-cell low data mode status',
};

// top-level const/let do NOT become window properties in modern browsers,
// so explicitly attach to window so the same-origin diagnostics popup can
// reach it via window.opener without re-serialising the object into HTML.
window.VARSERVER_DESCRIPTIONS = VARSERVER_DESCRIPTIONS;

function normalizeVarName(name) {
    // Function declarations DO land on window automatically.
    return name.replace(/\/\d+\//g, '/{index}/');
}

function openDiagnosticWindow() {
    const win = window.open('', '_blank', 'width=960,height=860,scrollbars=yes,resizable=yes');
    if (!win) {
        alert('Could not open the diagnostic window. Please allow pop-ups for this page.');
        return;
    }

    // Group endpoints by tag
    const groups = {};
    DIAGNOSTIC_ENDPOINTS.forEach(ep => {
        if (!groups[ep.tag]) groups[ep.tag] = [];
        groups[ep.tag].push(ep);
    });

    const groupsJson    = JSON.stringify(groups);
    const endpointsJson = JSON.stringify(DIAGNOSTIC_ENDPOINTS);

    // Proxy base — all fetches go through api.php on the same origin
    const apiBase   = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'api.php';
    const proxyBase = apiBase + '?action=proxy&path=';
    const varsBase  = apiBase + '?action=vars&match=';

    const totalItems = DIAGNOSTIC_ENDPOINTS.length + VARSERVER_GROUPS.length;

    const varsGroupsJson = JSON.stringify(VARSERVER_GROUPS);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PVS6 Diagnostics</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #111;
            color: #e0e0e0;
            padding: 1.5rem;
        }
        header {
            border-bottom: 2px solid #4ade80;
            padding-bottom: 1rem;
            margin-bottom: 1.5rem;
        }
        h1 { color: #4ade80; font-size: 1.5rem; margin-bottom: 0.35rem; }
        .meta { color: #9ca3af; font-size: 0.85rem; }
        .meta code {
            background: #1e1e1e;
            padding: 0.1rem 0.4rem;
            border-radius: 3px;
            color: #a5f3c0;
            font-size: 0.82rem;
        }

        .section { margin-bottom: 2rem; }
        .section-title {
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 0.75rem;
            border-bottom: 1px solid #2a2a2a;
            padding-bottom: 0.35rem;
        }

        .card {
            background: #1a1a1a;
            border: 1px solid #2e2e2e;
            border-radius: 6px;
            margin-bottom: 0.75rem;
            overflow: hidden;
        }
        .card-header {
            display: flex;
            align-items: baseline;
            gap: 0.75rem;
            padding: 0.65rem 0.85rem;
            background: #202020;
            border-bottom: 1px solid #2e2e2e;
            flex-wrap: wrap;
        }
        .op-id {
            font-family: 'Menlo', 'Consolas', monospace;
            font-size: 0.85rem;
            font-weight: 700;
            color: #4ade80;
        }
        .op-summary { color: #9ca3af; font-size: 0.82rem; flex: 1; }
        .badge {
            font-size: 0.7rem;
            padding: 0.1rem 0.45rem;
            border-radius: 3px;
            font-weight: 600;
            white-space: nowrap;
        }
        .badge-loading { background: #374151; color: #9ca3af; }
        .badge-ok      { background: #14532d; color: #86efac; }
        .badge-error   { background: #450a0a; color: #fca5a5; }
        .card-body { padding: 0.75rem 0.85rem; }

        pre {
            font-family: 'Menlo', 'Consolas', monospace;
            font-size: 0.78rem;
            line-height: 1.55;
            white-space: pre-wrap;
            word-break: break-word;
        }
        .spinner { color: #6b7280; font-style: italic; font-size: 0.82rem; }

        /* JSON syntax colours */
        .json-key  { color: #93c5fd; }
        .json-str  { color: #86efac; }
        .json-num  { color: #fde68a; }
        .json-bool { color: #f9a8d4; }
        .json-null { color: #f9a8d4; }
        .err-text  { color: #fca5a5; }

        /* Varserver variable table */
        .vars-table {
            width: 100%;
            border-collapse: collapse;
            font-family: 'Menlo', 'Consolas', monospace;
            font-size: 0.78rem;
        }
        .vars-table th {
            text-align: left;
            padding: 0.3rem 0.6rem;
            color: #6b7280;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            border-bottom: 1px solid #2e2e2e;
        }
        .vars-table td {
            padding: 0.3rem 0.6rem;
            border-bottom: 1px solid #1e1e1e;
            vertical-align: top;
        }
        .vars-table tr:last-child td { border-bottom: none; }
        .vars-table .var-name  { color: #93c5fd; width: 40%; word-break: break-all; }
        .vars-table .var-value { color: #86efac; width: 15%; }
        .vars-table .var-desc  { color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.78rem; }
    </style>
</head>
<body>
    <header>
        <h1>PVS6 System Diagnostics</h1>
        <p class="meta">
            Fetching ${totalItems} read-only sources via server proxy
            &nbsp;&mdash;&nbsp; <span id="doneCount">0</span> / ${totalItems} complete
        </p>
    </header>
    <div id="container"></div>

    <script>
        const PROXY_BASE   = ${JSON.stringify(proxyBase)};
        const VARS_BASE    = ${JSON.stringify(varsBase)};
        const GROUPS       = ${groupsJson};
        const ENDPOINTS    = ${endpointsJson};
        const VARS_GROUPS  = ${varsGroupsJson};

        // Access the description map and normaliser from the parent window.
        // Same-origin popup can read window.opener globals directly — avoids
        // any regex or special characters inside this template literal.
        const VARS_DESCS       = (window.opener && window.opener.VARSERVER_DESCRIPTIONS) || {};
        const normalizeVarName = (window.opener && window.opener.normalizeVarName) || function(n) { return n; };

        let doneCount = 0;
        const totalItems  = ${totalItems};

        // ── JSON syntax highlighter ─────────────────────────────────────────
        function syntaxHighlight(obj) {
            const json = JSON.stringify(obj, null, 2);
            return json.replace(/("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g, (match) => {
                let cls = 'json-num';
                if (/^"/.test(match)) {
                    cls = /:$/.test(match) ? 'json-key' : 'json-str';
                } else if (/true|false/.test(match)) {
                    cls = 'json-bool';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
            });
        }

        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        function bumpDone() {
            doneCount++;
            document.getElementById('doneCount').textContent = doneCount;
        }

        // ── Build the dl_cgi endpoint cards ─────────────────────────────────
        const container = document.getElementById('container');

        Object.entries(GROUPS).forEach(([tag, endpoints]) => {
            const section = document.createElement('div');
            section.className = 'section';
            section.innerHTML = '<div class="section-title">' + tag + '</div>';

            endpoints.forEach(ep => {
                const card = document.createElement('div');
                card.className = 'card';
                card.id = 'card-' + ep.operationId.replace(/[^a-zA-Z0-9]/g, '_');

                card.innerHTML =
                    '<div class="card-header">' +
                        '<span class="op-id">' + escapeHtml(ep.operationId) + '</span>' +
                        '<span class="op-summary">' + escapeHtml(ep.path) + ' &mdash; ' + escapeHtml(ep.summary) + '</span>' +
                        '<span class="badge badge-loading" id="badge-' + ep.operationId.replace(/[^a-zA-Z0-9]/g, '_') + '">Loading...</span>' +
                    '</div>' +
                    '<div class="card-body">' +
                        '<pre id="resp-' + ep.operationId.replace(/[^a-zA-Z0-9]/g, '_') + '" class="spinner">Fetching...</pre>' +
                    '</div>';

                section.appendChild(card);
            });

            container.appendChild(section);
        });

        // ── Build the varserver variable cards ──────────────────────────────
        const varsSection = document.createElement('div');
        varsSection.className = 'section';
        varsSection.innerHTML = '<div class="section-title">Varserver Variables</div>';

        VARS_GROUPS.forEach(grp => {
            const safeId = grp.match.replace(/[^a-zA-Z0-9]/g, '_');
            const card = document.createElement('div');
            card.className = 'card';
            card.id = 'vcard-' + safeId;

            card.innerHTML =
                '<div class="card-header">' +
                    '<span class="op-id">' + escapeHtml(grp.label) + '</span>' +
                    '<span class="op-summary"><code>' + escapeHtml(grp.match) + '</code>&nbsp;&mdash;&nbsp;' + escapeHtml(grp.summary) + '</span>' +
                    '<span class="badge badge-loading" id="vbadge-' + safeId + '">Loading...</span>' +
                '</div>' +
                '<div class="card-body" id="vresp-' + safeId + '">' +
                    '<span class="spinner">Fetching...</span>' +
                '</div>';

            varsSection.appendChild(card);
        });

        container.appendChild(varsSection);

        // ── Fetch all dl_cgi endpoints ───────────────────────────────────────
        ENDPOINTS.forEach(ep => {
            const safeId = ep.operationId.replace(/[^a-zA-Z0-9]/g, '_');
            const badge  = document.getElementById('badge-' + safeId);
            const respEl = document.getElementById('resp-' + safeId);
            const url    = PROXY_BASE + encodeURIComponent(ep.path);

            fetch(url)
                .then(resp => {
                    const status = resp.status;
                    return resp.text().then(text => ({ status, text }));
                })
                .then(({ status, text }) => {
                    let content;
                    try {
                        const data = JSON.parse(text);
                        content = syntaxHighlight(data);
                        respEl.classList.remove('spinner');
                    } catch {
                        content = '<span class="err-text">' + escapeHtml(text || '(empty response)') + '</span>';
                        respEl.classList.remove('spinner');
                    }
                    badge.textContent = status;
                    badge.className = 'badge ' + (status >= 200 && status < 300 ? 'badge-ok' : 'badge-error');
                    respEl.innerHTML = content;
                })
                .catch(err => {
                    badge.textContent = 'Error';
                    badge.className   = 'badge badge-error';
                    respEl.innerHTML  = '<span class="err-text">' + escapeHtml(err.message) + '</span>';
                    respEl.classList.remove('spinner');
                })
                .finally(bumpDone);
        });

        // ── Fetch all varserver groups ───────────────────────────────────────
        VARS_GROUPS.forEach(grp => {
            const safeId  = grp.match.replace(/[^a-zA-Z0-9]/g, '_');
            const badge   = document.getElementById('vbadge-' + safeId);
            const bodyEl  = document.getElementById('vresp-'  + safeId);
            const url     = VARS_BASE + encodeURIComponent(grp.match);

            fetch(url)
                .then(resp => {
                    const status = resp.status;
                    return resp.json().then(data => ({ status, data })).catch(() => ({ status, data: null }));
                })
                .then(({ status, data }) => {
                    badge.textContent = status;
                    badge.className   = 'badge ' + (status === 200 ? 'badge-ok' : 'badge-error');

                    if (status !== 200 || !data) {
                        bodyEl.innerHTML = '<span class="err-text">' + escapeHtml(JSON.stringify(data)) + '</span>';
                        return;
                    }

                    const values = data.values;
                    if (!Array.isArray(values) || values.length === 0) {
                        bodyEl.innerHTML = '<span class="spinner">No values returned (device may not be present)</span>';
                        return;
                    }

                    // Render as a name/value table — much more readable than raw JSON
                    let rows = values.map(v => {
                        const desc = VARS_DESCS[normalizeVarName(v.name)] ?? '';
                        return '<tr>' +
                            '<td class="var-name">'  + escapeHtml(v.name)                 + '</td>' +
                            '<td class="var-value">' + escapeHtml(String(v.value ?? ''))  + '</td>' +
                            '<td class="var-desc">'  + escapeHtml(desc)                   + '</td>' +
                        '</tr>';
                    }).join('');

                    bodyEl.innerHTML =
                        '<table class="vars-table">' +
                            '<thead><tr><th>Variable</th><th>Value</th><th>Description</th></tr></thead>' +
                            '<tbody>' + rows + '</tbody>' +
                        '</table>';
                })
                .catch(err => {
                    badge.textContent = 'Error';
                    badge.className   = 'badge badge-error';
                    bodyEl.innerHTML  = '<span class="err-text">' + escapeHtml(err.message) + '</span>';
                })
                .finally(bumpDone);
        });
    <\/script>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
}
