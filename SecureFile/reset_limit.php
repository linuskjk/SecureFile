<?php
// filepath: \\ds920\web\SecureFile\reset_limit.php
$username = $_GET['username'] ?? '';
$ip = $_GET['ip'] ?? '';
if (!$username || !$ip) {
    echo "Missing parameters.";
    exit;
}
$rateFile = __DIR__ . "/rates/rate_$ip.json";
if (file_exists($rateFile)) {
    unlink($rateFile);
    $msg = "Rate limit for $ip has been reset for $username.";
} else {
    $msg = "No rate limit found for $ip.";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Rate Limit Reset</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f5f8ff; text-align: center; margin-top: 10%; }
        .msg { background: #fff; border: 1px solid #4286f4; border-radius: 8px; padding: 30px; display: inline-block; }
        a { display: block; margin-top: 20px; color: #4286f4; text-decoration: none; }
    </style>
</head>
<body>
    <div class="msg">
        <h2>Reset Limit</h2>
        <p><?= htmlspecialchars($msg) ?></p>
        <a href="index.html">Back to Login</a>
    </div>
</body>
</html>