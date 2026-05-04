<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Methode niet toegestaan']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Ongeldige JSON']);
    exit;
}

$receiver = $input['receiver'] ?? '';
$tel      = $input['tel']      ?? '';
$cityId   = $input['cityId']   ?? '';
$adres    = $input['adres']    ?? '';
$bedrag   = $input['bedrag']   ?? '0';

$apiKey     = '51a248-93272f-32fb3f-0db207-af74c6';
$customerId = '79103';

if (!$receiver || !$tel || !$cityId) {
    http_response_code(400);
    echo json_encode(['error' => 'Naam, telefoon en stad zijn verplicht']);
    exit;
}

$postData = [
    'parcel-receiver' => $receiver,
    'parcel-phone'    => $tel,
    'parcel-city'     => (string)$cityId,
    'parcel-address'  => $adres,
    'parcel-price'    => (string)(floatval($bedrag) ?: 0),
    'parcel-stock'    => '0',
];

$ch = curl_init("https://api.ozonexpress.ma/customers/{$customerId}/{$apiKey}/add-parcel");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Verbinding mislukt: ' . $curlErr]);
    exit;
}

$data = json_decode($response, true);
if (!$data) {
    $data = ['raw' => $response];
}

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(['error' => "OzonExpres fout: {$httpCode}", 'details' => $data]);
    exit;
}

$result = $data['ADD-PARCEL']['RESULT'] ?? null;
if ($result === 'ERROR') {
    $msg = $data['ADD-PARCEL']['MESSAGE'] ?? 'Onbekende fout';
    http_response_code(400);
    echo json_encode(['error' => $msg, 'details' => $data]);
    exit;
}

$tracking = $data['ADD-PARCEL']['NEW-PARCEL']['TRACKING-NUMBER']
    ?? $data['ADD-PARCEL']['BARCODE']
    ?? $data['ADD-PARCEL']['TRACKING-NUMBER']
    ?? null;

echo json_encode(['tracking' => $tracking, 'data' => $data]);
