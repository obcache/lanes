const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");
for (const [mode, expected] of [
  ["patch", "0.1.1"],
  ["minor", "0.2.0"],
  ["major", "1.0.0"],
])
  test(`${mode} synchronizes only first-party version targets`, () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lanes-version-"));
    try {
      fs.mkdirSync(path.join(tmp, "tools/project-mgmt"), { recursive: true });
      for (const f of [
        "version-targets.js",
        "version-sync.js",
        "version-show.js",
        "version-bump.js",
      ])
        fs.copyFileSync(
          path.join("tools/project-mgmt", f),
          path.join(tmp, "tools/project-mgmt", f),
        );
      fs.mkdirSync(path.join(tmp, "server/vendor/fake"), { recursive: true });
      fs.mkdirSync(path.join(tmp, "installer"));
      fs.writeFileSync(
        path.join(tmp, "package.json"),
        JSON.stringify({ version: "0.1.0" }),
      );
      fs.writeFileSync(
        path.join(tmp, "package-lock.json"),
        JSON.stringify({
          version: "0.1.0",
          packages: {
            "": { version: "0.1.0" },
            "node_modules/dependency": { version: "8.0.0" },
          },
        }),
      );
      fs.writeFileSync(
        path.join(tmp, "server/composer.json"),
        JSON.stringify({ version: "0.1.0" }),
      );
      fs.writeFileSync(
        path.join(tmp, "server/vendor/fake/package.json"),
        '{"version":"9.9.9"}',
      );
      fs.writeFileSync(path.join(tmp, "VERSION"), "0.1.0");
      fs.writeFileSync(
        path.join(tmp, "installer/lanes.iss"),
        '#define MyAppVersion "0.1.0"\nAppVersion={#MyAppVersion}\n',
      );
      cp.execFileSync(
        process.execPath,
        ["tools/project-mgmt/version-bump.js", mode],
        { cwd: tmp },
      );
      cp.execFileSync(
        process.execPath,
        ["tools/project-mgmt/version-show.js"],
        { cwd: tmp },
      );
      assert.equal(
        JSON.parse(fs.readFileSync(path.join(tmp, "package.json"))).version,
        expected,
      );
      assert.equal(
        JSON.parse(fs.readFileSync(path.join(tmp, "server/composer.json")))
          .version,
        expected,
      );
      const lock = JSON.parse(
        fs.readFileSync(path.join(tmp, "package-lock.json")),
      );
      assert.equal(lock.packages[""].version, expected);
      assert.equal(lock.packages["node_modules/dependency"].version, "8.0.0");
      assert.match(
        fs.readFileSync(path.join(tmp, "installer/lanes.iss"), "utf8"),
        new RegExp(`"${expected}"`),
      );
      assert.equal(
        fs.readFileSync(
          path.join(tmp, "server/vendor/fake/package.json"),
          "utf8",
        ),
        '{"version":"9.9.9"}',
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
