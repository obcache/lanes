const fs = require("node:fs/promises");
const path = require("node:path");
(async () => {
  const { packager } = await import("@electron/packager");
  const root = path.resolve("build/package-stage");
  await fs.mkdir(root, { recursive: true });
  const pkg = require("../../package.json");
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "lanes",
      productName: "LANES",
      version: pkg.version,
      main: "electron/main.cjs",
      description: pkg.description,
      author: "LANES",
    }),
  );
  await fs.cp("build/electron", path.join(root, "electron"), {
    recursive: true,
  });
  await fs.cp("dist/renderer", path.join(root, "renderer"), {
    recursive: true,
  });
  const paths = await packager({
    dir: root,
    name: "LANES",
    platform: "win32",
    arch: "x64",
    out: "dist",
    overwrite: true,
    asar: true,
    prune: true,
    icon: path.resolve("build/icons/lanes.ico"),
    appVersion: pkg.version,
    executableName: "LANES",
    electronVersion: require("electron/package.json").version,
  });
  console.log("Packaged Windows app:", paths.join(", "));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
