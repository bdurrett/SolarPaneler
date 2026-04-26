<?php
/**
 * PVS6 API proxy.
 *
 * All browser requests hit this file; it authenticates with the PVS6,
 * forwards requests, and returns JSON.  The PVS6 host and credentials
 * never leave the server.
 *
 * Actions (GET parameter):
 *   power        – fetch inverter telemetry via the varserver /vars endpoint
 *   layout       – return panel layout (cache/layout.json → PVS6 → cached)
 *   save_layout  – POST: save panel layout to cache/layout.json
 *   proxy        – GET: forward a /dl_cgi/* path to the PVS6 (for diagnostics)
 */

header('Content-Type: application/json');

$config      = require __DIR__ . '/pvs_config.php';
$cache_dir   = __DIR__ . '/cache';
$layout_file = $cache_dir . '/layout.json';
// Store the session cookie in /tmp so it's always writable by the web server
$cookie_file = sys_get_temp_dir() . '/pvs_session_' . md5($config['pvs_host'] ?? '') . '.txt';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'power':
        echo handle_power($config, $cookie_file);
        break;
    case 'layout':
        echo handle_layout($config, $cookie_file, $layout_file);
        break;
    case 'save_layout':
        echo handle_save_layout($layout_file);
        break;
    case 'proxy':
        echo handle_proxy($config, $cookie_file);
        break;
    case 'debug':
        echo handle_debug($config, $cookie_file);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action']);
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

function handle_debug(array $cfg, string $cookie_file): string
{
    $out = [];

    // 1. PHP curl extension
    $out['php_curl_loaded'] = extension_loaded('curl');

    // 2. Config values (password masked)
    $out['pvs_host']      = $cfg['pvs_host']     ?? '(not set)';
    $out['pvs_username']  = $cfg['pvs_username']  ?? '(not set)';
    $out['pvs_password']  = isset($cfg['pvs_password']) ? str_repeat('*', strlen($cfg['pvs_password'])) : '(not set)';
    $out['pvs_ssl_verify'] = $cfg['pvs_ssl_verify'] ?? false;

    // 3. Cache directory and cookie file location
    $cache_dir = __DIR__ . '/cache';
    $out['cache_dir_exists']    = is_dir($cache_dir);
    $out['cache_dir_writable']  = is_writable($cache_dir);
    $out['cookie_file']         = $cookie_file;
    $out['cookie_file_writable'] = is_writable(dirname($cookie_file));

    // 4. Raw TCP reachability (port 443)
    $host    = $cfg['pvs_host'] ?? '';
    $verify  = $cfg['pvs_ssl_verify'] ?? false;
    $timeout = 5;
    $sock    = @fsockopen('ssl://' . $host, 443, $errno, $errstr, $timeout);
    if ($sock) {
        fclose($sock);
        $out['tcp_443'] = 'open';
    } else {
        $out['tcp_443'] = "failed: $errstr ($errno)";
    }

    // 5. Attempt login — session token is in the JSON body, not a Set-Cookie header
    $url   = 'https://' . $host . '/auth?login';
    $b64   = base64_encode(($cfg['pvs_username'] ?? '') . ':' . ($cfg['pvs_password'] ?? ''));
    $ch    = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPGET        => true,
        CURLOPT_HTTPHEADER     => ['Authorization: basic ' . $b64],
        CURLOPT_SSL_VERIFYPEER => $verify,
        CURLOPT_SSL_VERIFYHOST => $verify ? 2 : 0,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $body                     = curl_exec($ch);
    $out['login_http_status'] = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $out['login_curl_error']  = curl_error($ch) ?: null;
    $out['login_response']    = ($body !== false) ? substr($body, 0, 500) : null;
    curl_close($ch);

    // 6. If login succeeded, test vars using the session token from the JSON body
    if ($out['login_http_status'] === 200) {
        $login_data    = json_decode($out['login_response'], true);
        $session_token = $login_data['session'] ?? null;
        $out['session_token'] = $session_token ? substr($session_token, 0, 12) . '...' : null;

        if ($session_token) {
            $cookie_hdr = ['Cookie: session=' . $session_token];

            $ch2 = curl_init();
            curl_setopt_array($ch2, [
                CURLOPT_URL            => 'https://' . $host . '/vars?match=/sys/devices/inverter/',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPGET        => true,
                CURLOPT_HTTPHEADER     => $cookie_hdr,
                CURLOPT_SSL_VERIFYPEER => $verify,
                CURLOPT_SSL_VERIFYHOST => $verify ? 2 : 0,
                CURLOPT_TIMEOUT        => 15,
            ]);
            $body2 = curl_exec($ch2);
            $out['vars_status']   = (int) curl_getinfo($ch2, CURLINFO_HTTP_CODE);
            $out['vars_response'] = ($body2 !== false) ? substr($body2, 0, 600) : curl_error($ch2);
            curl_close($ch2);
        }
    }

    return json_encode($out, JSON_PRETTY_PRINT);
}

