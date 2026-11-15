<?php
/**
 * External Web Service Interoperability Endpoint: Dr. Marc Conrad's Fish Game API
 * File: backend/api/fish.php
 * 
 * Demonstrates:
 * - Theme C (Interoperability): Server-to-server communication via HTTP GET and JSON.
 * - Architectural Secure Proxy Pattern: Isolates the secret solution on the PHP backend.
 * - Single-Use Challenge Token Pattern: Prevents replay tampering and inspect-element cheats.
 * - Virtual Identity (Theme D): Bounds bonus rewards directly to the authenticated player session.
 */

require_once __DIR__ . '/../config/database.php';
requireApiAuth();

$userId = (int)$_SESSION['user_id'];
$action = $_GET['action'] ?? ($_POST['action'] ?? 'challenge');

// External API endpoints for Dr. Marc Conrad's Fish API
$apiUrls = [
    'https://marcconrad.com/uob/fish/api.php?out=json',
    'https://www.marcconrad.com/uob/fish/api.php?out=json',
];

/**
 * Helper to fetch JSON from external REST API using cURL with fallback.
 */
function fetchExternalFishApi($urls) {
    foreach ($urls as $url) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'FishCatcher-Client/1.0 (University of Bedfordshire Student Demo)');

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response && $httpCode === 200) {
            $data = json_decode($response, true);
            if (isset($data['question']) && isset($data['fish'])) {
                return $data;
            }
        }
    }

    // Try file_get_contents as secondary fallback
    foreach ($urls as $url) {
        $context = stream_context_create([
            'http' => [
                'timeout' => 5,
                'header'  => "User-Agent: FishCatcher-Client/1.0\r\n"
            ]
        ]);
        $response = @file_get_contents($url, false, $context);
        if ($response) {
            $data = json_decode($response, true);
            if (isset($data['question']) && isset($data['fish'])) {
                return $data;
            }
        }
    }

    return null;
}

// ========================================================
// ACTION: CHALLENGE (Fetch dynamic riddle from Marc Conrad API)
// ========================================================
if ($action === 'challenge') {
    $apiData = fetchExternalFishApi($apiUrls);

    if ($apiData) {
        $puzzleId = bin2hex(random_bytes(16));
        $solution = (int)$apiData['fish'];
        $imageUrl = $apiData['question'];

        // Store solution securely in session
        $_SESSION['current_puzzle'] = [
            'puzzle_id'  => $puzzleId,
            'solution'   => $solution,
            'user_id'    => $userId,
            'created_at' => time(),
        ];

        sendJsonResponse([
            'success'  => true,
            'puzzleId' => $puzzleId,
            'imageUrl' => $imageUrl,
            'prompt'   => 'Count the number of fish in the picture to unlock the Golden Oracle bonus!',
            'source'   => "Marc Conrad's Fish Game API (University of Bedfordshire)",
        ]);
    } else {
        // Resilient fallback puzzle if external service has network hiccups
        $puzzleId = bin2hex(random_bytes(16));
        $solution = 4;
        $imageUrl = 'https://www.sanfoh.com/uob/fish/data/ch_fc1517_233014_008x004.png';

        $_SESSION['current_puzzle'] = [
            'puzzle_id'  => $puzzleId,
            'solution'   => $solution,
            'user_id'    => $userId,
            'created_at' => time(),
        ];

        sendJsonResponse([
            'success'  => true,
            'puzzleId' => $puzzleId,
            'imageUrl' => $imageUrl,
            'prompt'   => 'Count the number of fish in the picture (Resilient Cache Mode)',
            'source'   => "Marc Conrad's Fish Game API (Offline Fallback)",
        ]);
    }
}

// ========================================================
// ACTION: VERIFY (Verify player's answer against stored solution)
// ========================================================
if ($action === 'verify') {
    // Read JSON or POST input
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $puzzleId = $raw['puzzleId'] ?? '';
    $userAnswer = isset($raw['answer']) ? (int)$raw['answer'] : -1;

    $activePuzzle = $_SESSION['current_puzzle'] ?? null;

    if (!$activePuzzle || $activePuzzle['puzzle_id'] !== $puzzleId) {
        sendJsonResponse([
            'success' => false,
            'error'   => 'Puzzle challenge expired or not found. Please catch another Oracle fish.'
        ], 404);
    }

    if ($activePuzzle['user_id'] !== $userId) {
        sendJsonResponse([
            'success' => false,
            'error'   => 'Unauthorized: Puzzle does not belong to the current hunter.'
        ], 403);
    }

    $solution = (int)$activePuzzle['solution'];
    $isCorrect = ($userAnswer === $solution);

    // Consume single-use challenge token immediately
    unset($_SESSION['current_puzzle']);

    $BONUS_MARKS   = 200; // Balanced reward: +200 marks for solving Dr. Marc Conrad riddle
    $PENALTY_MARKS = 50;  // Balanced penalty: -50 marks on incorrect guess

    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch();

        if ($user) {
            $currentScore = (int)$user['score'];
            $currentCatches = (int)$user['total_catches'];

            if ($isCorrect) {
                $newScore = $currentScore + $BONUS_MARKS;
                $newCatches = $currentCatches + 1;

                // Update database
                $update = $pdo->prepare("UPDATE users SET score = :score, total_catches = :catches WHERE id = :id");
                $update->execute([':score' => $newScore, ':catches' => $newCatches, ':id' => $userId]);

                $updateScore = $pdo->prepare("UPDATE scores SET score = :score, total_catches = :catches WHERE user_id = :id");
                $updateScore->execute([':score' => $newScore, ':catches' => $newCatches, ':id' => $userId]);

                sendJsonResponse([
                    'success'      => true,
                    'correct'      => true,
                    'solution'     => $solution,
                    'bonusMarks'   => $BONUS_MARKS,
                    'penaltyMarks' => 0,
                    'message'      => "Brilliant! The Oracle confirms {$solution} fish. +{$BONUS_MARKS} Bonus Marks awarded!",
                ]);
            } else {
                $newScore = max(0, $currentScore - $PENALTY_MARKS);

                $update = $pdo->prepare("UPDATE users SET score = :score WHERE id = :id");
                $update->execute([':score' => $newScore, ':id' => $userId]);

                $updateScore = $pdo->prepare("UPDATE scores SET score = :score WHERE user_id = :id");
                $updateScore->execute([':score' => $newScore, ':id' => $userId]);

                sendJsonResponse([
                    'success'      => true,
                    'correct'      => false,
                    'solution'     => $solution,
                    'bonusMarks'   => 0,
                    'penaltyMarks' => $PENALTY_MARKS,
                    'message'      => "Incorrect! The Oracle picture had {$solution} fish. -{$PENALTY_MARKS} Penalty Marks deducted!",
                ]);
            }
        }
    } catch (Exception $e) {
        sendJsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

// Invalid action
sendJsonResponse(['success' => false, 'error' => 'Unknown action requested.'], 400);
?>
