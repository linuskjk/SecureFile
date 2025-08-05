<?php
// filepath: \\ds920\web\SecureFile\move_file.php
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

// Find and remove file from source
foreach ($fromFolder['files'] as $i => $f) {
    if ($f['orig_name'] === $name) {
        $fileObj = $f;
        array_splice($fromFolder['files'], $i, 1);
        // Add to destination
        $toFolder['files'][] = $fileObj;
        file_put_contents($userDataFile, json_encode($userData, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true]);
        exit;
    }
}
echo json_encode(['success' => false, 'message' => 'File not found']);