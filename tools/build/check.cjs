const fs = require("node:fs");
const cp = require("node:child_process");
const paths = [
  "dist/renderer/index.html",
  "dist/renderer/icon.png",
  "dist/server/public/api/index.php",
  "dist/server/src/auth.php",
  "dist/server/database/migrations/001_initial.sql",
  "dist/server/vendor/autoload.php",
  "dist/LANES-win32-x64/LANES.exe",
  `dist/installer/LANES-${require("../../package.json").version}-Setup.exe`,
];
let failed = false;
for (const file of paths) {
  const ok = fs.existsSync(file);
  console.log(`${ok ? "OK" : "MISSING"} ${file}`);
  if (!ok) failed = true;
}
for (const file of [".env", ".env.local", "config.local.php"])
  for (const folder of ["dist/server", "dist/server/public", "dist/renderer"])
    if (fs.existsSync(`${folder}/${file}`)) {
      console.error("Runtime configuration in artifact:", file);
      failed = true;
    }
cp.execFileSync(process.execPath, ["tools/project-mgmt/version-show.js"], {
  stdio: "inherit",
});
if (failed) process.exit(1);
console.log(
  "Artifacts ready for review. Apply MySQL migration and configure SSO before deployment.",
);
