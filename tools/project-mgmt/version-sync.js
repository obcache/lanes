#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { targets } = require("./version-targets");
const root = process.cwd();
const args = process.argv.slice(2);
const version =
  args[0] === "--set"
    ? args[1]
    : args[0] || JSON.parse(fs.readFileSync("package.json", "utf8")).version;
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error("Invalid version.");
  process.exit(1);
}
for (const [file, kind] of targets) {
  const target = path.join(root, file);
  if (!fs.existsSync(target)) continue;
  const old = fs.readFileSync(target, "utf8");
  let next;
  if (kind === "json" || kind === "lock") {
    const json = JSON.parse(old);
    json.version = version;
    if (kind === "lock" && json.packages?.[""])
      json.packages[""].version = version;
    next = JSON.stringify(json, null, 2) + "\n";
  } else if (kind === "inno")
    next = old.replace(
      /(#define MyAppVersion ")[^"]+(")/,
      (_, prefix, suffix) => prefix + version + suffix,
    );
  else next = version + "\n";
  if (next !== old) {
    fs.writeFileSync(target, next);
    console.log(`Updated ${file}`);
  }
}
console.log(`Version: ${version}. Rebuild artifacts after changing versions.`);
