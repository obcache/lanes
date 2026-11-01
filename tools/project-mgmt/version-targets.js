const fs = require("node:fs");
const path = require("node:path");
const targets = [
  ["package.json", "json"],
  ["package-lock.json", "lock"],
  ["VERSION", "text"],
  ["server/composer.json", "json"],
  ["installer/lanes.iss", "inno"],
];
function read(root, file, kind) {
  const value = fs.readFileSync(path.join(root, file), "utf8");
  if (kind === "json" || kind === "lock") return JSON.parse(value).version;
  if (kind === "inno")
    return value.match(/#define MyAppVersion "([^"]+)"/)?.[1];
  return value.trim();
}
module.exports = { targets, read };
