<?php
declare(strict_types=1);
require __DIR__ . "/../src/domain.php";
use function Lanes\{requireThat, chart, run, groupRole, desktopCallback};
use Lanes\HttpError;
function check(bool $value, string $message): void
{
    if (!$value) {
        throw new RuntimeException($message);
    }
}
function rejects(callable $fn): void
{
    try {
        $fn();
    } catch (HttpError) {
        return;
    }
    throw new RuntimeException("Expected validation failure.");
}
$notes = [
    "version" => 1,
    "difficulty" => "beginner",
    "notes" => [["time" => 1, "lane" => 0], ["time" => 2, "lane" => 2]],
];
$json = json_encode($notes);
$data = [
    "trackId" => "demo-test",
    "title" => "Test",
    "artist" => "Test",
    "duration" => 3,
    "chart" => $notes,
    "serializedChart" => $json,
    "chartHash" => hash("sha256", $json),
];
$chart = chart($data);
check($chart["note_count"] === 2, "Chart note count");
$run = [
    "id" => "06021af8-6b5f-4826-9a1d-737c9983628e",
    "trackId" => "demo-test",
    "difficulty" => "beginner",
    "chartHash" => $data["chartHash"],
    "total" => 2,
    "perfect" => 1,
    "good" => 1,
    "miss" => 0,
    "score" => 1500,
    "accuracy" => 75,
    "maxCombo" => 2,
];
check(run($run, $chart)["score"] === 1500, "Score calculation");
rejects(fn() => run([...$run, "score" => 999999], $chart));
rejects(fn() => run([...$run, "miss" => 1], $chart));
rejects(fn() => chart([...$data, "chartHash" => str_repeat("0", 64)]));
$bad = $data;
$bad["chart"]["notes"][0]["lane"] = 3;
rejects(fn() => chart($bad));
check(
    groupRole(
        ["players"],
        ["player_group" => "players", "admin_group" => "admins"],
    ) === "player",
    "Player role",
);
rejects(
    fn() => groupRole(
        ["random"],
        ["player_group" => "players", "admin_group" => "admins"],
    ),
);
check(
    groupRole(
        ["admins"],
        ["player_group" => "players", "admin_group" => "admins"],
    ) === "admin",
    "Admin allowlist",
);
check(
    desktopCallback("http://127.0.0.1:51477/callback") ===
        "http://127.0.0.1:51477/callback",
    "Loopback callback",
);
rejects(fn() => desktopCallback("https://evil.example/callback"));
rejects(fn() => desktopCallback("http://127.0.0.1:0/callback"));
echo "PHP domain: chart checksums, lane limits, counts, scores, roles and redirect validation passed.\n";
