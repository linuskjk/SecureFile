<?php
// filepath: \\ds920\web\SecureFile\get_files.php
$username = $_POST['username'] ?? '';
$userDataFile = "data/$username/$username.json";
if (!file_exists($userDataFile)) {
    echo json_encode(["folders" => [], "files" => []]);
    exit;
}
$userData = json_decode(file_get_contents($userDataFile), true);
if (!isset($userData['folders'])) $userData['folders'] = [];
if (!isset($userData['files'])) $userData['files'] = [];
echo json_encode($userData);