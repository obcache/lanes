import fs from "node:fs/promises";
import path from "node:path";
import { schemas, type StoreName } from "../src/shared/model";
import type { z } from "zod";
export class JsonStore {
  private pending: Promise<void> = Promise.resolve();
  constructor(readonly root: string) {}
  private file(name: unknown) {
    if (typeof name !== "string" || !Object.hasOwn(schemas, name))
      throw Error("Unknown store");
    return path.join(this.root, `${name}.json`);
  }
  async read<N extends StoreName>(
    name: N,
  ): Promise<z.infer<(typeof schemas)[N]> | null> {
    try {
      return schemas[name].parse(
        JSON.parse(await fs.readFile(this.file(name), "utf8")),
      ) as z.infer<(typeof schemas)[N]>;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw Error(
        `Invalid ${name}.json. Restore its .bak file or a JSON export. Original preserved.`,
      );
    }
  }
  async write(name: StoreName, value: unknown) {
    const file = this.file(name),
      valid = schemas[name].parse(value);
    const operation = async () => {
      await fs.mkdir(this.root, { recursive: true });
      const temporary = `${file}.tmp`;
      await fs.writeFile(temporary, JSON.stringify(valid, null, 2), "utf8");
      try {
        await fs.copyFile(file, `${file}.bak`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      await fs.rename(temporary, file);
    };
    const next = this.pending.then(operation);
    this.pending = next.catch(() => {});
    await next;
  }
}
