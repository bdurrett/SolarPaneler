<?php
// Copy this file to pvs_config.php and fill in your values.
// pvs_config.php is gitignored — never commit it.
return [
    // IP address or hostname of the PVS6 on your LAN
    'pvs_host' => '192.168.1.100',

    // Login credentials for the PVS6 local API
    // Username is always 'ssm_owner'
    // Password is the last 5 characters of the PVS6 serial number
    'pvs_username' => 'ssm_owner',
    'pvs_password' => 'XXXXX',

    // Set to false because the PVS6 uses a self-signed TLS certificate
    'pvs_ssl_verify' => false,

    // Optional: manual panel layout override.
    // Paste the array exported from the app here to make panel positions
    // persistent across devices without fetching from the PVS6.
    // When null, the layout is loaded from the PVS6 and cached in cache/layout.json.
    'panel_layout' => null,

    // Example panel_layout entry:
    // 'panel_layout' => [
    //     [
    //         'id' => 'panel-1', 'x' => 50, 'y' => 50,
    //         'width' => 80, 'height' => 120,
    //         'planeRotation' => 0,
    //         'inverterSerialNumber' => 'SN123',
    //         'label' => 'Garage South',
    //         'ratedWatts' => 400,
    //     ],
    // ],
];
