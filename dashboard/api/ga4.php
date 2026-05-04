<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$clientEmail = 'fatbike-dashboard@ga4-api-project-485322.iam.gserviceaccount.com';
$privateKey  = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDkTBk0Hs1Qoo9E\nGp4if/hElq1eNTI7i6pKtMOUC0uMaX6/Bp7sUThD/6AnLDF7bQWuGb2czBDOO6ix\njiDx5hFNeLOxvw87TjnOjRmsCLrd5DSMcAB0YJQSzLBnA7RcFKUYiuXrVc9qhDc2\nUX3+IoTdMHhSgkeZHE8sKBFi2AG2lBktFrLXgts973WN0rs0c1CG9Z6I/VOATmS4\nBnRmlSst1zK3ktVqI6/c0ka9yOfdrpxz3F/CATzpT1bISEzWMIXOuFUlava/D9oj\nVeS26crV5ZZARE9NGghHAYQAaAuUUFXnS2O53PjBkwD+YwcO7g/RtJtjy/Dsyyr5\nQ5reflMhAgMBAAECggEACsp9C31kO4o/htrSPDO7zrQnlDMkAXQH09mo//OrucKX\nytw7gVSSegZYcdmRKjIcSV8umv17UuA3iFL9RCnZigWpSr7K78TyDw0U2FCeUpQx\nlqzJnLae8SeLNAdVDGAucJNKLF5FPFXtDSx7bdqAWLssiMvfKgHQTThEoB0xMYnG\nLo6hDT3ajLV3BOSz45v/F2z3aQcTNn0eHhJWVw2EkvQeqVn0r7jvjUrulW7EYc5S\n3/NQOcumz4gn147PaY5I7/jZ5rfa/6BK+wGEr0N03/9P/o0mPyF+DrGey/hiWmTm\niUwJWD9tsltY+1ohrAADY09RqfgI70hLYAlsJa3wtQKBgQD1Uw5Z6Thw2lbGpOw3\nNiVTCfdg4App4p+F4ccgfsVW9Wd3WaaN9bCgfceQwhFVEVb1ViskQM9uVSqobWzK\nl85TkrBG9OXWSD1/aRPsn17MfZ69rmjnCYDz8MLjX9ADJ/1A3vXPPdLfZP/6nHzE\nZN0gvpfgp+RrA6PrwKCDf6s9DQKBgQDuO1uJbk8Piooj64GGrI/Wkio9aZsmJRqQ\nJbsRmHJ/H6Ye3luCoaoYwLQnr/KtQgFxlWG3tFv3Lm+lg/AcAfT8uV+aXOsLzjXy\nva/3/GzWw4deSyVoco81gHBLlSdjPithC6zbguWOS5E9pwolJpccNggM/+a0Y/rL\nP8LKF87xZQKBgQCMEBxsdvwTaoUKqtR2fUJ4E4OaWq93XrznKk2PHvG6QSgOey/d\ncv2h084htrtAj0LPlZ/R9fK4MoXFXZw0WtGg42ojSOUEH4CFAtAuU5tDMyFzeGVK\nKyHlpHsQZ/6SHr230NQUu15uzvJa+gc99bxOWqLJz/FYq95l1jeOfFCe7QKBgQCl\nfnilbQrhGfXC5DxzqPa3MYzEYtOT2Ryt3HgqzgNkCkFlmkRp6BJ45Y2BMHpeH8dO\n914Ntu5YNVr72T74xedBlSkz266w4cyaV2mh1SpquyQTvhI7j7GqkhHwf6oACFUs\nMmcfirwbcKVx9dNXYYqB34sSNMc4s2eqwB16NLXe/QKBgBpfrdMEpwpiYiZY+/Qq\nsbniQ0i41/8P3cwAX+w2SLyFSzFC5jTANCryDQXgD/98iNec34tisyB/KDlLbqA5\nfg2tRIRXtAL7f+AJtEFp8jHOVIUFXSLkB0tIGUavgEyNHqncoDuoRxQyf1R2cGcC\nN+x/15+ogNNRMUqfO6uZJUA/\n-----END PRIVATE KEY-----\n";
$propertyId  = '492800314';

function b64url($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function getAccessToken($clientEmail, $privateKey) {
    $now     = time();
    $header  = b64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $payload = b64url(json_encode([
        'iss'   => $clientEmail,
        'scope' => 'https://www.googleapis.com/auth/analytics.readonly',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'exp'   => $now + 3600,
        'iat'   => $now,
    ]));

    $sigInput = "$header.$payload";
    $key = openssl_pkey_get_private($privateKey);
    openssl_sign($sigInput, $signature, $key, OPENSSL_ALGO_SHA256);
    $jwt = "$sigInput." . b64url($signature);

    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion'  => $jwt,
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    $resp = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($resp, true);
    if (empty($data['access_token'])) {
        throw new Exception('Token fout: ' . json_encode($data));
    }
    return $data['access_token'];
}

function runReport($token, $propertyId, $body) {
    $ch = curl_init("https://analyticsdata.googleapis.com/v1beta/properties/{$propertyId}:runReport");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);
    return json_decode($resp, true);
}

try {
    $token = getAccessToken($clientEmail, $privateKey);

    $summary = runReport($token, $propertyId, [
        'dateRanges' => [['startDate' => '30daysAgo', 'endDate' => 'today']],
        'metrics'    => [
            ['name' => 'sessions'],
            ['name' => 'totalUsers'],
            ['name' => 'screenPageViews'],
            ['name' => 'bounceRate'],
        ],
    ]);

    $pages = runReport($token, $propertyId, [
        'dateRanges' => [['startDate' => '30daysAgo', 'endDate' => 'today']],
        'dimensions' => [['name' => 'pagePath']],
        'metrics'    => [['name' => 'screenPageViews']],
        'orderBys'   => [['metric' => ['metricName' => 'screenPageViews'], 'desc' => true]],
        'limit'      => 10,
    ]);

    $exits = runReport($token, $propertyId, [
        'dateRanges' => [['startDate' => '30daysAgo', 'endDate' => 'today']],
        'dimensions' => [['name' => 'pagePath']],
        'metrics'    => [['name' => 'exits']],
        'orderBys'   => [['metric' => ['metricName' => 'exits'], 'desc' => true]],
        'limit'      => 10,
    ]);

    echo json_encode(['summary' => $summary, 'pages' => $pages, 'exits' => $exits]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
