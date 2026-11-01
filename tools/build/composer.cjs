const fs = require("node:fs/promises");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const path = require("node:path");
(async () => {
  await fs.mkdir(".tmp/tools", { recursive: true });
  const installer = await (
    await fetch("https://getcomposer.org/installer")
  ).text();
  const expected = (
    await (await fetch("https://composer.github.io/installer.sig")).text()
  ).trim();
  if (crypto.createHash("sha384").update(installer).digest("hex") !== expected)
    throw Error("Composer installer checksum mismatch");
  const target = path.resolve(".tmp/tools");
  await fs.writeFile(path.join(target, "composer-setup.php"), installer);
  const phpArgs = [
    "-d",
    "date.timezone=America/Chicago",
    "-d",
    "extension=openssl",
    "-d",
    "extension=curl",
    "-d",
    "extension=gd",
    "-d",
    "extension=mbstring",
    "-d",
    "extension=fileinfo",
  ];
  cp.execFileSync(
    "php",
    [
      ...phpArgs,
      path.join(target, "composer-setup.php"),
      `--install-dir=${target}`,
      "--filename=composer.phar",
    ],
    { stdio: "inherit" },
  );
  cp.execFileSync(
    "php",
    [
      ...phpArgs,
      path.join(target, "composer.phar"),
      "install",
      "--working-dir=server",
      "--no-dev",
      "--prefer-dist",
      "--no-interaction",
    ],
    { stdio: "inherit" },
  );
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
