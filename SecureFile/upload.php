<?php
session_start();

require_once 'PHPMailer/PHPMailer.php';
require_once 'PHPMailer/SMTP.php';
require_once 'PHPMailer/Exception.php';
use PHPMailer\PHPMailer\PHPMailer;

$ip = $_SERVER['REMOTE_ADDR'];
$username = $_POST['username'] ?? '';

// --- Rate limit: max 10 requests per minute per IP ---
if (!is_dir(__DIR__ . "/rates")) mkdir(__DIR__ . "/rates");
$rateFile = __DIR__ . "/rates/rate_$ip.json";
$rate = file_exists($rateFile) ? json_decode(file_get_contents($rateFile), true) : [];
$now = time();
$rate = array_filter($rate, fn($t) => $now - $t < 60);
if (count($rate) >= 10) {
    // Send notification email to user about suspicious activity
    $userDataFile = "data/$username/$username.json";
    if (file_exists($userDataFile)) {
        $userData = json_decode(file_get_contents($userDataFile), true);
        $email = $userData['email'] ?? '';
        if ($email) {
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

                $resetUrl = "https://{$_SERVER['HTTP_HOST']}/SecureFile/reset_limit.php?username=" . urlencode($username) . "&ip=" . urlencode($ip);
                $mail->Subject = "SecureFile: Suspicious Activity Detected";
                $mail->Body = "Hello $username,<br><br>We detected unusual activity (too many upload requests) from your IP address ($ip).<br>If this was you, you can reset the limit using the button below. If not, please secure your account.<br><br>
                <a href='$resetUrl' style='display:inline-block;padding:12px 24px;background:#4286f4;color:#fff;text-decoration:none;border-radius:6px;font-size:16px;'>RESET RATES</a>
                <br><br>Best regards,<br>SecureFile Team";

                $mail->send();
            } catch (Exception $e) {
                // Optionally log $mail->ErrorInfo
            }
        }
    }
    http_response_code(429);
    exit("Rate limit exceeded");
}
$rate[] = $now;
file_put_contents($rateFile, json_encode($rate));

$username = $_POST['username'] ?? '';

if (!$username) {
    echo "No username provided";
    exit;
}

if (!isset($_FILES['file'])) {
    echo "No file uploaded";
    exit;
}

// Load user's key
$keyFile = "keys/$username.key";
if (!file_exists($keyFile)) {
    echo "Encryption key not found";
    exit;
}
$key = file_get_contents($keyFile);
$key = hash('sha256', $key); // Use SHA-256 hash of the key

if (!is_dir('data')) mkdir('data');
$userDir = "data/$username";
if (!is_dir($userDir)) mkdir($userDir);

$enc_name = bin2hex(random_bytes(16)); // Unique encrypted filename
$targetFile = $userDir . '/' . $enc_name;
$fileData = file_get_contents($_FILES['file']['tmp_name']);

// Encrypt file data
$encrypted = openssl_encrypt($fileData, 'AES-256-CBC', $key, 0, substr($key, 0, 16));
file_put_contents($targetFile, $encrypted);

// Update user's file list
$userDataFile = "data/$username/$username.json";
$userData = file_exists($userDataFile) ? json_decode(file_get_contents($userDataFile), true) : ["folders" => [], "files" => []];
if (!isset($userData['folders'])) $userData['folders'] = [];
if (!isset($userData['files'])) $userData['files'] = [];

$folderPath = $_POST['folder'] ?? ''; // e.g. "asdasd/test"

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

$targetFolder = &findFolder($userData, $folderPath);
if ($targetFolder === null) $targetFolder = &$userData; // fallback to root

$fileObj = [
  "orig_name" => $_FILES['file']['name'],
  "enc_name" => $enc_name,
  "size" => filesize($targetFile),
  "uploaded" => time()
];
$targetFolder['files'][] = $fileObj;

file_put_contents($userDataFile, json_encode($userData, JSON_PRETTY_PRINT));
echo "File uploaded and encrypted successfully";