const fs = require("node:fs");
const manifest = require("../project-mgmt/manifest.json");
const pkg = require("../../package.json");
let failed = false;
for (const file of [
  ...manifest.layout.docs,
  ...manifest.layout.tools,
  ...manifest.implementation.sourceFiles,
]) {
  if (!fs.existsSync(file)) {
    console.error("MISSING", file);
    failed = true;
  }
}
for (const name of manifest.implementation.commands) {
  if (!pkg.scripts[name]) {
    console.error("MISSING command", name);
    failed = true;
  }
}
if (manifest.artifactBoundary !== "dist/")
  throw Error("Artifact boundary drift");
if (failed) process.exit(1);
console.log(
  "Scaffold reconciled: documentation, source paths, commands, and dist/ boundary exist.",
);
