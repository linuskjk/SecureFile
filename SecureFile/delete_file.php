<?php
// filepath: \\ds920\web\SecureFile\delete_file.php
$username = $_POST['username'] ?? '';
$enc_name = $_POST['file'] ?? '';
$folderPath = $_POST['folder'] ?? ''; // Add this to your JS and send it!

if (!$username || !$enc_name) {
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

$folder = &findFolder($userData, $folderPath);
if ($folder === null) $folder = &$userData;

$found = false;
foreach ($folder['files'] as $i => $f) {
    if ($f['enc_name'] === $enc_name) {
        array_splice($folder['files'], $i, 1);
        $found = true;
        break;
    }
}
if ($found) {
    file_put_contents($userDataFile, json_encode($userData, JSON_PRETTY_PRINT));
    // Optionally, also delete the physical file:
    $filePath = "data/$username/$enc_name";
    if (file_exists($filePath)) unlink($filePath);
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'File not found']);
}