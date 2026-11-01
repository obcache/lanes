<?php
declare(strict_types=1);
namespace Lanes;
final class HttpError extends \RuntimeException
{
    public function __construct(public int $status, string $message)
    {
        parent::__construct($message);
    }
}
function requireThat(bool $valid, string $message, int $status = 422): void
{
    if (!$valid) {
        throw new HttpError($status, $message);
    }
}
function limitedText(mixed $value, int $length): string
{
    requireThat(
        is_string($value) &&
            strlen(trim($value)) > 0 &&
            strlen($value) <= $length,
        "Invalid text field.",
    );
    return trim($value);
}
function validTrack(mixed $id): string
{
    requireThat(
        is_string($id) &&
            preg_match('/^(demo-[a-z]+|[a-f0-9]{64})$/D', $id) === 1,
        "Invalid track ID.",
    );
    return $id;
}
function difficulty(mixed $value): string
{
    requireThat(
        in_array($value, ["beginner", "normal", "expert", "pro"], true),
        "Invalid difficulty.",
    );
    return $value;
}
function uuid(mixed $value): string
{
    requireThat(
        is_string($value) &&
            preg_match(
                '/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/Di',
                $value,
            ) === 1,
        "Invalid run ID.",
    );
    return strtolower($value);
}
function chart(array $data): array
{
    $id = validTrack($data["trackId"] ?? null);
    $title = limitedText($data["title"] ?? null, 200);
    $artist = limitedText($data["artist"] ?? null, 200);
    $duration = $data["duration"] ?? 0;
    requireThat(
        is_numeric($duration) && $duration >= 3 && $duration <= 1800,
        "Invalid track duration.",
    );
    $chart = $data["chart"] ?? [];
    $diff = difficulty($chart["difficulty"] ?? null);
    $notes = $chart["notes"] ?? null;
    requireThat(
        ($chart["version"] ?? null) === 1 &&
            is_array($notes) &&
            count($notes) > 0 &&
            count($notes) <= 50000,
        "Invalid chart.",
    );
    requireThat(
        is_string($data["chartHash"] ?? null) &&
            preg_match('/^[a-f0-9]{64}$/D', $data["chartHash"]) === 1,
        "Invalid chart hash.",
    );
    $lanes = ["beginner" => 3, "normal" => 4, "expert" => 5, "pro" => 5][$diff];
    $last = -1;
    $duplicates = [];
    foreach ($notes as $note) {
        $time = $note["time"] ?? null;
        $lane = $note["lane"] ?? null;
        requireThat(
            is_numeric($time) &&
                is_finite((float) $time) &&
                $time >= 0 &&
                $time <= $duration &&
                $time >= $last &&
                is_int($lane) &&
                $lane >= 0 &&
                $lane < $lanes,
            "Invalid note time or lane.",
        );
        $key = $time . ":" . $lane;
        requireThat(!isset($duplicates[$key]), "Duplicate note.");
        $duplicates[$key] = true;
        $last = $time;
    }
    // JSON bytes are submitted separately so the JS content hash remains exact across runtimes.
    $serialized = $data["serializedChart"] ?? null;
    requireThat(
        is_string($serialized) && strlen($serialized) <= 3_000_000,
        "Missing canonical chart JSON.",
    );
    requireThat(
        json_decode($serialized, true, 32, JSON_THROW_ON_ERROR) === $chart &&
            hash_equals(hash("sha256", $serialized), $data["chartHash"]),
        "Chart checksum mismatch.",
    );
    return [
        "track_id" => $id,
        "title" => $title,
        "artist" => $artist,
        "duration" => (float) $duration,
        "difficulty" => $diff,
        "chart_hash" => $data["chartHash"],
        "note_count" => count($notes),
        "chart_json" => $serialized,
    ];
}
function run(array $data, array $chart): array
{
    $id = uuid($data["id"] ?? null);
    $diff = difficulty($data["difficulty"] ?? null);
    $track = validTrack($data["trackId"] ?? null);
    requireThat(
        $track === $chart["track_id"] &&
            $diff === $chart["difficulty"] &&
            ($data["chartHash"] ?? "") === $chart["chart_hash"],
        "Run does not match chart.",
    );
    foreach (
        ["total", "perfect", "good", "miss", "maxCombo", "score"]
        as $field
    ) {
        requireThat(
            isset($data[$field]) &&
                is_int($data[$field]) &&
                $data[$field] >= 0 &&
                $data[$field] <= 50_000_000,
            "Invalid score counts.",
        );
    }
    requireThat(
        $data["total"] === (int) $chart["note_count"] &&
            $data["total"] > 0 &&
            $data["perfect"] + $data["good"] + $data["miss"] === $data["total"],
        "Invalid judgement totals.",
    );
    requireThat(
        $data["maxCombo"] <= $data["perfect"] + $data["good"],
        "Invalid combo.",
    );
    $score = $data["perfect"] * 1000 + $data["good"] * 500;
    $accuracy = round(
        (($data["perfect"] + $data["good"] * 0.5) / $data["total"]) * 100,
        2,
    );
    requireThat(
        $data["score"] === $score &&
            isset($data["accuracy"]) &&
            is_numeric($data["accuracy"]) &&
            abs($data["accuracy"] - $accuracy) < 0.011,
        "Invalid calculated score.",
    );
    return [
        "id" => $id,
        "difficulty" => $diff,
        "track_id" => $track,
        "chart_hash" => $chart["chart_hash"],
        "total" => $data["total"],
        "perfect" => $data["perfect"],
        "good" => $data["good"],
        "miss" => $data["miss"],
        "max_combo" => $data["maxCombo"],
        "score" => $score,
        "accuracy" => $accuracy,
    ];
}
function groupRole(array $groups, array $config): string
{
    if (
        !empty($config["admin_group"]) &&
        in_array($config["admin_group"], $groups, true)
    ) {
        return "admin";
    }
    if (
        !empty($config["player_group"]) &&
        in_array($config["player_group"], $groups, true)
    ) {
        return "player";
    }
    throw new HttpError(
        403,
        "Your identity provider has not assigned a LANES role.",
    );
}
function desktopCallback(mixed $callback): string
{
    requireThat(
        is_string($callback) &&
            preg_match(
                '#^http://127\.0\.0\.1:([0-9]{2,5})/callback$#D',
                $callback,
                $match,
            ) === 1 &&
            (int) $match[1] >= 1024 &&
            (int) $match[1] <= 65535,
        "Invalid desktop callback.",
    );
    return $callback;
}
