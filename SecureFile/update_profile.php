<?php
// filepath: \\ds920\web\SecureFile\update_profile.php
$username = $_POST['username'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

$userDataFile = "data/$username/$username.json";
$usersFile = "users.json";

if (!file_exists($userDataFile)) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}
$userData = json_decode(file_get_contents($userDataFile), true);

if ($email) {
    $userData['email'] = $email;
    file_put_contents($userDataFile, json_encode($userData, JSON_PRETTY_PRINT));
    echo json_encode(['success' => true, 'message' => 'Email updated']);
    exit;
}
if ($password) {
    $users = json_decode(file_get_contents($usersFile), true);
    $users[$username] = password_hash($password, PASSWORD_DEFAULT);
    file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));
    echo json_encode(['success' => true, 'message' => 'Password updated']);
    exit;
}
echo json_encode(['success' => false, 'message' => 'No changes']);