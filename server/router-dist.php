<?php
$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
if (str_starts_with($path, "/api")) {
    require dirname(__DIR__) . "/dist/server/public/api/index.php";
    return true;
}
return false;
