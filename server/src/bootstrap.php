<?php
declare(strict_types=1);
namespace Lanes;
require_once __DIR__ . "/domain.php";
function config(): array
{
    $file = getenv("LANES_CONFIG");
    requireThat(
        is_string($file) && is_file($file),
        "The server has not been configured.",
        503,
    );
    $config = require $file;
    requireThat(is_array($config), "Invalid server configuration.", 503);
    foreach (["base_url", "db_dsn", "storage_path"] as $key) {
        requireThat(
            !empty($config[$key]),
            "Incomplete server configuration.",
            503,
        );
    }
    $url = parse_url($config["base_url"]);
    requireThat(
        ($url["scheme"] ?? "") === "https" ||
            (($url["scheme"] ?? "") === "http" &&
                in_array($url["host"] ?? "", ["localhost", "127.0.0.1"], true)),
        "Server base URL must use HTTPS.",
        503,
    );
    return $config;
}
function db(array $config): \PDO
{
    return new \PDO(
        $config["db_dsn"],
        $config["db_user"] ?? null,
        $config["db_password"] ?? null,
        [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            \PDO::ATTR_EMULATE_PREPARES => false,
        ],
    );
}
function query(\PDO $db, string $sql, array $params = []): \PDOStatement
{
    $statement = $db->prepare($sql);
    $statement->execute($params);
    return $statement;
}
function jsonBody(): array
{
    requireThat(
        str_starts_with(
            strtolower($_SERVER["CONTENT_TYPE"] ?? ""),
            "application/json",
        ),
        "Use application/json.",
        415,
    );
    $body = file_get_contents("php://input", false, null, 0, 16_000_001);
    requireThat(
        is_string($body) && strlen($body) <= 16_000_000,
        "Request exceeds 16 MB.",
        413,
    );
    try {
        $value = json_decode($body, true, 32, JSON_THROW_ON_ERROR);
    } catch (\JsonException) {
        throw new HttpError(400, "Invalid JSON.");
    }
    requireThat(is_array($value), "Expected a JSON object.", 400);
    return $value;
}
function startSession(array $config): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    ini_set("session.use_strict_mode", "1");
    session_name("lanes_session");
    session_set_cookie_params([
        "httponly" => true,
        "secure" => str_starts_with($config["base_url"], "https://"),
        "samesite" => "Lax",
        "path" => "/",
    ]);
    session_start();
}
function identity(\PDO $db, array $config, bool $write = false): array
{
    $authorization = $_SERVER["HTTP_AUTHORIZATION"] ?? "";
    if (preg_match('/^Bearer ([a-f0-9]{64})$/D', $authorization, $matches)) {
        $user = query(
            $db,
            "SELECT u.* FROM users u JOIN api_tokens t ON t.user_id=u.id WHERE t.token_hash=? AND t.expires_at>?",
            [hash("sha256", $matches[1]), time()],
        )->fetch();
    } else {
        startSession($config);
        if ($write) {
            $origin = $_SERVER["HTTP_ORIGIN"] ?? "";
            $expected = parse_url($config["base_url"]);
            $allowed =
                ($expected["scheme"] ?? "") .
                "://" .
                ($expected["host"] ?? "") .
                (isset($expected["port"]) ? ":" . $expected["port"] : "");
            requireThat(
                hash_equals($allowed, $origin),
                "Origin rejected.",
                403,
            );
        }
        $user =
            isset($_SESSION["user_id"]) &&
            ($_SESSION["expires_at"] ?? 0) > time()
                ? query($db, "SELECT * FROM users WHERE id=?", [
                    $_SESSION["user_id"],
                ])->fetch()
                : false;
    }
    requireThat(
        is_array($user),
        "Sign in with your organization account.",
        401,
    );
    requireThat(
        in_array($user["role"], ["player", "admin"], true),
        "Role required.",
        403,
    );
    return $user;
}
function imageAsset(string $data, array $config): string
{
    requireThat(
        preg_match(
            '#^data:image/(png|jpeg|webp);base64,([a-zA-Z0-9+/=]+)$#D',
            $data,
            $match,
        ) === 1,
        "Choose a PNG, JPEG, or WebP image.",
    );
    $bytes = base64_decode($match[2], true);
    requireThat(
        is_string($bytes) && strlen($bytes) <= 5 * 1024 * 1024,
        "Image exceeds 5 MB.",
    );
    requireThat(
        function_exists("imagecreatefromstring"),
        "The server needs the PHP GD extension.",
        503,
    );
    $dimensions = @getimagesizefromstring($bytes);
    requireThat(
        is_array($dimensions) &&
            $dimensions[0] >= 16 &&
            $dimensions[1] >= 16 &&
            $dimensions[0] <= 4096 &&
            $dimensions[1] <= 4096,
        "Invalid image dimensions.",
    );
    $image = @imagecreatefromstring($bytes);
    requireThat($image !== false, "Image could not be decoded.");
    ob_start();
    imagesavealpha($image, true);
    imagepng($image);
    $png = ob_get_clean();
    imagedestroy($image);
    requireThat(
        is_string($png) && strlen($png) <= 5 * 1024 * 1024,
        "Decoded image exceeds 5 MB.",
    );
    $id = hash("sha256", $png);
    $folder = rtrim($config["storage_path"], "/\\") . "/assets";
    if (!is_dir($folder)) {
        mkdir($folder, 0700, true);
    }
    $tmp = tempnam($folder, "asset-");
    file_put_contents($tmp, $png, LOCK_EX);
    rename($tmp, $folder . "/" . $id . ".png");
    return $id;
}
function profileOutput(array $user, array $config): array
{
    $out = [
        "schemaVersion" => 1,
        "displayName" => $user["display_name"],
        "background" => "",
        "laneSkin" => "",
    ];
    foreach (
        ["background" => "background_asset", "laneSkin" => "lane_asset"]
        as $key => $field
    ) {
        $id = $user[$field] ?? "";
        if (preg_match('/^[a-f0-9]{64}$/D', $id)) {
            $file =
                rtrim($config["storage_path"], "/\\") .
                "/assets/" .
                $id .
                ".png";
            if (is_file($file)) {
                $out[$key] =
                    "data:image/png;base64," .
                    base64_encode(file_get_contents($file));
            }
        }
    }
    return $out;
}
