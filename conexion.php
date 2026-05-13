<?php
/* <--- CONEXIÓN PDO - SUPABASE (PostgreSQL) ---> */
$host   = 'db.czvlximshiptltziurkj.supabase.co';
$dbname = 'postgres';
$dbuser = 'postgres';
$dbpass = 'Emma1000ortiz@';  // La del proyecto Supabase
$port   = 5432;

/* DSN para PostgreSQL (sslmode=require obligatorio en Supabase) */
$dsn = "pgsql:host={$host};dbname={$dbname};port={$port};sslmode=require";

$opciones = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::ATTR_STRINGIFY_FETCHES  => false,
    PDO::ATTR_TIMEOUT            => 5,
];

try {
    $pdo = new PDO($dsn, $dbuser, $dbpass, $opciones);
} catch (PDOException $e) {
    error_log('[conexion] ' . $e->getMessage());
    http_response_code(503);
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH'])) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'msg' => 'Servicio no disponible. Intente más tarde.']);
    } else {
        echo 'No se pudo conectar al servidor. Intente más tarde.';
    }
    exit();
}