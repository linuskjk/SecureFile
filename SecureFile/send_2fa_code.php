<?php
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';
require 'PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;

$username = $_POST['username'] ?? '';
if (!$username) {
    echo json_encode(['status' => 'error', 'error' => 'Missing username']);
    exit;
}

$userDataFile = "data/$username/$username.json";
if (!file_exists($userDataFile)) {
    echo json_encode(['status' => 'error', 'error' => 'User not found']);
    exit;
}
$data = json_decode(file_get_contents($userDataFile), true);
$email = $data['email'] ?? '';
if (!$email) {
    echo json_encode(['status' => 'error', 'error' => 'No email set for user']);
    exit;
}

$code = rand(100000, 999999);
if (!is_dir('codes')) mkdir('codes');
$codeFile = "codes/$username.json";
file_put_contents($codeFile, json_encode([
    'code' => $code,
    'time' => time()
]));

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'my2fasender@gmail.com';
    $mail->Password = 'eavkxgvlgzpyhusa';
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;

    $mail->setFrom('my2fasender@gmail.com', 'SecureFile');
    $mail->addAddress($email, $username);

    $mail->Subject = "Your SecureFile 2FA Code";
    $mail->Body = "Hello $username,\n\nYour 2FA code is: $code\n\nThis code expires in 5 minutes.";

    $mail->send();
    echo json_encode(['status' => 'ok']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'error' => 'Failed to send email: ' . $mail->ErrorInfo]);
}
?>