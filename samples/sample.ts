// one line for each role a typescript file can show.
import { readFile } from "node:fs/promises";

namespace shapes {
  export type Id = string | number;
}

function sealed<T extends new (...args: never[]) => object>(target: T): T {
  return Object.seal(target);
}

@sealed
class Circle {
  static readonly unit = 1e-3;
  constructor(
    readonly id: shapes.Id,
    private radius = 0xff,
  ) {}
  get area(): number {
    return Math.PI * this.radius ** 2 * Circle.unit;
  }
}

async function load(path: string): Promise<Circle[]> {
  const text = await readFile(path, "utf8");
  outer: for (const line of text.split("\n")) {
    if (/^\s*#\d+/u.test(line)) continue outer;
    console.log(`${line.length}:\t${line}`, line === "" ? null : true);
  }
  return [new Circle(path)];
}

load(import.meta.filename).then(([circle]) => circle.area);