function handle_power(array $cfg, string $cookie_file): string
{
    // API docs show vars as GET with query params: /vars?match=...
    $result = pvs_get($cfg, $cookie_file, '/vars?match=/sys/devices/inverter/');
    if (isset($result['error'])) {
        http_response_code(502);
        return json_encode($result);
    }

    // Group flat varserver values by inverter index, then key by serial number
    $grouped = [];
    foreach ($result['values'] ?? [] as $item) {
        // name format: /sys/devices/inverter/{index}/{param}
        $parts = explode('/', ltrim($item['name'], '/'));
        if (count($parts) < 5) continue;
        $idx   = (int) $parts[3];
        $param = $parts[4];
        $grouped[$idx][$param] = $item['value'];
    }

    $inverters = [];
    foreach ($grouped as $inv) {
        $serial = $inv['sn'] ?? null;
        if (!$serial) continue;
        $power_kw = isset($inv['p3phsumKw']) ? (float) $inv['p3phsumKw'] : 0.0;
        $inverters[$serial] = [
            'serial'          => $serial,
            'model'           => $inv['prodMdlNm']       ?? '',
            'power_kw'        => $power_kw,
            'power_w'         => round($power_kw * 1000, 2),
            'voltage_v'       => isset($inv['vln3phavgV'])    ? (float) $inv['vln3phavgV']    : null,
            'current_a'       => isset($inv['i3phsumA'])      ? (float) $inv['i3phsumA']      : null,
            'frequency_hz'    => isset($inv['freqHz'])        ? (float) $inv['freqHz']        : null,
            'temperature_c'   => isset($inv['tHtsnkDegc'])    ? (float) $inv['tHtsnkDegc']    : null,
            'dc_voltage_v'    => isset($inv['vMppt1V'])       ? (float) $inv['vMppt1V']       : null,
            'dc_current_a'    => isset($inv['iMppt1A'])       ? (float) $inv['iMppt1A']       : null,
            'dc_power_kw'     => isset($inv['pMppt1Kw'])      ? (float) $inv['pMppt1Kw']      : null,
            'lifetime_kwh'    => isset($inv['ltea3phsumKwh']) ? (float) $inv['ltea3phsumKwh'] : null,
            'last_report'     => $inv['msmtEps'] ?? null,
        ];
    }

    return json_encode(['inverters' => $inverters]);
}

function handle_layout(array $cfg, string $cookie_file, string $layout_file): string
{
    // Config-level override takes highest priority
    if (!empty($cfg['panel_layout'])) {
        return json_encode(['panels' => $cfg['panel_layout'], 'source' => 'config']);
    }

    // Cached layout (set via save_layout action) takes next priority
    if (file_exists($layout_file)) {
        $cached = file_get_contents($layout_file);
        if ($cached !== false) {
            return $cached; // already valid JSON
        }
    }

    // Fall through: fetch from PVS6 and cache the raw response
    $result = pvs_get($cfg, $cookie_file, '/dl_cgi/panels/layout');
    if (isset($result['error'])) {
        // 404 means the layout endpoint doesn't exist in this firmware — return empty
        // so the app falls back to default panels rather than showing a 502 error
        return json_encode(['panels' => [], 'source' => 'pvs6_unavailable']);
    }

    $json = json_encode($result);
    @file_put_contents($layout_file, $json);
    return $json;
}

function handle_save_layout(string $layout_file): string
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        return json_encode(['error' => 'POST required']);
    }

    $body = file_get_contents('php://input');
    $panels = json_decode($body, true);
    if (!is_array($panels)) {
        http_response_code(400);
        return json_encode(['error' => 'Invalid JSON body']);
    }

    $payload = json_encode(['panels' => $panels, 'source' => 'saved', 'saved_at' => date('c')]);
    if (file_put_contents($layout_file, $payload) === false) {
        http_response_code(500);
        return json_encode(['error' => 'Could not write layout file']);
    }

    return json_encode(['ok' => true, 'count' => count($panels)]);
}

