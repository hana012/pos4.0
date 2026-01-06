<?php
/**
 * VPS & Database Status API Endpoint
 * 
 * This endpoint checks the status of the VPS server and PostgreSQL database connection.
 * Place this file in an 'api' folder in your website root directory.
 * 
 * Usage: Access via /api/status.php from your vps-status.html page
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// PostgreSQL Database configuration
// Update these with your actual database credentials
$db_config = [
    'host' => 'localhost',
    'port' => '5432',  // PostgreSQL default port
    'dbname' => 'your_database_name',
    'username' => 'your_db_username',
    'password' => 'your_db_password'
];

$response = [
    'status' => 'success',
    'timestamp' => date('Y-m-d H:i:s'),
    'vps' => [],
    'database' => []
];

// Check VPS/Server Status
$response['vps'] = [
    'online' => true,
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'Unknown',
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'php_version' => phpversion(),
    'server_time' => date('Y-m-d H:i:s'),
    'timezone' => date_default_timezone_get()
];

// Check PostgreSQL Database Connection
try {
    // PostgreSQL DSN format: pgsql:host=hostname;port=5432;dbname=database
    $dsn = "pgsql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['dbname']}";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $start_time = microtime(true);
    $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], $options);
    $connection_time = round((microtime(true) - $start_time) * 1000, 2);
    
    // Get PostgreSQL database info
    $db_info = $pdo->query("SELECT version() as version, current_database() as db_name")->fetch();
    
    // Get table count (PostgreSQL way)
    $table_count_query = $pdo->query("
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    ");
    $table_count = $table_count_query->fetch()['count'] ?? 0;
    
    // Get database size
    $db_size_query = $pdo->query("
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
    ");
    $db_size = $db_size_query->fetch()['size'] ?? 'Unknown';
    
    $response['database'] = [
        'connected' => true,
        'db_type' => 'PostgreSQL',
        'db_name' => $db_info['db_name'] ?? $db_config['dbname'],
        'db_version' => $db_info['version'] ?? 'Unknown',
        'connection_time_ms' => $connection_time,
        'table_count' => (int)$table_count,
        'database_size' => $db_size,
        'host' => $db_config['host'],
        'port' => $db_config['port']
    ];
    
} catch (PDOException $e) {
    $response['database'] = [
        'connected' => false,
        'error' => $e->getMessage(),
        'db_type' => 'PostgreSQL',
        'host' => $db_config['host'],
        'port' => $db_config['port']
    ];
    
    $response['status'] = 'partial';
} catch (Exception $e) {
    $response['database'] = [
        'connected' => false,
        'error' => 'Database configuration not set',
        'message' => 'Please configure PostgreSQL database credentials in api/status.php',
        'db_type' => 'PostgreSQL'
    ];
    
    $response['status'] = 'partial';
}

// Return JSON response
echo json_encode($response, JSON_PRETTY_PRINT);
?>

