<?php
$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'];
$password = $data['password'];
$action = isset($data['action']) ? $data['action'] : 'login';

$users = json_decode(file_get_contents('users.json'), true);

if ($action === 'register') {
    $email = $data['email'] ?? '';
    if (isset($users[$username])) {
        echo json_encode(["success" => false, "message" => "User already exists"]);
    } else {
        $users[$username] = password_hash($password, PASSWORD_DEFAULT);
        file_put_contents('users.json', json_encode($users, JSON_PRETTY_PRINT));
        $userDir = "data/$username";
        if (!is_dir('data')) mkdir('data');
        if (!is_dir($userDir)) mkdir($userDir);
        // Save email in user's json file
        file_put_contents("$userDir/$username.json", json_encode([
            "files" => [],
            "email" => $email
        ], JSON_PRETTY_PRINT));
        // Generate and save a random key for the user
        if (!is_dir('keys')) mkdir('keys');
        $userKey = bin2hex(random_bytes(32)); // 256-bit key
        file_put_contents("keys/$username.key", $userKey);
        echo json_encode(["success" => true, "message" => "Registration successful"]);
    }
} else {
    if (isset($users[$username]) && password_verify($password, $users[$username])) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false]);
    }
}