function handle_proxy(array $cfg, string $cookie_file): string
{
    $path = $_GET['path'] ?? '';

    // Only allow read-only dl_cgi paths to limit SSRF surface
    if (!preg_match('#^/dl_cgi/[a-zA-Z0-9/_-]+$#', $path)) {
        http_response_code(400);
        return json_encode(['error' => 'Invalid path']);
    }

    $result = pvs_get($cfg, $cookie_file, $path);
    if (isset($result['error']) && !isset($result['status'])) {
        http_response_code(502);
    }
    return json_encode($result);
}

// ---------------------------------------------------------------------------
// PVS6 HTTP helpers
// ---------------------------------------------------------------------------

/**
 * Log in to the PVS6 and save the session token to a file.
 * The PVS6 returns {"session": "TOKEN"} in the JSON body — no Set-Cookie header.
 */
function pvs_login(array $cfg, string $token_file): bool
{
    $url    = 'https://' . $cfg['pvs_host'] . '/auth?login';
    $verify = $cfg['pvs_ssl_verify'] ?? false;
    $b64    = base64_encode($cfg['pvs_username'] . ':' . $cfg['pvs_password']);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPGET        => true,
        CURLOPT_HTTPHEADER     => ['Authorization: basic ' . $b64],
        CURLOPT_SSL_VERIFYPEER => $verify,
        CURLOPT_SSL_VERIFYHOST => $verify ? 2 : 0,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $body   = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status !== 200 || $body === false) return false;

    $data    = json_decode($body, true);
    $session = $data['session'] ?? null;
    if (!$session) return false;

    file_put_contents($token_file, json_encode(['session' => $session]));
    return true;
}

/**
 * Load the stored PVS6 session token, or null if not yet obtained.
 */
function pvs_load_token(string $token_file): ?string
{
    if (!file_exists($token_file)) return null;
    $data = json_decode(file_get_contents($token_file), true);
    return $data['session'] ?? null;
}

/**
 * Detect an auth failure from a raw curl result.
 * The PVS6 returns HTTP 400 with errorcode 0x0040 when the session is missing/expired.
 */
function pvs_is_auth_failure(array $result): bool
{
    if ($result['status'] === 401 || $result['status'] === 0) return true;
    if ($result['status'] === 400) {
        $data = json_decode($result['body'], true);
        return ($data['errorcode'] ?? '') === '0x0040';
    }
    return false;
}

/**
 * GET a path from the PVS6, passing the session token as a Cookie header.
 * Lazy auth: obtains/refreshes the token automatically on auth failure.
 */
function pvs_get(array $cfg, string $token_file, string $path): array
{
    $url    = 'https://' . $cfg['pvs_host'] . $path;
    $verify = $cfg['pvs_ssl_verify'] ?? false;

    $token = pvs_load_token($token_file);
    if (!$token) {
        if (!pvs_login($cfg, $token_file)) return ['error' => 'PVS6 authentication failed'];
        $token = pvs_load_token($token_file);
    }

    $result = pvs_curl($url, ['Cookie: session=' . $token], $verify);

    if (pvs_is_auth_failure($result)) {
        if (!pvs_login($cfg, $token_file)) return ['error' => 'PVS6 authentication failed'];
        $token  = pvs_load_token($token_file);
        $result = pvs_curl($url, ['Cookie: session=' . $token], $verify);
    }

    if ($result['status'] !== 200) {
        return ['error' => 'PVS6 returned HTTP ' . $result['status'], 'body' => $result['body']];
    }
    $data = json_decode($result['body'], true);
    if ($data === null) {
        return ['error' => 'PVS6 returned non-JSON response', 'body' => $result['body']];
    }
    return $data;
}

/**
 * Low-level GET via cURL. Returns ['status' => int, 'body' => string].
 */
function pvs_curl(string $url, array $headers, bool $verify): array
{
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPGET        => true,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_SSL_VERIFYPEER => $verify,
        CURLOPT_SSL_VERIFYHOST => $verify ? 2 : 0,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $body   = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($body === false) {
        $status = 0;
        $body   = curl_error($ch);
    }
    curl_close($ch);
    return ['status' => $status, 'body' => (string) $body];
}
