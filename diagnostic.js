// All safe (GET-only) endpoints extracted from swagger.json
// Grouped by functional area, ordered by usefulness for diagnostics
const DIAGNOSTIC_ENDPOINTS = [
    // ── System ─────────────────────────────────────────────────────────────
    {
        operationId: 'getSupervisorInfo',
        summary: 'PVS model, firmware version, build, and serial number',
        path: '/dl_cgi/supervisor/info',
        tag: 'System'
    },

    // ── Power & Grid ───────────────────────────────────────────────────────
    {
        operationId: 'getPowerProduction',
        summary: 'Whether power production is currently enabled or disabled',
        path: '/dl_cgi/network/powerProduction',
        tag: 'Power & Grid'
    },
    {
        operationId: 'getGridVoltage',
        summary: 'Configured grid voltage (208 V or 240 V)',
        path: '/dl_cgi/grid/voltage',
        tag: 'Power & Grid'
    },
    {
        operationId: 'getGridExportLimit',
        summary: 'Current grid export limit (enabled, factor, and limit)',
        path: '/dl_cgi/grid/export_limit',
        tag: 'Power & Grid'
    },
    {
        operationId: 'getGridProfileV1',
        summary: 'Active grid profile name, pending profile, and apply progress',
        path: '/dl_cgi/grid/profile',
        tag: 'Power & Grid'
    },
    {
        operationId: 'getGridProfile',
        summary: 'Active grid profile detail per subsystem (v2)',
        path: '/dl_cgi/grid/v2/profile',
        tag: 'Power & Grid'
    },
    {
        operationId: 'getGridProfiles',
        summary: 'Full list of all available grid profiles on the PVS',
        path: '/dl_cgi/grid/profiles',
        tag: 'Power & Grid'
    },

    // ── Devices ────────────────────────────────────────────────────────────
    {
        operationId: 'getDevices',
        summary: 'Full device list (inverters, meters, PVS supervisor, etc.)',
        path: '/dl_cgi/devices/list',
        tag: 'Devices'
    },
    {
        operationId: 'getCandidates',
        summary: 'Candidate devices queued for connectivity checks',
        path: '/dl_cgi/candidates',
        tag: 'Devices'
    },
    {
        operationId: 'getPingableDevices',
        summary: 'Devices that can be pinged for connectivity testing',
        path: '/dl_cgi/network/getPingableDevices',
        tag: 'Devices'
    },

    // ── Panels ─────────────────────────────────────────────────────────────
    {
        operationId: 'getPanelsLayout',
        summary: 'Panel layout stored on the PVS (positions and serial numbers)',
        path: '/dl_cgi/panels/layout',
        tag: 'Panels'
    },

    // ── Network ────────────────────────────────────────────────────────────
    {
        operationId: 'getNetworkInterfaces',
        summary: 'Network interface names and basic status',
        path: '/dl_cgi/network/interfaces',
        tag: 'Network'
    },
    {
        operationId: 'getGeneralNetworkSettings',
        summary: 'General network configuration (hostname, DNS, NTP, etc.)',
        path: '/dl_cgi/network/settings',
        tag: 'Network'
    },
    {
        operationId: 'getFirewallSettings',
        summary: 'Firewall rules and settings',
        path: '/dl_cgi/network/firewallSettings',
        tag: 'Network'
    },
    {
        operationId: 'getWhitelist',
        summary: 'Network whitelist entries',
        path: '/dl_cgi/network/whitelist',
        tag: 'Network'
    },
    {
        operationId: 'getInterfaceConfig (eth)',
        summary: 'Ethernet interface configuration (IP, DHCP, gateway, etc.)',
        path: '/dl_cgi/network/interfaceConfig/eth',
        tag: 'Network'
    },
    {
        operationId: 'getInterfaceConfig (wifi)',
        summary: 'WiFi interface configuration',
        path: '/dl_cgi/network/interfaceConfig/wifi',
        tag: 'Network'
    },
    {
        operationId: 'getInterfaceConfig (plc)',
        summary: 'Powerline (PLC) interface configuration',
        path: '/dl_cgi/network/interfaceConfig/plc',
        tag: 'Network'
    },
    {
        operationId: 'pingStatus',
        summary: 'Output of any currently running ping process',
        path: '/dl_cgi/network/ping',
        tag: 'Network'
    },
    {
        operationId: 'tunnelStatus',
        summary: 'Status of any open SSH tunnels',
        path: '/dl_cgi/network/tunnel',
        tag: 'Network'
    },

    // ── Communication ──────────────────────────────────────────────────────
    {
        operationId: 'getInterfaces',
        summary: 'Full detail for all communication interfaces (cell, WiFi, PLC, WAN)',
        path: '/dl_cgi/communication/interfaces',
        tag: 'Communication'
    },
    {
        operationId: 'getInterface (cell)',
        summary: 'Cellular interface details (signal, carrier, data usage)',
        path: '/dl_cgi/communication/interface/cell',
        tag: 'Communication'
    },
    {
        operationId: 'getInterface (sta0)',
        summary: 'WiFi station interface details',
        path: '/dl_cgi/communication/interface/sta0',
        tag: 'Communication'
    },
    {
        operationId: 'getInterface (wan)',
        summary: 'WAN interface details',
        path: '/dl_cgi/communication/interface/wan',
        tag: 'Communication'
    },
    {
        operationId: 'accessPoints',
        summary: 'Available WiFi access points visible to the PVS',
        path: '/dl_cgi/communication/ap',
        tag: 'Communication'
    },
    {
        operationId: 'isCellularPrimary',
        summary: 'Whether cellular is set as the primary network connection',
        path: '/dl_cgi/communication/cellular/primary',
        tag: 'Communication'
    },
    {
        operationId: 'isCellularPurchased',
        summary: 'Whether a cellular data plan has been purchased',
        path: '/dl_cgi/communication/cellular/purchased',
        tag: 'Communication'
    },

    // ── Firmware ───────────────────────────────────────────────────────────
    {
        operationId: 'getNewFirmwareVersion',
        summary: 'URL of newer firmware if an update is available',
        path: '/dl_cgi/firmware/new_version',
        tag: 'Firmware'
    },
    {
        operationId: 'getUpgradeStatus',
        summary: 'Status and progress of any firmware upgrade in progress',
        path: '/dl_cgi/firmware/upgrade',
        tag: 'Firmware'
    },

    // ── Energy Storage (ESS) ───────────────────────────────────────────────
    {
        operationId: 'getEssStatus',
        summary: 'Status of all energy storage system devices and any parameter errors',
        path: '/dl_cgi/energy-storage-system/status',
        tag: 'Energy Storage'
    },
    {
        operationId: 'getDeviceList (ESS pre-discover)',
        summary: 'All devices with ESS discovery errors (pre-commissioning)',
        path: '/dl_cgi/energy-storage-system/pre-discover',
        tag: 'Energy Storage'
    },
    {
        operationId: 'getFirmwareUpdateStatus',
        summary: 'Status of any ESS component firmware update in progress',
        path: '/dl_cgi/energy-storage-system/firmware/status',
        tag: 'Energy Storage'
    },

    // ── Health ─────────────────────────────────────────────────────────────
    {
        operationId: 'getSystemHealthCheckList',
        summary: 'All available equinox system health checks',
        path: '/dl_cgi/equinox-system-check/list',
        tag: 'Health'
    },
    {
        operationId: 'getSystemHealthReport',
        summary: 'Results and progress of the last system health check run',
        path: '/dl_cgi/equinox-system-check',
        tag: 'Health'
    },
];

