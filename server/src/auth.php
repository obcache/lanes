<?php
declare(strict_types=1);
namespace Lanes;
function auth(string $route, \PDO $db, array $config): void
{
    startSession($config);
    if ($route === "/auth/exchange") {
        requireThat(
            $_SERVER["REQUEST_METHOD"] === "POST",
            "Method not allowed.",
            405,
        );
        $data = jsonBody();
        $code = $data["code"] ?? "";
        $verifier = $data["verifier"] ?? "";
        requireThat(
            is_string($code) &&
                preg_match('/^[a-f0-9]{64}$/D', $code) &&
                is_string($verifier) &&
                preg_match('/^[a-zA-Z0-9_-]{43,128}$/D', $verifier),
            "Invalid sign-in exchange.",
            400,
        );
        $db->beginTransaction();
        try {
            $ticket = query(
                $db,
                "SELECT * FROM login_tickets WHERE code_hash=? AND expires_at>?",
                [hash("sha256", $code), time()],
            )->fetch();
            $challenge = rtrim(
                strtr(
                    base64_encode(hash("sha256", $verifier, true)),
                    "+/",
                    "-_",
                ),
                "=",
            );
            requireThat(
                is_array($ticket) &&
                    hash_equals($ticket["challenge"], $challenge),
                "Sign-in ticket is invalid or expired.",
                401,
            );
            $used = query($db, "DELETE FROM login_tickets WHERE code_hash=?", [
                $ticket["code_hash"],
            ]);
            requireThat($used->rowCount() === 1, "Ticket already used.", 401);
            $token = bin2hex(random_bytes(32));
            query(
                $db,
                "INSERT INTO api_tokens(token_hash,user_id,expires_at) VALUES(?,?,?)",
                [hash("sha256", $token), $ticket["user_id"], time() + 28800],
            );
            $db->commit();
            echo json_encode(["token" => $token, "expiresIn" => 28800]);
            return;
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }
    if ($route === "/auth/logout") {
        requireThat(
            $_SERVER["REQUEST_METHOD"] === "POST",
            "Method not allowed.",
            405,
        );
        identity($db, $config, true);
        $authorization = $_SERVER["HTTP_AUTHORIZATION"] ?? "";
        if (preg_match('/^Bearer (.+)$/', $authorization, $m)) {
            query($db, "DELETE FROM api_tokens WHERE token_hash=?", [
                hash("sha256", $m[1]),
            ]);
        }
        $_SESSION = [];
        session_destroy();
        echo '{"ok":true}';
        return;
    }
    requireThat(
        in_array($route, ["/auth/start", "/auth/callback"], true),
        "Not found.",
        404,
    );
    requireThat(
        $_SERVER["REQUEST_METHOD"] === "GET",
        "Method not allowed.",
        405,
    );
    foreach (
        [
            "oidc_issuer",
            "oidc_client_id",
            "oidc_client_secret",
            "player_group",
            "admin_group",
        ]
        as $key
    ) {
        requireThat(
            !empty($config[$key]),
            "Organization SSO has not been configured.",
            503,
        );
    }
    if ($route === "/auth/start") {
        unset($_SESSION["desktop"]);
        if (isset($_GET["callback"])) {
            $callback = desktopCallback($_GET["callback"]);
            $state = $_GET["state"] ?? "";
            $challenge = $_GET["challenge"] ?? "";
            requireThat(
                is_string($state) &&
                    preg_match('/^[a-f0-9]{48}$/D', $state) &&
                    is_string($challenge) &&
                    preg_match('/^[a-zA-Z0-9_-]{43}$/D', $challenge),
                "Invalid desktop sign-in request.",
            );
            $_SESSION["desktop"] = [
                "callback" => $callback,
                "state" => $state,
                "challenge" => $challenge,
            ];
        }
    }
    $autoload = dirname(__DIR__) . "/vendor/autoload.php";
    requireThat(
        is_file($autoload),
        "Install the server Composer dependencies.",
        503,
    );
    require_once $autoload;
    $oidc = new \Jumbojett\OpenIDConnectClient(
        $config["oidc_issuer"],
        $config["oidc_client_id"],
        $config["oidc_client_secret"],
    );
    $oidc->setRedirectURL(
        rtrim($config["base_url"], "/") . "/api/auth/callback",
    );
    $oidc->setCodeChallengeMethod("S256");
    $oidc->addScope(["openid", "profile"]);
    $oidc->authenticate();
    $claims = (array) $oidc->getVerifiedClaims();
    // Identity subjects are exact, case-sensitive values. Never normalize them.
    limitedText($claims["sub"] ?? null, 255);
    limitedText($claims["iss"] ?? null, 500);
    $sub = $claims["sub"];
    $issuer = $claims["iss"];
    requireThat(
        rtrim($issuer, "/") === rtrim($config["oidc_issuer"], "/"),
        "Unexpected identity issuer.",
        403,
    );
    $groups = $claims[$config["oidc_groups_claim"] ?? "groups"] ?? [];
    $role = groupRole(is_array($groups) ? $groups : [], $config);
    $name = substr(
        (string) ($claims["name"] ??
            ($claims["preferred_username"] ?? "Player")),
        0,
        60,
    );
    $user = query($db, "SELECT * FROM users WHERE issuer=? AND subject=?", [
        $issuer,
        $sub,
    ])->fetch();
    if ($user) {
        query($db, "UPDATE users SET role=? WHERE id=?", [$role, $user["id"]]);
        $userId = $user["id"];
    } else {
        $userId = bin2hex(random_bytes(16));
        query(
            $db,
            "INSERT INTO users(id,issuer,subject,display_name,role,created_at) VALUES(?,?,?,?,?,?)",
            [$userId, $issuer, $sub, $name, $role, time()],
        );
    }
    session_regenerate_id(true);
    $_SESSION["user_id"] = $userId;
    $_SESSION["expires_at"] = time() + 28800;
    query($db, "DELETE FROM login_tickets WHERE expires_at<?", [time()]);
    query($db, "DELETE FROM api_tokens WHERE expires_at<?", [time()]);
    if (isset($_SESSION["desktop"])) {
        $desktop = $_SESSION["desktop"];
        unset($_SESSION["desktop"]);
        $code = bin2hex(random_bytes(32));
        query(
            $db,
            "INSERT INTO login_tickets(code_hash,user_id,challenge,expires_at) VALUES(?,?,?,?)",
            [
                hash("sha256", $code),
                $userId,
                $desktop["challenge"],
                time() + 90,
            ],
        );
        header(
            "Location: " .
                $desktop["callback"] .
                "?" .
                http_build_query([
                    "code" => $code,
                    "state" => $desktop["state"],
                ]),
        );
    } else {
        header("Location: " . rtrim($config["base_url"], "/") . "/");
    }
    http_response_code(302);
}
