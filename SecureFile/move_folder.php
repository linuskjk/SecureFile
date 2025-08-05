<?php
// filepath: \\ds920\web\SecureFile\move_folder.php
$username = $_POST['username'] ?? '';
$name = $_POST['name'] ?? '';
$from = $_POST['from'] ?? '';
$to = $_POST['to'] ?? '';

if (!$username || !$name) {
    echo json_encode(['success' => false, 'message' => 'Missing parameters']);
    exit;
}

$userDataFile = "data/$username/$username.json";
if (!file_exists($userDataFile)) {
    echo json_encode(['success' => false, 'message' => 'User data not found']);
    exit;
}
$userData = json_decode(file_get_contents($userDataFile), true);

function &findFolder(&$root, $path) {
    if (!$path) return $root;
    $parts = explode('/', $path);
    $current = &$root;
    foreach ($parts as $part) {
        $found = false;
        foreach ($current['folders'] as &$f) {
            if ($f['name'] === $part) {
                $current = &$f;
                $found = true;
                break;
            }
        }
        if (!$found) return null;
    }
    return $current;
}

$fromFolder = &findFolder($userData, $from);
$toFolder = &findFolder($userData, $to);
if ($fromFolder === null || $toFolder === null) {
    echo json_encode(['success' => false, 'message' => 'Folder not found']);
    exit;
}

// Find and remove folder from source
foreach ($fromFolder['folders'] as $i => $f) {
    if ($f['name'] === $name) {
        // Prevent moving into itself or its subfolders
        if (strpos($to, trim($from . '/' . $name, '/')) === 0) {
            echo json_encode(['success' => false, 'message' => 'Cannot move folder into itself or its subfolder']);
            exit;
        }
        $folderObj = $f;
        array_splice($fromFolder['folders'], $i, 1);
        // Add to destination
        $toFolder['folders'][] = $folderObj;
        file_put_contents($userDataFile, json_encode($userData, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true]);
        exit;
    }
}
echo json_encode(['success' => false, 'message' => 'Folder not found']);