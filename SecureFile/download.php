<?php
// filepath: \\ds920\web\SecureFile\download.php
session_start();

require_once 'PHPMailer/PHPMailer.php';
require_once 'PHPMailer/SMTP.php';
require_once 'PHPMailer/Exception.php';
use PHPMailer\PHPMailer\PHPMailer;

$ip = $_SERVER['REMOTE_ADDR'];
$username = $_GET['username'] ?? '';
$enc_name = $_GET['file'] ?? '';
$orig_name = $_GET['name'] ?? 'downloaded_file';

if (!$username || !$enc_name) {
    http_response_code(400);
    exit('Missing parameters');
}

// Load user's key
$keyFile = "keys/$username.key";
if (!file_exists($keyFile)) {
    http_response_code(403);
    exit('Key not found');
}
$key = file_get_contents($keyFile);
$key = hash('sha256', $key); // Use SHA-256 hash of the key

$filePath = "data/$username/$enc_name";
if (!file_exists($filePath)) {
    http_response_code(404);
    exit('File not found');
}

$encrypted = file_get_contents($filePath);
$decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, substr($key, 0, 16));
if ($decrypted === false) {
    http_response_code(500);
    exit('Decryption failed');
}

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
                $mail->isHTML(true);
                $mail->Body = "Hello $username,<br><br>We detected unusual activity (too many download requests) from your IP address ($ip).<br>If this was you, you can reset the limit using the button below. If not, please secure your account.<br><br>
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

header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . basename($orig_name) . '"');
header('Content-Length: ' . strlen($decrypted));
echo $decrypted;
exit;