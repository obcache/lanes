const cp = require("node:child_process");
const fs = require("node:fs");
const candidates = [
  process.env.ISCC_PATH,
  "C:/Program Files (x86)/Inno Setup 6/ISCC.exe",
  "C:/Program Files/Inno Setup 6/ISCC.exe",
].filter(Boolean);
const compiler = candidates.find((p) => fs.existsSync(p));
if (!compiler) {
  console.error(
    "Install Inno Setup 6 from https://jrsoftware.org/isdl.php or set ISCC_PATH; run npm run package first.",
  );
  process.exit(1);
}
if (!fs.existsSync("dist/LANES-win32-x64/LANES.exe")) {
  console.error("Run npm run package first.");
  process.exit(1);
}
cp.execFileSync(compiler, ["installer/lanes.iss"], {
  stdio: "inherit",
  windowsHide: true,
});
