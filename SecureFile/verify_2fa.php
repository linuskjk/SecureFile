<?php
$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$code = $data['code'] ?? '';
$password = $data['password'] ?? '';

$userDataFile = "data/$username/$username.json";
$codeFile = "codes/$username.json";

if (!file_exists($userDataFile) || !file_exists($codeFile)) {
    echo json_encode(['success' => false, 'message' => 'User or code not found']);
    exit;
}

$userData = json_decode(file_get_contents($userDataFile), true);
$codeData = json_decode(file_get_contents($codeFile), true);

if (time() - $codeData['time'] > 300) { // 5 minutes
    unlink($codeFile);
    echo json_encode(['success' => false, 'message' => 'Code expired']);
    exit;
}

if ($code != $codeData['code']) {
    echo json_encode(['success' => false, 'message' => 'Invalid code']);
    exit;
}

// Password check
$users = json_decode(file_get_contents('users.json'), true);
if (!isset($users[$username]) || !password_verify($password, $users[$username])) {
    echo json_encode(['success' => false, 'message' => 'Invalid password']);
    exit;
}

// Success: delete code file
unlink($codeFile);
echo json_encode(['success' => true]);
?>