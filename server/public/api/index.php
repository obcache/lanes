<?php
declare(strict_types=1);
namespace Lanes;
require dirname(__DIR__, 2) . "/src/bootstrap.php";
require dirname(__DIR__, 2) . "/src/auth.php";
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");
header("X-Content-Type-Options: nosniff");
header("Referrer-Policy: no-referrer");
try {
    $path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
    $route = preg_replace("#^/api#", "", $path);
    $method = $_SERVER["REQUEST_METHOD"];
    if ($route === "/health") {
        echo json_encode(["status" => "ok", "apiVersion" => 1]);
        exit();
    }
    $config = config();
    $db = db($config);
    if (str_starts_with($route, "/auth/")) {
        auth($route, $db, $config);
        exit();
    }
    $user = identity($db, $config, $method !== "GET");
    if ($route === "/profile" && $method === "GET") {
        $stats = query(
            $db,
            "SELECT COUNT(*) AS plays,MAX(max_combo) AS bestCombo,AVG(accuracy) AS averageAccuracy FROM runs WHERE user_id=?",
            [$user["id"]],
        )->fetch();
        echo json_encode([
            "profile" => profileOutput($user, $config),
            "stats" => $stats,
            "role" => $user["role"],
        ]);
    } elseif ($route === "/profile" && $method === "PUT") {
        $data = jsonBody();
        $name = limitedText($data["displayName"] ?? null, 60);
        requireThat(
            ($data["schemaVersion"] ?? null) === 1,
            "Unsupported profile version.",
        );
        $assets = [];
        foreach (["background", "laneSkin"] as $key) {
            $value = $data[$key] ?? "";
            requireThat(is_string($value), "Invalid artwork.");
            $assets[] = $value !== "" ? imageAsset($value, $config) : null;
        }
        query(
            $db,
            "UPDATE users SET display_name=?,background_asset=?,lane_asset=? WHERE id=?",
            [$name, ...$assets, $user["id"]],
        );
        echo '{"ok":true}';
    } elseif ($route === "/charts" && $method === "POST") {
        $chart = chart(jsonBody());
        $existing = query($db, "SELECT * FROM charts WHERE chart_hash=?", [
            $chart["chart_hash"],
        ])->fetch();
        if (!$existing) {
            $values = array_values($chart);
            try {
                query(
                    $db,
                    "INSERT INTO charts(track_id,title,artist,duration,difficulty,chart_hash,note_count,chart_json) VALUES(?,?,?,?,?,?,?,?)",
                    $values,
                );
            } catch (\PDOException $e) {
                if (
                    !query(
                        $db,
                        "SELECT chart_hash FROM charts WHERE chart_hash=?",
                        [$chart["chart_hash"]],
                    )->fetch()
                ) {
                    throw $e;
                }
            }
        } else {
            requireThat(
                $existing["track_id"] === $chart["track_id"],
                "This chart hash is registered to another track.",
                409,
            );
        }
        echo json_encode(["chartHash" => $chart["chart_hash"]]);
    } elseif ($route === "/runs" && $method === "POST") {
        $data = jsonBody();
        $chart = query($db, "SELECT * FROM charts WHERE chart_hash=?", [
            $data["chartHash"] ?? "",
        ])->fetch();
        requireThat(
            is_array($chart),
            "Register the chart before syncing a score.",
        );
        $run = run($data, $chart);
        $existing = query($db, "SELECT user_id FROM runs WHERE id=?", [
            $run["id"],
        ])->fetch();
        if ($existing) {
            requireThat(
                $existing["user_id"] === $user["id"],
                "Run ID is already in use.",
                409,
            );
            echo '{"ok":true,"duplicate":true}';
            exit();
        }
        $recent = query(
            $db,
            "SELECT COUNT(*) FROM runs WHERE user_id=? AND submitted_at>?",
            [$user["id"], time() - 60],
        )->fetchColumn();
        requireThat(
            (int) $recent < 20,
            "Too many submissions. Try again shortly.",
            429,
        );
        query(
            $db,
            "INSERT INTO runs(id,difficulty,track_id,chart_hash,total,perfect,good,miss,max_combo,score,accuracy,user_id,submitted_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [...array_values($run), $user["id"], time()],
        );
        echo '{"ok":true,"verified":false}';
    } elseif ($route === "/leaderboards" && $method === "GET") {
        $track = validTrack($_GET["track"] ?? null);
        $diff = difficulty($_GET["difficulty"] ?? null);
        $chartHash = $_GET["chartHash"] ?? "";
        requireThat(
            is_string($chartHash) &&
                preg_match('/^[a-f0-9]{64}$/D', $chartHash),
            "Choose a chart version.",
        );
        $rows = query(
            $db,
            "SELECT r.id,u.display_name AS displayName,r.score,r.accuracy,r.max_combo AS maxCombo FROM runs r JOIN users u ON u.id=r.user_id WHERE r.track_id=? AND r.difficulty=? AND r.chart_hash=? AND NOT EXISTS(SELECT 1 FROM runs b WHERE b.user_id=r.user_id AND b.chart_hash=r.chart_hash AND (b.score>r.score OR (b.score=r.score AND b.id<r.id))) ORDER BY r.score DESC,r.accuracy DESC,r.id ASC LIMIT 100",
            [$track, $diff, $chartHash],
        )->fetchAll();
        echo json_encode(["entries" => $rows, "verified" => false]);
    } else {
        throw new HttpError(404, "Route or method not found.");
    }
} catch (HttpError $error) {
    http_response_code($error->status);
    echo json_encode(["error" => $error->getMessage()]);
} catch (\JsonException) {
    http_response_code(400);
    echo '{"error":"Invalid JSON."}';
} catch (\Throwable $error) {
    error_log("LANES API: " . get_class($error) . " " . $error->getMessage());
    http_response_code(503);
    echo '{"error":"Service unavailable. Check server configuration and database migrations."}';
}
