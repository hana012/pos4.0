<?php
/**
 * List Backups API Endpoint
 * 
 * Retrieves list of backups from PostgreSQL database
 * 
 * Usage: GET /api/list-backups.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Database configuration
$db_config = [
    'host' => 'localhost',
    'port' => '5432',
    'dbname' => 'your_database_name',
    'username' => 'your_db_username',
    'password' => 'your_db_password'
];

$response = [
    'success' => false,
    'backups' => [],
    'count' => 0
];

try {
    // Connect to PostgreSQL
    $dsn = "pgsql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['dbname']}";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    
    $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], $options);
    
    // Get limit from query parameter (default 50)
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $limit = min($limit, 100); // Max 100
    
    // Fetch backups
    $stmt = $pdo->prepare("
        SELECT 
            id,
            backup_name,
            timestamp,
            version,
            data_size,
            created_by,
            description,
            created_at
        FROM sonic_backups
        ORDER BY timestamp DESC
        LIMIT :limit
    ");
    
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $backups = $stmt->fetchAll();
    
    $response['success'] = true;
    $response['backups'] = $backups;
    $response['count'] = count($backups);
    
    http_response_code(200);
    
} catch (PDOException $e) {
    $response['success'] = false;
    $response['message'] = 'Database error: ' . $e->getMessage();
    http_response_code(500);
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
    http_response_code(400);
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>

