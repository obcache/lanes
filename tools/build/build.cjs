const fs = require("node:fs/promises");
const path = require("node:path");
const esbuild = require("esbuild");
const sharp = require("sharp");
(async () => {
  await fs.mkdir("build/electron", { recursive: true });
  await esbuild.build({
    entryPoints: ["electron/main.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    external: ["electron"],
    outfile: "build/electron/main.cjs",
  });
  await esbuild.build({
    entryPoints: ["electron/preload.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    external: ["electron"],
    outfile: "build/electron/preload.cjs",
  });
  await sharp("public/icon.svg")
    .resize(256)
    .png()
    .toFile("dist/renderer/icon.png");
  await fs.mkdir("build/icons", { recursive: true });
  const png = await sharp("public/icon.svg").resize(256).png().toBuffer();
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  await fs.writeFile("build/icons/lanes.ico", Buffer.concat([header, png]));
  const artifactRoot = path.resolve("dist"),
    serverRoot = path.resolve("dist/server");
  if (path.dirname(serverRoot) !== artifactRoot)
    throw Error("Invalid server artifact boundary");
  await fs.rm(serverRoot, { recursive: true, force: true });
  await fs.mkdir(serverRoot, { recursive: true });
  for (const name of [
    "src",
    "public",
    "database",
    "composer.json",
    "composer.lock",
    "config.example.php",
    "vendor",
  ]) {
    try {
      await fs.cp(path.join("server", name), path.join("dist/server", name), {
        recursive: true,
      });
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      if (name === "vendor")
        console.warn(
          "Server dependencies missing: run npm run api:dependencies before production deployment.",
        );
    }
  }
  await fs.cp("dist/renderer", "dist/server/public", { recursive: true });
  console.log(
    "Built renderer, isolated Electron bridge, icons, and server artifact in dist/.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