function openDiagnosticWindow(apiBaseUrl) {
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

    const groupsJson = JSON.stringify(groups);
    const endpointsJson = JSON.stringify(DIAGNOSTIC_ENDPOINTS);

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
        .op-id a {
            color: inherit;
            text-decoration: none;
            border-bottom: 1px dashed #4ade80;
        }
        .op-id a:hover { color: #86efac; border-bottom-color: #86efac; }
        .op-summary { color: #9ca3af; font-size: 0.82rem; flex: 1; }
        .badge {
            font-size: 0.7rem;
            padding: 0.1rem 0.45rem;
            border-radius: 3px;
            font-weight: 600;
            white-space: nowrap;
        }
        .badge-loading { background: #374151; color: #9ca3af; }
        .badge-ok { background: #14532d; color: #86efac; }
        .badge-error { background: #450a0a; color: #fca5a5; }
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
        .json-key   { color: #93c5fd; }
        .json-str   { color: #86efac; }
        .json-num   { color: #fde68a; }
        .json-bool  { color: #f9a8d4; }
        .json-null  { color: #f9a8d4; }
        .err-text   { color: #fca5a5; }
    </style>
</head>
<body>
    <header>
        <h1>PVS6 System Diagnostics</h1>
        <p class="meta">
            Base URL: <code id="baseUrlDisplay"></code>
            &nbsp;&mdash;&nbsp; Fetching ${DIAGNOSTIC_ENDPOINTS.length} read-only endpoints
            &nbsp;&mdash;&nbsp; <span id="doneCount">0</span> / ${DIAGNOSTIC_ENDPOINTS.length} complete
        </p>
    </header>
    <div id="container"></div>

    <script>
        const API_BASE = ${JSON.stringify(apiBaseUrl)};
        const GROUPS   = ${groupsJson};
        const ENDPOINTS = ${endpointsJson};

        document.getElementById('baseUrlDisplay').textContent = API_BASE;

        let doneCount = 0;

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

        // ── Build the DOM structure ─────────────────────────────────────────
        const container = document.getElementById('container');

        Object.entries(GROUPS).forEach(([tag, endpoints]) => {
            const section = document.createElement('div');
            section.className = 'section';
            section.innerHTML = '<div class="section-title">' + tag + '</div>';

            endpoints.forEach(ep => {
                const url = API_BASE + ep.path;
                const card = document.createElement('div');
                card.className = 'card';
                card.id = 'card-' + ep.operationId.replace(/[^a-zA-Z0-9]/g, '_');

                card.innerHTML =
                    '<div class="card-header">' +
                        '<span class="op-id"><a href="' + encodeURI(url) + '" target="_blank" title="Open in new tab">' +
                            escapeHtml(ep.operationId) + ' &#8599;</a></span>' +
                        '<span class="op-summary">' + escapeHtml(ep.summary) + '</span>' +
                        '<span class="badge badge-loading" id="badge-' + ep.operationId.replace(/[^a-zA-Z0-9]/g, '_') + '">Loading...</span>' +
                    '</div>' +
                    '<div class="card-body">' +
                        '<pre id="resp-' + ep.operationId.replace(/[^a-zA-Z0-9]/g, '_') + '" class="spinner">Fetching...</pre>' +
                    '</div>';

                section.appendChild(card);
            });

            container.appendChild(section);
        });

        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        // ── Fetch all endpoints ─────────────────────────────────────────────
        ENDPOINTS.forEach(ep => {
            const safeId = ep.operationId.replace(/[^a-zA-Z0-9]/g, '_');
            const badge = document.getElementById('badge-' + safeId);
            const respEl = document.getElementById('resp-' + safeId);
            const url = API_BASE + ep.path;

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
                    badge.className = 'badge badge-error';
                    respEl.innerHTML = '<span class="err-text">' + escapeHtml(err.message) + '</span>';
                    respEl.classList.remove('spinner');
                })
                .finally(() => {
                    doneCount++;
                    document.getElementById('doneCount').textContent = doneCount;
                });
        });
    <\/script>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
}
