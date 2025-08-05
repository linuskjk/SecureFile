<?php
// filepath: \\ds920\web\SecureFile\rename_file.php
$username = $_POST['username'] ?? '';
$old = $_POST['old'] ?? '';
$new = $_POST['new'] ?? '';

if (!$username || !$old || !$new) {
    echo json_encode(['success' => false, 'message' => 'Missing parameters']);
    exit;
}

$userDataFile = "data/$username/$username.json";
if (!file_exists($userDataFile)) {
    echo json_encode(['success' => false, 'message' => 'User data not found']);
    exit;
}

$userData = json_decode(file_get_contents($userDataFile), true);
$found = false;

// Check for duplicate name (skip the file being renamed)
foreach ($userData['files'] as $file) {
    if (
        strtolower($file['orig_name']) === strtolower($new) &&
        $file['orig_name'] !== $old
    ) {
        echo json_encode(['success' => false, 'message' => 'A file with that name already exists']);
        exit;
    }
}

// Update orig_name for the correct file
foreach ($userData['files'] as &$file) {
    if ($file['orig_name'] === $old) {
        $file['orig_name'] = $new;
        $found = true;
        break;
    }
}
unset($file);

if (!$found) {
    echo json_encode(['success' => false, 'message' => 'File not found']);
    exit;
}

file_put_contents($userDataFile, json_encode($userData, JSON_PRETTY_PRINT));
echo json_encode(['success' => true]);