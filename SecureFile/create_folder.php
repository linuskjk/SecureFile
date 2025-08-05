<?php
// filepath: \\ds920\web\SecureFile\create_folder.php
$username = $_POST['username'] ?? '';
$folder = $_POST['folder'] ?? '';
$parent = $_POST['parent'] ?? ''; // path like "Folder1/Subfolder2"

if (!$username || !$folder) {
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

if (!isset($userData['folders'])) $userData['folders'] = [];
$parentFolder = &findFolder($userData, $parent);

if ($parentFolder === null) {
    echo json_encode(['success' => false, 'message' => 'Parent folder not found']);
    exit;
}

// Check for duplicate
foreach ($parentFolder['folders'] as $f) {
    if ($f['name'] === $folder) {
        echo json_encode(['success' => false, 'message' => 'Folder already exists']);
        exit;
    }
}

$parentFolder['folders'][] = [
    'name' => $folder,
    'folders' => [],
    'files' => []
];

file_put_contents($userDataFile, json_encode($userData, JSON_PRETTY_PRINT));
echo json_encode(['success' => true]);