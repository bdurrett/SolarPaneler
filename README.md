# SolarPaneler

Render SunPower / SunStrong PVS6 solar panels in your browser, showing live power production and
per-panel details. Includes a full system diagnostics view covering network, firmware, grid, and device status.

Detailed post at [Self Hosting PVS6 Monitoring (software included!)](https://brett.durrett.net/self-hosting-pv6-monitoring-software-included/)

This update supports the SunStrong firmware changes, tested with 2025.10, Build 61846, but probably works
with anything after 2025.06, Build 61839. Due to changes with the PVS6 serving, it is no longer possible
to run this as 100% standalone webpage, it will require running from a server that has access to the PVS6.
Currently some functionality is limited, notably the automatic reading of the panel layout (it looks like
SunStrong requires installer-level access to read this now 😒), so you can still manually set your layout.

The current update is still very much a work in progress in migrating to the SunStrong API.

Previous versions of this app make the calls to the PVS6 directly from the web browser (no server 
is needed at all), and that means the device running the browser must be able to reach the PVS6 on 
the network). Do to changes from SunPower / SunStrong, this only works with firmware 2025.06, Build 61839
and earlier (pull earlier versions of this app if that is your firmaware)


![Basic Layout](screenshots/basic-layout.png)

## Requirements

- A web server with **PHP** (tested with Apache, NGINX should work) that has network access to the PVS6
- PHP **curl** extension enabled (`php -m | grep curl`)
- PVS6 on firmware **Build 61840 or later** (SunStrong API)

The PVS6 now enforces CORS headers that block direct browser requests, so the app must be served
from a PHP-capable web server that proxies all PVS6 communication server-side. The browser never
talks to the PVS6 directly.

> **Older firmware?** Firmware Build 61839 and earlier used a different API and allowed direct
> browser access. Check out an earlier commit of this repo if that matches your setup.

## Installation

### 1. Deploy files to your web server

Copy all project files to a directory served by Apache (e.g. `/var/www/html/SolarPaneler/`).

### 2. Configure PVS6 credentials

```bash
cp pvs_config.example.php pvs_config.php
```

Edit `pvs_config.php`:

```php
return [
    'pvs_host'       => '192.168.1.100',   // PVS6 IP address or hostname
    'pvs_username'   => 'ssm_owner',        // always ssm_owner
    'pvs_password'   => 'XXXXX',            // last 5 characters of PVS6 serial number
    'pvs_ssl_verify' => false,              // PVS6 uses a self-signed certificate
    'panel_layout'   => null,              // optional: see Panel Layout section below
];
```

`pvs_config.php` is gitignored and never committed.

### 3. Make the cache directory writable

The `cache/` directory stores the session token and saved panel layout. Apache's user needs write access:

```bash
chown www-data:www-data cache    # use 'apache' instead of 'www-data' on RHEL/CentOS
chmod 775 cache
```

### 4. Load the app

Open the app in your browser. On first load it will:

1. Authenticate with the PVS6 using the credentials in `pvs_config.php`
2. Discover all inverters and display them in a grid
3. Show live power output on each panel

## Authentication

The PVS6 local API uses **HTTP Basic Auth** at login, then a **session token** for all subsequent
requests. The PHP proxy handles this transparently — it logs in, stores the token in `/tmp/`, and
re-authenticates automatically when the session expires.

Credentials:
| Field | Value |
|---|---|
| Username | `ssm_owner` |
| Password | Last 5 characters of the PVS6 serial number |

The serial number is printed on the label attached to the PVS6 unit.

## Panel Layout

### How it works

On first load, the app auto-generates a panel grid from the inverters it discovers. Each panel is
assigned the serial number of its inverter, so live power data matches immediately.

The panel layout endpoint on the PVS6 (`/dl_cgi/panels/layout`) requires **installer-level**
credentials and returns 403 for the owner account — this appears to be intentional by SunStrong.
The auto-generated layout is a functional substitute.

### Saving your layout

Once you've arranged panels to match your physical roof:

1. Open **Settings** and enable **Edit panel placement**
2. Drag panels into position (grid snap is on by default)
3. Press **Ctrl+Z** to undo the last move if needed
4. Open **Settings** and click **Save to Server**

This writes the layout to `cache/layout.json` on the server. It will load on every device from
then on — no per-browser configuration needed.

### Exporting a layout file

**Export Layout** in Settings downloads `panel-layout-export.json`. This is a backup you can
keep or use to manually set `panel_layout` in `pvs_config.php` for a hard-coded override
(takes priority over the server-saved layout).

### Customising panels

Each panel in the layout supports optional fields:

| Field | Purpose |
|---|---|
| `label` | Friendly display name shown on the panel and in the tooltip |
| `ratedWatts` | Nameplate capacity; enables efficiency % in the tooltip |

These can be set by editing `cache/layout.json` directly or by configuring `panel_layout` in
`pvs_config.php`.

## Diagnostics

Click **Diagnostics** to open a separate window that queries read-only PVS6 endpoints and
displays the results — firmware version, network interfaces, grid profile, communication status,
energy storage, and more.

All diagnostic requests are proxied through the server (same session token as the main app).
Endpoints that require installer-level access return 403 — this is expected and not a bug.

![Diagnostics](screenshots/diagnostics.png)

## Proxy API reference

The PHP proxy (`api.php`) accepts these actions via `?action=`:

| Action | Method | Description |
|---|---|---|
| `power` | GET | Fetch live inverter telemetry from the PVS6 varserver |
| `layout` | GET | Return saved layout (`cache/layout.json`) or empty if none |
| `save_layout` | POST | Save panel positions to `cache/layout.json` |
| `proxy` | GET | Forward a `/cgi-bin/dl_cgi/*` path to the PVS6 (diagnostics) |
| `debug` | GET | Connection diagnostics — login, token, and endpoint tests |

## Troubleshooting

### 502 errors on first load

Run `api.php?action=debug` in your browser. It tests each step of the connection chain and returns
a JSON object showing exactly where the failure is.

Common causes:
- `pvs_config.php` missing or has wrong credentials
- `cache/` directory not writable by the web server
- PVS6 not reachable from the server (verify with `curl -k https://PVS6_IP/auth?login`)

### All panels show 0 W / night mode banner

Normal at night or when the grid is disconnected. If it shows during the day, check that
`api.php?action=power` returns `inverters` with non-zero `power_w` values.

### Panel layout resets after clearing browser data

Layout is stored server-side in `cache/layout.json`, not in the browser. Clearing browser
storage has no effect on the saved layout.

## References

* [SunStrong API](https://github.com/SunStrong-Management/pypvs/blob/main/doc/LocalAPI.md)
* [PVS6 Varserver variables](https://github.com/SunStrong-Management/pypvs/blob/main/doc/varserver-variables-public-pvs6.csv)

