<?php
declare(strict_types=1);
// Isolated HTTP/database fixture. SQLite is used only here; production migrations target MySQL.
if (
    !extension_loaded("pdo_sqlite") ||
    !extension_loaded("curl") ||
    !extension_loaded("gd")
) {
    fwrite(
        STDERR,
        "Enable pdo_sqlite, curl and gd for this test. Use npm run test:api.\n",
    );
    exit(1);
}
$root = dirname(__DIR__, 2);
$tmp = sys_get_temp_dir() . "/lanes-api-" . bin2hex(random_bytes(5));
mkdir($tmp, 0700, true);
$db = new PDO("sqlite:" . $tmp . "/test.db");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec(
    "CREATE TABLE users(id TEXT PRIMARY KEY,issuer TEXT,subject TEXT,display_name TEXT,role TEXT,background_asset TEXT,lane_asset TEXT,created_at INTEGER);CREATE TABLE api_tokens(token_hash TEXT PRIMARY KEY,user_id TEXT,expires_at INTEGER);CREATE TABLE login_tickets(code_hash TEXT PRIMARY KEY,user_id TEXT,challenge TEXT,expires_at INTEGER);CREATE TABLE charts(track_hash TEXT,track_id TEXT,title TEXT,artist TEXT,duration REAL,difficulty TEXT,chart_hash TEXT PRIMARY KEY,note_count INTEGER,chart_json TEXT);CREATE TABLE runs(id TEXT PRIMARY KEY,user_id TEXT,chart_hash TEXT,track_id TEXT,difficulty TEXT,total INTEGER,perfect INTEGER,good INTEGER,miss INTEGER,max_combo INTEGER,score INTEGER,accuracy REAL,submitted_at INTEGER);",
);
$token = bin2hex(random_bytes(32));
$otherToken = bin2hex(random_bytes(32));
$db->prepare(
    "INSERT INTO users(id,issuer,subject,display_name,role,created_at) VALUES(?,?,?,?,?,?)",
)->execute([
    "fixture",
    "https://fixture.invalid",
    "fixture",
    "Fixture Player",
    "player",
    time(),
]);
$db->prepare(
    "INSERT INTO users(id,issuer,subject,display_name,role,created_at) VALUES(?,?,?,?,?,?)",
)->execute([
    "other",
    "https://fixture.invalid",
    "other",
    "Other Player",
    "player",
    time(),
]);
$db->prepare("INSERT INTO api_tokens VALUES(?,?,?)")->execute([
    hash("sha256", $token),
    "fixture",
    time() + 300,
]);
$db->prepare("INSERT INTO api_tokens VALUES(?,?,?)")->execute([
    hash("sha256", $otherToken),
    "other",
    time() + 300,
]);
$socket = stream_socket_server("tcp://127.0.0.1:0");
$address = stream_socket_get_name($socket, false);
fclose($socket);
$port = (int) substr(strrchr($address, ":"), 1);
$base = "http://127.0.0.1:" . $port;
file_put_contents(
    $tmp . "/config.php",
    "<?php return " .
        var_export(
            [
                "base_url" => $base,
                "db_dsn" => "sqlite:" . $tmp . "/test.db",
                "storage_path" => $tmp . "/storage",
            ],
            true,
        ) .
        ";",
);
$env = getenv();
$env["LANES_CONFIG"] = $tmp . "/config.php";
$process = proc_open(
    [
        PHP_BINARY,
        "-d",
        "date.timezone=America/Chicago",
        "-d",
        "extension=pdo_sqlite",
        "-d",
        "extension=gd",
        "-d",
        "extension=curl",
        "-S",
        "127.0.0.1:" . $port,
        "-t",
        $root . "/server/public",
        $root . "/server/router.php",
    ],
    [
        0 => ["pipe", "r"],
        1 => ["file", $tmp . "/server.log", "a"],
        2 => ["file", $tmp . "/server.log", "a"],
    ],
    $pipes,
    $root,
    $env,
);
function req(
    string $path,
    string $method = "GET",
    ?array $body = null,
    ?string $auth = null,
): array {
    global $base;
    $curl = curl_init($base . "/api" . $path);
    $headers = ["Content-Type: application/json"];
    if ($auth) {
        $headers[] = "Authorization: Bearer " . $auth;
    }
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 5,
    ]);
    if ($body !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $raw = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    return [$status, is_string($raw) ? json_decode($raw, true) : null];
}
function test(bool $value, string $name): void
{
    if (!$value) {
        throw new RuntimeException("FAIL " . $name);
    }
    echo "PASS " . $name . "\n";
}
try {
    for ($i = 0; $i < 40; $i++) {
        usleep(50000);
        if (req("/health")[0] === 200) {
            break;
        }
    }
    test(req("/health")[0] === 200, "health route");
    test(req("/profile")[0] === 401, "authentication required");
    test(
        req("/profile", "GET", null, str_repeat("0", 64))[0] === 401,
        "reject forged bearer token",
    );
    test(
        req("/profile", "GET", null, $token)[1]["profile"]["displayName"] ===
            "Fixture Player",
        "authenticated profile",
    );
    $image = imagecreatetruecolor(32, 32);
    $color = imagecolorallocate($image, 170, 240, 80);
    imagefill($image, 0, 0, $color);
    ob_start();
    imagepng($image);
    $png = ob_get_clean();
    $uri = "data:image/png;base64," . base64_encode($png);
    test(
        req(
            "/profile",
            "PUT",
            [
                "schemaVersion" => 1,
                "displayName" => "Updated Player",
                "background" => $uri,
                "laneSkin" => $uri,
            ],
            $token,
        )[0] === 200,
        "validated artwork upload",
    );
    $profile = req("/profile", "GET", null, $token)[1]["profile"];
    test(
        $profile["displayName"] === "Updated Player" &&
            str_starts_with($profile["background"], "data:image/png;base64,"),
        "uploaded appearance round trip",
    );
    test(
        req(
            "/profile",
            "PUT",
            [
                "schemaVersion" => 1,
                "displayName" => "Bad",
                "background" => "data:image/svg+xml;base64,PHN2Zy8+",
                "laneSkin" => "",
            ],
            $token,
        )[0] === 422,
        "reject executable artwork",
    );
    $chart = [
        "version" => 1,
        "difficulty" => "beginner",
        "notes" => [["time" => 1, "lane" => 0], ["time" => 2, "lane" => 2]],
    ];
    $serialized = json_encode($chart);
    $chartHash = hash("sha256", $serialized);
    $registration = [
        "trackId" => "demo-test",
        "title" => "Fixture Song",
        "artist" => "Test",
        "duration" => 3,
        "chart" => $chart,
        "serializedChart" => $serialized,
        "chartHash" => $chartHash,
    ];
    test(
        req("/charts", "POST", $registration, $token)[0] === 200,
        "chart registration",
    );
    test(
        req(
            "/charts",
            "POST",
            [...$registration, "chartHash" => str_repeat("0", 64)],
            $token,
        )[0] === 422,
        "reject mismatched chart hash",
    );
    $run = [
        "id" => "06021af8-6b5f-4826-9a1d-737c9983628e",
        "trackId" => "demo-test",
        "difficulty" => "beginner",
        "chartHash" => $chartHash,
        "total" => 2,
        "perfect" => 1,
        "good" => 1,
        "miss" => 0,
        "score" => 1500,
        "accuracy" => 75,
        "maxCombo" => 2,
    ];
    test(
        req("/runs", "POST", [...$run, "score" => 999999], $token)[0] === 422,
        "reject manipulated score",
    );
    test(req("/runs", "POST", $run, $token)[0] === 200, "score submission");
    test(
        req("/runs", "POST", $run, $token)[1]["duplicate"] === true,
        "idempotent score retry",
    );
    test(
        req("/runs", "POST", $run, $otherToken)[0] === 409,
        "run ownership boundary",
    );
    $board = req(
        "/leaderboards?track=demo-test&difficulty=beginner&chartHash=" .
            $chartHash,
        "GET",
        null,
        $token,
    );
    test(
        count($board[1]["entries"]) === 1 &&
            $board[1]["entries"][0]["score"] === 1500,
        "leaderboard population",
    );
    test(
        req("/profile", "GET", null, $token)[1]["stats"]["plays"] === 1,
        "aggregate statistics",
    );
    test(
        count(
            req(
                "/leaderboards?track=demo-test&difficulty=beginner&chartHash=" .
                    str_repeat("0", 64),
                "GET",
                null,
                $token,
            )[1]["entries"],
        ) === 0,
        "chart version isolation",
    );
    $second = [
        ...$run,
        "id" => "16021af8-6b5f-4826-9a1d-737c9983628e",
        "perfect" => 2,
        "good" => 0,
        "score" => 2000,
        "accuracy" => 100,
    ];
    test(req("/runs", "POST", $second, $token)[0] === 200, "improved score");
    $board = req(
        "/leaderboards?track=demo-test&difficulty=beginner&chartHash=" .
            $chartHash,
        "GET",
        null,
        $token,
    );
    test(
        count($board[1]["entries"]) === 1 &&
            $board[1]["entries"][0]["score"] === 2000,
        "one best score per player",
    );
    $code = bin2hex(random_bytes(32));
    $verifier = rtrim(strtr(base64_encode(random_bytes(32)), "+/", "-_"), "=");
    $challenge = rtrim(
        strtr(base64_encode(hash("sha256", $verifier, true)), "+/", "-_"),
        "=",
    );
    $db->prepare("INSERT INTO login_tickets VALUES(?,?,?,?)")->execute([
        hash("sha256", $code),
        "fixture",
        $challenge,
        time() + 90,
    ]);
    test(
        req("/auth/exchange", "POST", [
            "code" => $code,
            "verifier" => str_repeat("x", 43),
        ])[0] === 401,
        "PKCE verifier enforced",
    );
    $exchanged = req("/auth/exchange", "POST", [
        "code" => $code,
        "verifier" => $verifier,
    ]);
    test(
        $exchanged[0] === 200 && strlen($exchanged[1]["token"]) === 64,
        "single-use desktop login exchange",
    );
    test(
        req("/auth/exchange", "POST", [
            "code" => $code,
            "verifier" => $verifier,
        ])[0] === 401,
        "replayed login ticket rejected",
    );
    test(req("/auth/logout", "POST", [], $token)[0] === 200, "logout");
    test(
        req("/profile", "GET", null, $token)[0] === 401,
        "revoked token rejected",
    );
    // Verify a closed test database can be backed up and restored without losing score data.
    $db = null;
    copy($tmp . "/test.db", $tmp . "/backup.db");
    $restored = new PDO("sqlite:" . $tmp . "/backup.db");
    test(
        (int) $restored->query("SELECT COUNT(*) FROM runs")->fetchColumn() ===
            2,
        "backup restore fixture",
    );
    $restored = null;
    echo "HTTP integration passed. Production MySQL and real identity-provider login still require deployment verification.\n";
} finally {
    proc_terminate($process);
    proc_close($process);
    $db = null;
    $items = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($tmp, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST,
    );
    foreach ($items as $item) {
        $item->isDir()
            ? rmdir($item->getPathname())
            : unlink($item->getPathname());
    }
    rmdir($tmp);
}
