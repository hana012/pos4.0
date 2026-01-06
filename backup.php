<?php
/**
 * Backup API Endpoint for POS System
 * 
 * Saves backup data to PostgreSQL database
 * 
 * Usage: POST to /api/backup.php with JSON backup data
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
// Update these with your actual PostgreSQL credentials
$db_config = [
    'host' => 'localhost',
    'port' => '5432',
    'dbname' => 'your_database_name',
    'username' => 'your_db_username',
    'password' => 'your_db_password'
];

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Initialize response
$response = [
    'success' => false,
    'message' => '',
    'backup_id' => null,
    'timestamp' => date('Y-m-d H:i:s')
];

try {
    // Only allow POST for creating backups
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method is allowed');
    }
    
    // Get JSON input
    $json_input = file_get_contents('php://input');
    $backup_data = json_decode($json_input, true);
    
    if (!$backup_data) {
        throw new Exception('Invalid JSON data received');
    }
    
    // Validate backup data structure
    if (!isset($backup_data['timestamp']) || !isset($backup_data['data'])) {
        throw new Exception('Invalid backup data structure. Missing timestamp or data field.');
    }
    
    // Connect to PostgreSQL
    $dsn = "pgsql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['dbname']}";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], $options);
    
    // Prepare backup data
    $backup_name = 'backup_' . date('Y-m-d_H-i-s');
    $backup_json = json_encode($backup_data);
    $data_size = strlen($backup_json);
    $version = $backup_data['version'] ?? '1.0';
    
    // Get username from session or request (if available)
    $created_by = $_POST['username'] ?? $_SERVER['PHP_AUTH_USER'] ?? 'system';
    
    // Insert backup into database
    $stmt = $pdo->prepare("
        INSERT INTO sonic_backups (
            backup_name, 
            timestamp, 
            version, 
            backup_data, 
            data_size, 
            created_by,
            description
        ) VALUES (
            :backup_name,
            :timestamp,
            :version,
            :backup_data::jsonb,
            :data_size,
            :created_by,
            :description
        ) RETURNING id
    ");
    
    $stmt->execute([
        ':backup_name' => $backup_name,
        ':timestamp' => $backup_data['timestamp'],
        ':version' => $version,
        ':backup_data' => $backup_json,
        ':data_size' => $data_size,
        ':created_by' => $created_by,
        ':description' => 'Automatic backup from POS system'
    ]);
    
    $result = $stmt->fetch();
    $backup_id = $result['id'];
    
    $response['success'] = true;
    $response['message'] = 'Backup saved successfully to database';
    $response['backup_id'] = $backup_id;
    $response['backup_name'] = $backup_name;
    $response['data_size'] = $data_size;
    $response['timestamp'] = $backup_data['timestamp'];
    
    http_response_code(200);
    
} catch (PDOException $e) {
    $response['success'] = false;
    $response['message'] = 'Database error: ' . $e->getMessage();
    $response['error_code'] = 'DB_ERROR';
    http_response_code(500);
    
    // Log error (in production, use proper logging)
    error_log('Backup API Error: ' . $e->getMessage());
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
    $response['error_code'] = 'VALIDATION_ERROR';
    http_response_code(400);
}

// Return JSON response
echo json_encode($response, JSON_PRETTY_PRINT);
?>

