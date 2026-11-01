#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { targets, read } = require("./version-targets");
const root = process.cwd();
const expected = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
let mismatch = false;
for (const [file, kind] of targets) {
  if (!fs.existsSync(path.join(root, file))) continue;
  const version = read(root, file, kind);
  console.log(`${file}: ${version}`);
  if (version !== expected) mismatch = true;
  if (kind === "lock") {
    const lock = JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
    if (lock.packages?.[""]?.version !== expected) mismatch = true;
  }
}
if (mismatch) {
  console.error("Version mismatch. Run npm run version:sync.");
  process.exit(1);
}
